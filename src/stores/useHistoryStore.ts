import { create } from "zustand";
import { UnifiedMedia } from "../types/movie";
import { extractCleanShowTitle } from "../services/tmdb";

export interface WatchHistoryItem {
  media: UnifiedMedia;
  progressPercent: number; // 0-100
  lastWatchedAt: number;
  season?: number;
  episode?: number;
  currentTime?: number; // in seconds
  duration?: number; // in seconds
}

interface HistoryState {
  history: WatchHistoryItem[];
  addToHistory: (
    media: UnifiedMedia,
    progressPercent?: number,
    season?: number,
    episode?: number,
    currentTime?: number,
    duration?: number
  ) => void;
  getHistoryItem: (id: number) => WatchHistoryItem | undefined;
  removeFromHistory: (id: number) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = "flexnit_recently_watched";

const loadHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? JSON.parse(raw).map((h: WatchHistoryItem) => ({
          ...h,
          media: {
            ...h.media,
            title:
              h.media.mediaType === "series"
                ? extractCleanShowTitle(h.media.title)
                : h.media.title,
          },
        }))
      : [];
  } catch {
    return [];
  }
};

const saveHistory = (items: WatchHistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota
  }
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: loadHistory(),

  addToHistory: (
    media,
    progressPercent = 10,
    season,
    episode,
    currentTime,
    duration
  ) => {
    const { history } = get();
    const existing = history.find((h) => h.media.id === media.id);
    const filtered = history.filter((h) => h.media.id !== media.id);

    const calculatedPercent =
      currentTime !== undefined && duration && duration > 0
        ? Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)))
        : progressPercent;

    const sanitizedMedia: UnifiedMedia = {
      ...media,
      title:
        media.mediaType === "series"
          ? extractCleanShowTitle(media.title)
          : media.title,
    };

    const item: WatchHistoryItem = {
      media: sanitizedMedia,
      progressPercent: calculatedPercent,
      lastWatchedAt: Date.now(),
      season: season ?? existing?.season,
      episode: episode ?? existing?.episode,
      currentTime: currentTime ?? existing?.currentTime,
      duration: duration ?? existing?.duration,
    };

    const updated = [item, ...filtered].slice(0, 30); // Keep last 30
    saveHistory(updated);
    set({ history: updated });
  },

  getHistoryItem: (id) => {
    return get().history.find((h) => h.media.id === id);
  },

  removeFromHistory: (id) => {
    const updated = get().history.filter((h) => h.media.id !== id);
    saveHistory(updated);
    set({ history: updated });
  },

  clearHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },
}));
