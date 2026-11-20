import { create } from "zustand";
import { UnifiedMedia } from "../types/movie";

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

interface PlayerState {
  media: UnifiedMedia;
  season?: number;
  episode?: number;
  sourceId?: string;
}

export interface StreamBridgeData {
  title: string;
  tmdbId: number;
  type?: "movie" | "series" | "african";
  season?: number;
  episode?: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  vidsparkUrl?: string;
}

interface UIState {
  activeTab: NavTab;
  searchQuery: string;
  isSearchOpen: boolean;
  selectedMedia: UnifiedMedia | null;
  activePlayer: PlayerState | null;
  streamBridgeData: StreamBridgeData | null;
  isWindowMaximized: boolean;

  setActiveTab: (tab: NavTab) => void;
  setSearchQuery: (query: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  openDetailModal: (media: UnifiedMedia) => void;
  closeDetailModal: () => void;
  openPlayer: (player: PlayerState) => void;
  closePlayer: () => void;
  openStreamBridge: (data: StreamBridgeData) => void;
  closeStreamBridge: () => void;
  setIsWindowMaximized: (maximized: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: "home",
  searchQuery: "",
  isSearchOpen: false,
  selectedMedia: null,
  activePlayer: null,
  streamBridgeData: null,
  isWindowMaximized: false,

  setActiveTab: (tab) => set({ activeTab: tab, searchQuery: "" }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  openDetailModal: (media) => set({ selectedMedia: media }),
  closeDetailModal: () => set({ selectedMedia: null }),
  openPlayer: (player) => set({ activePlayer: player }),
  closePlayer: () => set({ activePlayer: null }),
  openStreamBridge: (data) => set({ streamBridgeData: data }),
  closeStreamBridge: () => set({ streamBridgeData: null }),
  setIsWindowMaximized: (maximized) => set({ isWindowMaximized: maximized }),
}));
