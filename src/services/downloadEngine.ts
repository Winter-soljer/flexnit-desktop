import axios from "axios";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const STREAMLINK_LOCAL = "http://127.0.0.1:8000";
const STREAMLINK_CLOUD = "https://streamlink-pwlo23z5hq-uc.a.run.app";
const FLEXNIT_WEB = "https://flexnitweb.web.app";
const API_KEY = "flexnit-streamlink-secret-2026";

const isTauri = typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);

export interface DownloadProgressInfo {
  progress: number;
  status: "queued" | "downloading" | "completed" | "failed";
  phase?: string;
  speed?: string;
  eta?: string;
  fileUrl?: string;
  filePath?: string;
  error?: string;
}

export class DownloadEngine {
  private activeEndpoint: string | null = null;
  private activePollers = new Map<string, ReturnType<typeof setTimeout>>();
  private progressCallbacks = new Map<string, (info: DownloadProgressInfo) => void>();
  private unlistenPromise: Promise<UnlistenFn> | null = null;

  constructor() {
    this.initTauriListener();
  }

  private initTauriListener() {
    if (!isTauri) return;
    try {
      this.unlistenPromise = listen("download-progress", (event: any) => {
        const payload = event.payload;
        if (!payload || !payload.id) return;

        const cb = this.progressCallbacks.get(payload.id);
        if (cb) {
          let fileUrl: string | undefined = undefined;
          if (payload.file_path) {
            try {
              fileUrl = convertFileSrc(payload.file_path);
            } catch (e) {
              console.warn("Failed to convert file src:", e);
              fileUrl = payload.file_path;
            }
          }

          cb({
            progress: typeof payload.progress === "number" ? Math.round(payload.progress * 10) / 10 : 0,
            status: payload.status,
            phase: payload.phase,
            speed: payload.speed || undefined,
            eta: payload.eta || undefined,
            fileUrl: fileUrl,
            filePath: payload.file_path || undefined,
            error: payload.error || undefined,
          });

          if (payload.status === "completed" || payload.status === "failed") {
            this.progressCallbacks.delete(payload.id);
          }
        }
      });
    } catch (e) {
      console.warn("Failed to initialize Tauri download progress listener:", e);
    }
  }

  /**
   * Discovers the best StreamLink service endpoint for web fallback
   */
  async getEndpoint(preferLocal = true): Promise<string> {
    if (this.activeEndpoint && preferLocal) {
      return this.activeEndpoint;
    }

    // Try local StreamLink service first
    try {
      const res = await axios.get(`${STREAMLINK_LOCAL}/health`, { timeout: 1200 });
      if (res.data && res.data.status === "ok") {
        this.activeEndpoint = STREAMLINK_LOCAL;
        return STREAMLINK_LOCAL;
      }
    } catch {
      // Local daemon not reachable
    }

    // Fall back to Cloud Run
    this.activeEndpoint = STREAMLINK_CLOUD;
    return STREAMLINK_CLOUD;
  }

  /**
   * Resolves the highest quality direct stream (.m3u8 or YouTube URL)
   */
  async resolveSourceUrl(
    mediaType: "movie" | "series" | "african",
    mediaId: number,
    season?: number,
    episode?: number,
    youtubeKey?: string | null
  ): Promise<string> {
    if (mediaType === "african") {
      const key = youtubeKey || String(mediaId);
      return `https://www.youtube.com/watch?v=${key}`;
    }

    // TMDB Movie or TV Series -> resolve through flexnitweb HLS cluster
    try {
      const url =
        mediaType === "series" && season && episode
          ? `${FLEXNIT_WEB}/api/tmdb/stream/${mediaId}/${season}/${episode}`
          : `${FLEXNIT_WEB}/api/tmdb/stream/${mediaId}?type=${mediaType}`;

      const res = await axios.get(url, { timeout: 6000 });
      if (res.data && res.data.resolved && res.data.streamUrl) {
        return res.data.streamUrl;
      }
    } catch (e) {
      console.warn("Failed to resolve TMDB stream via web API, using fallback:", e);
    }

    // Fallback to VidSpark embed URL for extraction
    if (mediaType === "series") {
      return `https://vidspark.to/tv/${mediaId}-${season || 1}-${episode || 1}`;
    }
    return `https://vidspark.to/movie/${mediaId}`;
  }

  /**
   * Starts an active background download:
   * 1. If running inside Tauri desktop app, uses embedded yt-dlp + ffmpeg sidecar
   * 2. If running inside web browser, uses StreamLink HTTP daemon / Cloud Run
   */
  async startDownload(
    downloadId: string,
    sourceUrl: string,
    onProgress: (info: DownloadProgressInfo) => void,
    title?: string
  ): Promise<string | null> {
    if (isTauri) {
      this.progressCallbacks.set(downloadId, onProgress);
      try {
        onProgress({
          progress: 1,
          status: "downloading",
          phase: "Starting native sidecar engine...",
        });

        await invoke("start_native_download", {
          request: {
            id: downloadId,
            title: title || downloadId,
            source_url: sourceUrl,
          },
        });

        return downloadId;
      } catch (err: any) {
        this.progressCallbacks.delete(downloadId);
        const msg = typeof err === "string" ? err : err?.message || "Native sidecar failed";
        onProgress({
          progress: 0,
          status: "failed",
          phase: "Failed",
          error: msg,
        });
        return null;
      }
    }

    // Web Fallback: StreamLink service
    const isYouTube = sourceUrl.includes("youtube.com") || sourceUrl.includes("youtu.be");
    let endpoint = await this.getEndpoint(true);

    if (isYouTube && endpoint !== STREAMLINK_LOCAL) {
      try {
        const res = await axios.get(`${STREAMLINK_LOCAL}/health`, { timeout: 2000 });
        if (res.data?.status === "ok") {
          endpoint = STREAMLINK_LOCAL;
        }
      } catch {
        // Fall back
      }
    }

    try {
      onProgress({
        progress: 2,
        status: "downloading",
        phase: "Connecting to StreamLink pipeline...",
      });

      const res = await axios.post(
        `${endpoint}/api/v1/download`,
        { url: sourceUrl, format: "mp4" },
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
          },
          timeout: 15000,
        }
      );

      const data = res.data;
      if (!data || !data.job_id) {
        throw new Error(data?.message || "Failed to initialize download job");
      }

      const jobId = data.job_id;
      this.pollJob(downloadId, jobId, endpoint, onProgress);
      return jobId;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to start download";
      onProgress({
        progress: 0,
        status: "failed",
        phase: "Failed",
        error: String(msg),
      });
      return null;
    }
  }

  private pollJob(
    downloadId: string,
    jobId: string,
    endpoint: string,
    onProgress: (info: DownloadProgressInfo) => void
  ) {
    if (this.activePollers.has(downloadId)) {
      clearInterval(this.activePollers.get(downloadId)!);
    }

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${endpoint}/api/v1/jobs/${jobId}`, {
          headers: { "X-API-Key": API_KEY },
          timeout: 8000,
        });

        const job = res.data;
        if (!job) return;

        if (job.status === "completed") {
          clearInterval(interval);
          this.activePollers.delete(downloadId);

          const directDownloadUrl = `${endpoint}/api/v1/jobs/${jobId}/download`;
          onProgress({
            progress: 100,
            status: "completed",
            phase: "Ready (Saved)",
            fileUrl: directDownloadUrl,
          });
        } else if (job.status === "failed") {
          clearInterval(interval);
          this.activePollers.delete(downloadId);

          onProgress({
            progress: 0,
            status: "failed",
            phase: "Failed",
            error: job.error || "Extraction failed. The stream or server timed out.",
          });
        } else {
          onProgress({
            progress: typeof job.progress === "number" ? Math.round(job.progress * 10) / 10 : 5,
            status: "downloading",
            phase: job.phase || "Downloading media stream...",
            speed: job.speed || undefined,
            eta: job.eta || undefined,
          });
        }
      } catch (e: any) {
        console.warn("StreamLink poll tick error:", e);
      }
    }, 1500);

    this.activePollers.set(downloadId, interval);
  }

  destroy() {
    if (this.unlistenPromise) {
      this.unlistenPromise.then((unlisten) => unlisten()).catch(() => {});
      this.unlistenPromise = null;
    }
  }

  cancelDownload(downloadId: string) {
    if (isTauri) {
      this.progressCallbacks.delete(downloadId);
      invoke("cancel_native_download", { id: downloadId }).catch(() => {});
    }
    if (this.activePollers.has(downloadId)) {
      clearInterval(this.activePollers.get(downloadId)!);
      this.activePollers.delete(downloadId);
    }
  }

  openInFolder(filePath: string) {
    if (isTauri && filePath) {
      invoke("open_in_folder", { filePath }).catch(() => {});
    }
  }
}

export const downloadEngine = new DownloadEngine();
