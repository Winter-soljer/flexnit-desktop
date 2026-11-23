import { create } from "zustand";
import { DownloadItem } from "../types/streaming";
import { downloadEngine, DownloadProgressInfo } from "../services/downloadEngine";
import { SEED_AFRICAN_MOVIES } from "../services/africanSeed";
import { useNotificationStore } from "./useNotificationStore";

export interface SeasonEpisodeInput {
  id: number;
  episode_number: number;
  name: string;
  season_number: number;
}

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
    youtubeKey?: string | null,
    customSourceUrl?: string | null
  ) => Promise<void>;
  downloadSeason: (
    mediaId: number,
    mediaType: "series" | "african",
    title: string,
    posterUrl: string | null,
    backdropUrl: string | null,
    seasonNumber: number,
    episodes: SeasonEpisodeInput[]
  ) => Promise<void>;
  cancelSeasonDownloads: (mediaId: number, seasonNumber: number) => void;
  removeDownload: (id: string) => void;
  retryDownload: (id: string) => Promise<void>;
  clearFailedDownloads: () => void;
  updateItem: (id: string, updates: Partial<DownloadItem>) => void;
  processQueue: () => Promise<void>;
}

const STORAGE_KEY = "flexnit_downloads_v2";

const loadDownloads = (): DownloadItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: DownloadItem[] = JSON.parse(raw);
    return items.map((item) => {
      // If app closed while downloading, reset to queued so it can resume sequentially
      if (item.status === "downloading") {
        return {
          ...item,
          status: "queued" as const,
          phase: "Queued (Resume)",
        };
      }
      return item;
    });
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

let isProcessingQueue = false;

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
    youtubeKey = null,
    customSourceUrl = null
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

    // Self-healing: if African movie and youtubeKey is missing, resolve from seed
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
      downloadUrl: customSourceUrl || "",
      progress: 0,
      status: "queued",
      downloadedAt: Date.now(),
      sizeFormatted: "1080p Full HD",
      phase: "Queued in succession...",
    };

    // Filter out previous failed instance of same ID if any
    const filtered = get().downloads.filter((d) => d.id !== id);
    const updated = [newItem, ...filtered];
    saveDownloads(updated);
    set({ downloads: updated });

    // Process queue in succession
    get().processQueue();
  },

  downloadSeason: async (
    mediaId,
    mediaType,
    title,
    posterUrl,
    backdropUrl,
    seasonNumber,
    episodes
  ) => {
    const currentDownloads = get().downloads;
    const newItems: DownloadItem[] = [];

    episodes.forEach((ep, index) => {
      const id = `tv_${mediaId}_s${seasonNumber}_e${ep.episode_number}`;
      const existing = currentDownloads.find((d) => d.id === id);
      // Skip if already completed or currently downloading/queued
      if (existing && existing.status === "completed") {
        return;
      }
      if (existing && (existing.status === "downloading" || existing.status === "queued")) {
        return;
      }

      const cleanTitle = ep.name
        ? `${title} - S${seasonNumber}:E${ep.episode_number} ${ep.name}`
        : `${title} - S${seasonNumber}:E${ep.episode_number}`;

      const item: DownloadItem = {
        id,
        mediaId,
        mediaType,
        title: cleanTitle,
        posterUrl,
        backdropUrl,
        season: seasonNumber,
        episode: ep.episode_number,
        episodeTitle: ep.name,
        downloadUrl: "",
        progress: 0,
        status: "queued",
        // Stagger timestamp slightly to preserve strict FIFO episode order (Ep 1 before Ep 2, etc.)
        downloadedAt: Date.now() + index * 10,
        sizeFormatted: "1080p Full HD",
        phase: `Queued (#${index + 1})`,
      };
      newItems.push(item);
    });

    if (newItems.length === 0) return;

    // Filter out previous failed instances of these IDs
    const newIds = new Set(newItems.map((n) => n.id));
    const filtered = currentDownloads.filter((d) => !newIds.has(d.id));
    const updated = [...filtered, ...newItems];
    saveDownloads(updated);
    set({ downloads: updated });

    // Start sequential processing
    get().processQueue();
  },

  cancelSeasonDownloads: (mediaId: number, seasonNumber: number) => {
    const seasonItems = get().downloads.filter(
      (d) =>
        d.mediaId === mediaId &&
        d.season === seasonNumber &&
        (d.status === "queued" || d.status === "downloading")
    );

    seasonItems.forEach((item) => {
      if (item.status === "downloading") {
        downloadEngine.cancelDownload(item.id);
      }
    });

    const cancelledIds = new Set(seasonItems.map((i) => i.id));
    const updated = get().downloads.filter((d) => !cancelledIds.has(d.id));
    saveDownloads(updated);
    set({ downloads: updated });

    // Process next queued download if any
    setTimeout(() => {
      get().processQueue();
    }, 200);
  },

  processQueue: async () => {
    if (isProcessingQueue) return;

    const currentDownloads = get().downloads;

    // Check if any download is currently actively running (Concurrency limit = 1)
    const activeItem = currentDownloads.find((d) => d.status === "downloading");
    if (activeItem) {
      return;
    }

    // Find the next queued item (lowest downloadedAt timestamp for FIFO)
    const queuedItems = currentDownloads
      .filter((d) => d.status === "queued")
      .sort((a, b) => a.downloadedAt - b.downloadedAt);

    if (queuedItems.length === 0) return;

    const nextItem = queuedItems[0];
    isProcessingQueue = true;

    try {
      get().updateItem(nextItem.id, {
        status: "downloading",
        phase: nextItem.downloadUrl ? "Starting stream download..." : "Resolving media stream...",
      });

      // 1. Resolve source stream (.m3u8 or YouTube URL)
      const sourceUrl =
        nextItem.downloadUrl ||
        (await downloadEngine.resolveSourceUrl(
          nextItem.mediaType,
          nextItem.mediaId,
          nextItem.season,
          nextItem.episode,
          nextItem.youtubeKey,
          nextItem.title
        ));

      get().updateItem(nextItem.id, { downloadUrl: sourceUrl, phase: "Starting download..." });

      // 2. Start download pipeline (native yt-dlp for YouTube, StreamLink microservice for TMDB)
      const jobId = await downloadEngine.startDownload(
        nextItem.id,
        sourceUrl,
        (info: DownloadProgressInfo) => {
          get().updateItem(nextItem.id, {
            progress: info.progress,
            status: info.status,
            phase: info.phase,
            speed: info.speed,
            eta: info.eta,
            fileUrl: info.fileUrl,
            filePath: info.filePath,
            error: info.error,
          });

          // When this download finishes or fails, trigger next in succession
          if (info.status === "completed" || info.status === "failed") {
            if (info.status === "completed") {
              try {
                useNotificationStore.getState().addDownloadCompleteNotification({
                  title: nextItem.title,
                  mediaType: nextItem.mediaType,
                  mediaId: nextItem.mediaId,
                  season: nextItem.season,
                  episode: nextItem.episode,
                  posterUrl: nextItem.posterUrl,
                  filePath: info.filePath,
                });
              } catch (e) {
                console.error("Failed to post download notification:", e);
              }
            }
            setTimeout(() => {
              get().processQueue();
            }, 300);
          }
        },
        nextItem.title
      );

      if (jobId) {
        get().updateItem(nextItem.id, { jobId });
      }
    } catch (err: any) {
      get().updateItem(nextItem.id, {
        status: "failed",
        phase: "Unavailable",
        error: err.message || "Failed to resolve stream",
      });
      // Fail-forward: trigger next queued episode automatically
      setTimeout(() => {
        get().processQueue();
      }, 500);
    } finally {
      isProcessingQueue = false;
    }
  },

  retryDownload: async (id: string) => {
    const item = get().downloads.find((d) => d.id === id);
    if (!item) return;

    // Reset status to queued and trigger queue
    get().updateItem(id, {
      status: "queued",
      progress: 0,
      phase: "Queued (Retry)",
      error: undefined,
    });

    get().processQueue();
  },

  clearFailedDownloads: () => {
    const updated = get().downloads.filter((d) => d.status !== "failed");
    saveDownloads(updated);
    set({ downloads: updated });
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
    const item = get().downloads.find((d) => d.id === id);
    if (item && item.status === "downloading") {
      downloadEngine.cancelDownload(id);
    }
    const updated = get().downloads.filter((d) => d.id !== id);
    saveDownloads(updated);
    set({ downloads: updated });

    // Pick up next queued item
    setTimeout(() => {
      get().processQueue();
    }, 200);
  },
}));

// Automatically resume any queued downloads when store is first loaded
if (typeof window !== "undefined") {
  setTimeout(() => {
    useDownloadStore.getState().processQueue();
  }, 1000);
}
