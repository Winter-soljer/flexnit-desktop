import axios from "axios";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { SEED_AFRICAN_MOVIES } from "./africanSeed";

const STREAMLINK_LOCAL = "http://127.0.0.1:8000";
const STREAMLINK_HF =
  typeof window !== "undefined" && localStorage.getItem("flexnit_streamlink_hf_url")
    ? localStorage.getItem("flexnit_streamlink_hf_url")!
    : "https://techfisher-streamlink.hf.space";
const STREAMLINK_CLOUD = "https://streamlink-287510183054.us-central1.run.app";
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
   * Discovers the best StreamLink service endpoint:
   * 1. Hugging Face Spaces (Primary high-speed 16-stream cluster)
   * 2. Local StreamLink daemon (if running on port 8000)
   * 3. Google Cloud Run (Automatic fallback if Hugging Face is asleep or unavailable)
   */
  async getEndpoint(preferCached = true): Promise<string> {
    if (this.activeEndpoint && preferCached) {
      return this.activeEndpoint;
    }

    // 1. Try Hugging Face Spaces FIRST as main cloud backend
    try {
      const hfRes = await axios.get(`${STREAMLINK_HF}/health`, {
        headers: { "X-API-Key": API_KEY },
        timeout: 4000,
      });
      if (hfRes.data && (hfRes.data.status === "ok" || typeof hfRes.data === "object")) {
        this.activeEndpoint = STREAMLINK_HF;
        console.log("[downloadEngine] Active primary backend: Hugging Face Spaces");
        return STREAMLINK_HF;
      }
    } catch (e) {
      console.warn("[downloadEngine] Hugging Face backend unreachable, testing fallbacks...", e);
    }

    // 2. Try local StreamLink daemon if active
    try {
      const res = await axios.get(`${STREAMLINK_LOCAL}/health`, { timeout: 1200 });
      if (res.data && res.data.status === "ok") {
        this.activeEndpoint = STREAMLINK_LOCAL;
        return STREAMLINK_LOCAL;
      }
    } catch {
      // Local daemon not reachable
    }

    // 3. Fall back to Google Cloud Run ONLY when Hugging Face fails
    console.log("[downloadEngine] Falling back to Google Cloud Run backup backend");
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
    youtubeKey?: string | null,
    title?: string
  ): Promise<string> {
    if (mediaType === "african") {
      // 1. Check if provided youtubeKey is already a valid 11-char YouTube ID
      if (youtubeKey && /^[a-zA-Z0-9_-]{11}$/.test(youtubeKey.trim())) {
        return `https://www.youtube.com/watch?v=${youtubeKey.trim()}`;
      }

      // 2. Lookup in SEED_AFRICAN_MOVIES by ID
      const foundById = SEED_AFRICAN_MOVIES.find((m) => m.id === mediaId);
      if (foundById?.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(foundById.youtubeVideoId.trim())) {
        return `https://www.youtube.com/watch?v=${foundById.youtubeVideoId.trim()}`;
      }

      // 3. Lookup in SEED_AFRICAN_MOVIES by Title
      if (title) {
        const normTitle = title.toLowerCase().trim();
        const foundByTitle = SEED_AFRICAN_MOVIES.find(
          (m) =>
            m.title.toLowerCase().trim() === normTitle ||
            m.title.toLowerCase().includes(normTitle) ||
            normTitle.includes(m.title.toLowerCase().trim())
        );
        if (foundByTitle?.youtubeVideoId && /^[a-zA-Z0-9_-]{11}$/.test(foundByTitle.youtubeVideoId.trim())) {
          return `https://www.youtube.com/watch?v=${foundByTitle.youtubeVideoId.trim()}`;
        }
      }

      // 4. If youtubeKey is a full URL, use it
      if (youtubeKey && (youtubeKey.includes("youtube.com") || youtubeKey.includes("youtu.be"))) {
        return youtubeKey;
      }

      // 5. Fail-safe: query yt-dlp to search YouTube by title to find the movie
      const cleanTitle = (title || `African Movie ${mediaId}`)
        .replace(/[^a-zA-Z0-9 ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return `ytsearch1:${cleanTitle} Nollywood full movie`;
    }

    // TMDB Movie or TV Series: Resolve direct HLS stream (.m3u8) from Vidspark Vidora cluster
    const check = await this.checkTmdbStream(mediaId, mediaType, season, episode);
    if (check.resolved && check.streamUrl) {
      return check.streamUrl;
    }

    // If direct stream is not available in the cluster, throw clear error for automated retry
    throw new Error(
      "Direct stream not available in provider cluster. Click Retry to re-check."
    );
  }

  /**
   * Checks whether a TMDB title has an indexed direct HLS stream (.m3u8)
   * In desktop (Tauri) mode, the check runs from the Rust backend to bypass CORS.
   */
  async checkTmdbStream(
    mediaId: number,
    mediaType: "movie" | "series" = "movie",
    season?: number,
    episode?: number
  ): Promise<{ resolved: boolean; streamUrl?: string; vidsparkUrl: string }> {
    const isTv = mediaType === "series" && season !== undefined && episode !== undefined;
    const vidsparkUrl = isTv
      ? `https://vidspark.to/tv/${mediaId}/${season}/${episode}`
      : `https://vidspark.to/movie/${mediaId}`;

    // ── Desktop mode: use Rust backend to bypass browser CORS restrictions ──
    if (isTauri) {
      try {
        const result: { resolved: boolean; stream_url: string | null; vidspark_url: string; error: string | null } =
          await invoke("check_tmdb_stream", {
            mediaId: mediaId,
            mediaType: mediaType,
            season: season ?? null,
            episode: episode ?? null,
          });
        console.log("[checkTmdbStream] Rust result:", result);
        return {
          resolved: result.resolved,
          streamUrl: result.stream_url ?? undefined,
          vidsparkUrl: result.vidspark_url,
        };
      } catch (err: any) {
        console.warn("[checkTmdbStream] Rust invoke failed:", err);
        // Fall through to web-side check as last resort
      }
    }

    // ── Web fallback: check local flexnitweb server if running (port 8080) ──
    try {
      const localUrl = isTv
        ? `http://localhost:8080/api/tmdb/stream/${mediaId}/${season}/${episode}`
        : `http://localhost:8080/api/tmdb/stream/${mediaId}?type=movie`;
      const localRes = await axios.get(localUrl, { timeout: 1500 });
      if (localRes.data?.resolved && localRes.data?.streamUrl) {
        return {
          resolved: true,
          streamUrl: localRes.data.streamUrl,
          vidsparkUrl,
        };
      }
    } catch {
      // Local web backend not running or not responding
    }

    // ── Web fallback: check Vidora cluster API directly (only works if CORS allows) ──
    const VIDSPARK_PLAYER_KEY = "3a67e8866ae1d2bb9e81fe7f73315a56eb3bdf5e3e755c7554c8be6910aa6b13";
    const apiUrl = isTv
      ? `https://vidspark.to/api/vidora/v1/tv/${mediaId}/${season}/${episode}`
      : `https://vidspark.to/api/vidora/v1/movie/${mediaId}`;

    // Try up to 2 times with a 15-second timeout (cluster scraping can take 8-12 seconds on cold titles)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await axios.get(apiUrl, {
          headers: {
            "x-player-key": VIDSPARK_PLAYER_KEY,
            "Referer": vidsparkUrl,
            "Origin": "https://vidspark.to",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
          },
          timeout: 15000,
        });

        if (res.data?.result && Array.isArray(res.data?.sources) && res.data.sources[0]?.url) {
          return {
            resolved: true,
            streamUrl: res.data.sources[0].url,
            vidsparkUrl,
          };
        }
      } catch (err: any) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    return {
      resolved: false,
      vidsparkUrl,
    };
  }

  /**
   * Starts an active background download:
   * 1. If running inside Tauri desktop app AND source is direct media or YouTube:
   *    Uses embedded native yt-dlp + ffmpeg sidecar.
   * 2. If source is an embed player URL (vidspark, etc.) OR running on web:
   *    Uses StreamLink extraction pipeline (local daemon or Cloud Run).
   */
  async startDownload(
    downloadId: string,
    sourceUrl: string,
    onProgress: (info: DownloadProgressInfo) => void,
    title?: string
  ): Promise<string | null> {
    // Safety guard: If an embed webpage URL is accidentally passed, fail cleanly
    if (sourceUrl.includes("vidspark.to/movie/") || sourceUrl.includes("vidspark.to/tv/")) {
      onProgress({
        progress: 0,
        status: "failed",
        phase: "Failed",
        error: "Direct stream not pre-indexed. Click Retry to re-check.",
      });
      return null;
    }

    const isYouTube =
      sourceUrl.includes("youtube.com") ||
      sourceUrl.includes("youtu.be") ||
      sourceUrl.startsWith("ytsearch");

    const isDirectHls =
      sourceUrl.includes(".m3u8") ||
      sourceUrl.includes(".mp4") ||
      sourceUrl.includes("vidora");

    // Native yt-dlp sidecar is used for YouTube and direct HLS streams in desktop mode
    if (isTauri && (isYouTube || isDirectHls)) {
      this.progressCallbacks.set(downloadId, onProgress);
      try {
        onProgress({
          progress: 1,
          status: "downloading",
          phase: "Starting high-speed sidecar engine...",
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
        console.warn("Native sidecar failed to spawn, falling back to StreamLink:", msg);
        return this.startStreamLinkDownload(downloadId, sourceUrl, onProgress, title);
      }
    }

    // For HLS .m3u8 streams (TMDB titles) and web fallback: Route to StreamLink microservice
    return this.startStreamLinkDownload(downloadId, sourceUrl, onProgress, title);
  }

  private async startStreamLinkDownload(
    downloadId: string,
    sourceUrl: string,
    onProgress: (info: DownloadProgressInfo) => void,
    title?: string
  ): Promise<string | null> {
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

      let res;
      try {
        res = await axios.post(
          `${endpoint}/api/streamlink/download`,
          { url: sourceUrl, stream_url: sourceUrl, format: "mp4" },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
            timeout: 15000,
          }
        );
      } catch (postErr) {
        // Fallback to /api/v1/download
        res = await axios.post(
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
      }

      let data = res?.data;
      let jobId = data?.job_id || data?.id;

      // If primary endpoint (Hugging Face) failed to return a JSON job_id, seamlessly fall back to GCloud Run
      if ((!data || !jobId) && endpoint !== STREAMLINK_CLOUD) {
        console.warn("[downloadEngine] Primary endpoint failed to create job, falling back to Google Cloud Run...");
        endpoint = STREAMLINK_CLOUD;
        this.activeEndpoint = STREAMLINK_CLOUD;
        const fallbackRes = await axios.post(
          `${STREAMLINK_CLOUD}/api/v1/download`,
          { url: sourceUrl, format: "mp4" },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": API_KEY,
            },
            timeout: 20000,
          }
        );
        data = fallbackRes.data;
        jobId = data?.job_id || data?.id;
      }

      if (!data || !jobId) {
        throw new Error(data?.message || "Failed to initialize download job on any backend");
      }

      this.pollJob(downloadId, jobId, endpoint, onProgress, title);
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
    onProgress: (info: DownloadProgressInfo) => void,
    title?: string
  ) {
    if (this.activePollers.has(downloadId)) {
      clearInterval(this.activePollers.get(downloadId)!);
    }

    const interval = setInterval(async () => {
      try {
        let res;
        try {
          res = await axios.get(`${endpoint}/api/streamlink/jobs/${jobId}`, {
            headers: { "X-API-Key": API_KEY },
            timeout: 8000,
          });
        } catch {
          res = await axios.get(`${endpoint}/api/v1/jobs/${jobId}`, {
            headers: { "X-API-Key": API_KEY },
            timeout: 8000,
          });
        }

        const job = res.data;
        if (!job) return;

        if (job.status === "completed") {
          clearInterval(interval);
          this.activePollers.delete(downloadId);

          const directDownloadUrl = `${endpoint}/api/streamlink/jobs/${jobId}/download`;

          // If in Tauri desktop app, save the completed stream to local disk via native sidecar
          if (isTauri) {
            onProgress({
              progress: 98,
              status: "downloading",
              phase: "Saving to local disk...",
              fileUrl: directDownloadUrl,
            });

            try {
              this.progressCallbacks.set(downloadId, onProgress);
              await invoke("start_native_download", {
                request: {
                  id: downloadId,
                  title: title || downloadId,
                  source_url: directDownloadUrl,
                },
              });
              return;
            } catch (saveErr) {
              console.warn("Sidecar disk save failed, using direct download URL:", saveErr);
            }
          }

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
    }, 900);

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

  async deleteDownloadedFile(filePath?: string, title?: string): Promise<boolean> {
    if (!isTauri) return true;
    try {
      await invoke("delete_download_file", {
        filePath: filePath || null,
        title: title || null,
      });
      return true;
    } catch (e) {
      console.warn("Failed to delete downloaded file:", e);
      return false;
    }
  }
}

export const downloadEngine = new DownloadEngine();
