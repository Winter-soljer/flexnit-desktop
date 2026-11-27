import { create } from "zustand";
import { UnifiedMedia } from "../types/movie";
import { useHistoryStore } from "./useHistoryStore";

export type NavTab =
  | "home"
  | "series"
  | "films"
  | "african"
  | "african_catalog"
  | "popular"
  | "mylist"
  | "downloads"
  | "notifications"
  | "profile";

export interface PlayerState {
  media: UnifiedMedia;
  season?: number;
  episode?: number;
  sourceId?: string;
  totalSeasons?: number;
  totalEpisodesInSeason?: number;
  episodeTitle?: string;
  startTime?: number; // Resume timestamp in seconds
}

interface UIState {
  activeTab: NavTab;
  searchQuery: string;
  isSearchOpen: boolean;
  selectedMedia: UnifiedMedia | null;
  previousDetailMedia: UnifiedMedia | null;
  activePlayer: PlayerState | null;
  isWindowMaximized: boolean;

  setActiveTab: (tab: NavTab) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  openDetailModal: (media: UnifiedMedia) => void;
  closeDetailModal: () => void;
  openPlayer: (player: PlayerState) => void;
  closePlayer: () => void;
  setIsWindowMaximized: (maximized: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  searchQuery: "",
  isSearchOpen: false,
  selectedMedia: null,
  previousDetailMedia: null,
  activePlayer: null,
  isWindowMaximized: false,

  setActiveTab: (tab) => set({ activeTab: tab, searchQuery: "" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  openDetailModal: (media) => set({ selectedMedia: media, previousDetailMedia: null }),
  closeDetailModal: () => set({ selectedMedia: null, previousDetailMedia: null }),
  // Auto-close detail modal when player opens, saving previous detail media so it re-opens on close
  openPlayer: (player) =>
    set((state) => {
      if (!player || !player.media) return state;

      let resolvedPlayer = { ...player };
      try {
        const historyItem = useHistoryStore.getState().getHistoryItem(player.media.id);
        if (historyItem) {
          if (resolvedPlayer.season === undefined && historyItem.season) {
            resolvedPlayer.season = historyItem.season;
          }
          if (resolvedPlayer.episode === undefined && historyItem.episode) {
            resolvedPlayer.episode = historyItem.episode;
          }

          // Resume position ONLY applies if it's the exact same episode (or if it's a movie)
          const isSameEpisode =
            resolvedPlayer.media.mediaType !== "series" ||
            (resolvedPlayer.season === historyItem.season &&
              resolvedPlayer.episode === historyItem.episode);

          if (
            isSameEpisode &&
            resolvedPlayer.startTime === undefined &&
            historyItem.currentTime &&
            historyItem.currentTime > 5
          ) {
            const isNearEnd =
              historyItem.duration &&
              historyItem.currentTime / historyItem.duration > 0.95;
            if (!isNearEnd) {
              resolvedPlayer.startTime = Math.floor(historyItem.currentTime);
            }
          }
        }
      } catch {
        // Fallback safely
      }

      return {
        activePlayer: resolvedPlayer,
        previousDetailMedia: state.selectedMedia ? state.selectedMedia : null,
        selectedMedia: null,
      };
    }),
  // Re-open detail modal when player is closed
  closePlayer: () =>
    set((state) => ({
      activePlayer: null,
      selectedMedia: state.previousDetailMedia,
      previousDetailMedia: null,
    })),
  setIsWindowMaximized: (maximized) => set({ isWindowMaximized: maximized }),
}));
