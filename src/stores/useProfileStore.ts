import { create } from "zustand";

export type DownloadQuality = "480p" | "720p" | "1080p";

export interface UserProfile {
  id: "vip" | "family" | "kids";
  name: string;
  avatarColor: string;
  avatarUrl: string | null;
  isKids: boolean;
  roleBadge: string;
}

interface ProfileState {
  profiles: UserProfile[];
  activeProfileId: "vip" | "family" | "kids";
  downloadQuality: DownloadQuality;
  autoplayNext: boolean;
  autoplayPreviews: boolean;
  smartDownloads: boolean;
  subtitleLang: string;
  audioLang: string;

  // Actions
  getActiveProfile: () => UserProfile;
  switchProfile: (id: "vip" | "family" | "kids") => void;
  updateProfileName: (id: "vip" | "family" | "kids", name: string) => void;
  updateProfileAvatar: (id: "vip" | "family" | "kids", dataUrl: string | null) => void;
  setDownloadQuality: (quality: DownloadQuality) => void;
  setAutoplayNext: (val: boolean) => void;
  setAutoplayPreviews: (val: boolean) => void;
  setSmartDownloads: (val: boolean) => void;
  setSubtitleLang: (lang: string) => void;
  setAudioLang: (lang: string) => void;
}

const STORAGE_KEY = "flexnit_profiles_v1";

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: "vip",
    name: "Flexnit VIP",
    avatarColor: "from-cyan-600 to-blue-600",
    avatarUrl: null,
    isKids: false,
    roleBadge: "VIP ULTRA HD",
  },
  {
    id: "family",
    name: "Family",
    avatarColor: "from-purple-600 to-pink-600",
    avatarUrl: null,
    isKids: false,
    roleBadge: "FAMILY HD",
  },
  {
    id: "kids",
    name: "Kids",
    avatarColor: "from-amber-600 to-orange-600",
    avatarUrl: null,
    isKids: true,
    roleBadge: "KIDS SAFE",
  },
];

interface PersistedData {
  profiles?: UserProfile[];
  activeProfileId?: "vip" | "family" | "kids";
  downloadQuality?: DownloadQuality;
  autoplayNext?: boolean;
  autoplayPreviews?: boolean;
  smartDownloads?: boolean;
  subtitleLang?: string;
  audioLang?: string;
}

const loadPersistedData = (): PersistedData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const savePersistedData = (data: PersistedData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
};

const persisted = loadPersistedData();

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: persisted.profiles || DEFAULT_PROFILES,
  activeProfileId: persisted.activeProfileId || "vip",
  downloadQuality: persisted.downloadQuality || "720p",
  autoplayNext: persisted.autoplayNext ?? true,
  autoplayPreviews: persisted.autoplayPreviews ?? true,
  smartDownloads: persisted.smartDownloads ?? true,
  subtitleLang: persisted.subtitleLang || "en",
  audioLang: persisted.audioLang || "original",

  getActiveProfile: () => {
    const state = get();
    return (
      state.profiles.find((p) => p.id === state.activeProfileId) ||
      state.profiles[0]
    );
  },

  switchProfile: (id) => {
    set({ activeProfileId: id });
    const { profiles, downloadQuality, autoplayNext, autoplayPreviews, smartDownloads, subtitleLang, audioLang } = get();
    savePersistedData({
      profiles,
      activeProfileId: id,
      downloadQuality,
      autoplayNext,
      autoplayPreviews,
      smartDownloads,
      subtitleLang,
      audioLang,
    });
  },

  updateProfileName: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      const updated = state.profiles.map((p) =>
        p.id === id ? { ...p, name: trimmed } : p
      );
      savePersistedData({
        ...get(),
        profiles: updated,
      });
      return { profiles: updated };
    });
  },

  updateProfileAvatar: (id, dataUrl) => {
    set((state) => {
      const updated = state.profiles.map((p) =>
        p.id === id ? { ...p, avatarUrl: dataUrl } : p
      );
      savePersistedData({
        ...get(),
        profiles: updated,
      });
      return { profiles: updated };
    });
  },

  setDownloadQuality: (quality) => {
    set({ downloadQuality: quality });
    savePersistedData({ ...get(), downloadQuality: quality });
  },

  setAutoplayNext: (val) => {
    set({ autoplayNext: val });
    savePersistedData({ ...get(), autoplayNext: val });
  },

  setAutoplayPreviews: (val) => {
    set({ autoplayPreviews: val });
    savePersistedData({ ...get(), autoplayPreviews: val });
  },

  setSmartDownloads: (val) => {
    set({ smartDownloads: val });
    savePersistedData({ ...get(), smartDownloads: val });
  },

  setSubtitleLang: (lang) => {
    set({ subtitleLang: lang });
    savePersistedData({ ...get(), subtitleLang: lang });
  },

  setAudioLang: (lang) => {
    set({ audioLang: lang });
    savePersistedData({ ...get(), audioLang: lang });
  },
}));
