import { create } from "zustand";
import { DownloadItem } from "../types/streaming";
import { downloadEngine, DownloadProgressInfo } from "../services/downloadEngine";
import { SEED_AFRICAN_MOVIES } from "../services/africanSeed";

interface DownloadState {
  downloads: DownloadItem[];
  addDownload: (
    mediaId: number,
    mediaType: "movie" | "series" | "african",
    title: string,
    posterUrl?: string | null,
    backdropUrl?: string | null,
    season?: number,
    episode?: number,
    episodeTitle?: string,
    youtubeKey?: string | null
  ) => Promise<void>;
  removeDownload: (id: string) => void;
  retryDownload: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<DownloadItem>) => void;
}

const STORAGE_KEY = "flexnit_downloads_v2";

const loadDownloads = (): DownloadItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDownloads = (items: DownloadItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
};

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: loadDownloads(),

  addDownload: async (
    mediaId,
    mediaType,
    title,
    posterUrl = null,
    backdropUrl = null,
    season,
    episode,
    episodeTitle,
    youtubeKey = null
  ) => {
    const id =
      mediaType === "series"
        ? `tv_${mediaId}_s${season}_e${episode}`
        : `${mediaType}_${mediaId}`;

    const existing = get().downloads.find((d) => d.id === id);
    if (existing && (existing.status === "downloading" || existing.status === "completed")) {
      return;
    }

    const cleanTitle = episodeTitle ? `${title} - ${episodeTitle}` : title;

    // Self-healing: if African movie and youtubeKey is missing or invalid, resolve from seed catalog
    let resolvedYoutubeKey = youtubeKey;
    if (mediaType === "african" && (!resolvedYoutubeKey || !/^[a-zA-Z0-9_-]{11}$/.test(resolvedYoutubeKey.trim()))) {
      const match = SEED_AFRICAN_MOVIES.find(
        (m) =>
          m.id === mediaId ||
          m.title.toLowerCase().trim() === title.toLowerCase().trim() ||
          m.title.toLowerCase().includes(title.toLowerCase().trim()) ||
          title.toLowerCase().includes(m.title.toLowerCase().trim())
      );
      if (match?.youtubeVideoId) {
        resolvedYoutubeKey = match.youtubeVideoId;
      }
    }

    const newItem: DownloadItem = {
      id,
      mediaId,
      mediaType,
      title: cleanTitle,
      posterUrl,
      backdropUrl,
      season,
      episode,
      episodeTitle,
      youtubeKey: resolvedYoutubeKey,
      downloadUrl: "",
      progress: 1,
      status: "queued",
      downloadedAt: Date.now(),
      sizeFormatted: "1080p Full HD",
      phase: "Resolving media stream...",
    };

    // Filter out previous failed instance of same ID if any
    const filtered = get().downloads.filter((d) => d.id !== id);
    const updated = [newItem, ...filtered];
    saveDownloads(updated);
    set({ downloads: updated });

    try {
      // 1. Resolve source stream (.m3u8 or YouTube URL)
      const sourceUrl = await downloadEngine.resolveSourceUrl(
        mediaType,
        mediaId,
        season,
        episode,
        resolvedYoutubeKey,
        cleanTitle
      );

      get().updateItem(id, { downloadUrl: sourceUrl, phase: "Starting download..." });

      // 2. Start real download pipeline (native sidecar on desktop, StreamLink on web)
      const jobId = await downloadEngine.startDownload(
        id,
        sourceUrl,
        (info: DownloadProgressInfo) => {
          get().updateItem(id, {
            progress: info.progress,
            status: info.status,
            phase: info.phase,
            speed: info.speed,
            eta: info.eta,
            fileUrl: info.fileUrl,
            filePath: info.filePath,
            error: info.error,
          });
        },
        cleanTitle
      );

      if (jobId) {
        get().updateItem(id, { jobId });
      }
    } catch (err: any) {
      get().updateItem(id, {
        status: "failed",
        phase: "Failed",
        error: err.message || "Failed to resolve stream",
      });
    }
  },

  retryDownload: async (id: string) => {
    const item = get().downloads.find((d) => d.id === id);
    if (!item) return;

    let youtubeKey = item.youtubeKey;
    if (item.mediaType === "african" && (!youtubeKey || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeKey.trim()))) {
      const match = SEED_AFRICAN_MOVIES.find(
        (m) =>
          m.id === item.mediaId ||
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim() ||
          m.title.toLowerCase().includes(item.title.toLowerCase().trim()) ||
          item.title.toLowerCase().includes(m.title.toLowerCase().trim())
      );
      if (match?.youtubeVideoId) {
        youtubeKey = match.youtubeVideoId;
      }
    }

    await get().addDownload(
      item.mediaId,
      item.mediaType,
      item.title,
      item.posterUrl,
      item.backdropUrl,
      item.season,
      item.episode,
      item.episodeTitle,
      youtubeKey
    );
  },

  updateItem: (id: string, updates: Partial<DownloadItem>) => {
    const updated = get().downloads.map((d) => {
      if (d.id === id) {
        return { ...d, ...updates };
      }
      return d;
    });
    saveDownloads(updated);
    set({ downloads: updated });
  },

  removeDownload: (id: string) => {
    downloadEngine.cancelDownload(id);
    const updated = get().downloads.filter((d) => d.id !== id);
    saveDownloads(updated);
    set({ downloads: updated });
  },
}));
