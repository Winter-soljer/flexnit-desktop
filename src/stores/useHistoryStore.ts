import { create } from "zustand";
import { UnifiedMedia } from "../types/movie";

export interface WatchHistoryItem {
  media: UnifiedMedia;
  progressPercent: number; // 0-100
  lastWatchedAt: number;
  season?: number;
  episode?: number;
}

interface HistoryState {
  history: WatchHistoryItem[];
  addToHistory: (
    media: UnifiedMedia,
    progressPercent?: number,
    season?: number,
    episode?: number
  ) => void;
  removeFromHistory: (id: number) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = "flexnit_recently_watched";

const loadHistory = (): WatchHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (items: WatchHistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore
  }
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: loadHistory(),

  addToHistory: (media, progressPercent = 10, season, episode) => {
    const { history } = get();
    const filtered = history.filter((h) => h.media.id !== media.id);
    const item: WatchHistoryItem = {
      media,
      progressPercent,
      lastWatchedAt: Date.now(),
      season,
      episode,
    };
    const updated = [item, ...filtered].slice(0, 20); // Keep last 20
    saveHistory(updated);
    set({ history: updated });
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
