import { create } from "zustand";

export interface NotificationItem {
  id: string;
  type: "welcome" | "download";
  title: string;
  subtitle: string;
  description: string;
  timestamp: number;
  imageUrl?: string;
  isRead: boolean;
  mediaId?: number;
  mediaType?: "movie" | "series" | "african";
  season?: number;
  episode?: number;
  filePath?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (item: Omit<NotificationItem, "id" | "timestamp" | "isRead">) => void;
  addDownloadCompleteNotification: (params: {
    title: string;
    mediaType?: "movie" | "series" | "african";
    mediaId?: number;
    season?: number;
    episode?: number;
    posterUrl?: string | null;
    filePath?: string;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = "flexnit_notifications_v1";
const WELCOME_SEEN_KEY = "flexnit_welcome_seen_v1";

const createWelcomeNotification = (): NotificationItem => ({
  id: "notif-welcome-v1",
  type: "welcome",
  title: "Welcome to Flexnit!",
  subtitle: "Your Cinema, Your Way",
  description:
    "Enjoy streaming and downloading thousands of movies, global series, and African cinema masterpieces. Start exploring today!",
  timestamp: Date.now(),
  imageUrl:
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
  isRead: false,
});

const loadInitialNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const welcomeSeen = localStorage.getItem(WELCOME_SEEN_KEY);

    if (raw) {
      const items: NotificationItem[] = JSON.parse(raw);
      return items;
    }

    // First time launch: initialize with exactly one welcome notification
    if (!welcomeSeen) {
      const welcome = createWelcomeNotification();
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([welcome]));
      return [welcome];
    }

    return [];
  } catch {
    return [];
  }
};

const saveNotifications = (items: NotificationItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore quota errors
  }
};

const initialItems = loadInitialNotifications();

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialItems,
  unreadCount: initialItems.filter((n) => !n.isRead).length,

  addNotification: (item) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      isRead: false,
    };
    set((state) => {
      const updated = [newNotif, ...state.notifications];
      saveNotifications(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  addDownloadCompleteNotification: ({
    title,
    mediaType = "movie",
    mediaId,
    season,
    episode,
    posterUrl,
    filePath,
  }) => {
    const epSuffix =
      mediaType === "series" && season && episode
        ? ` (S${season}:E${episode})`
        : "";

    const newNotif: NotificationItem = {
      id: `notif-dl-${Date.now()}`,
      type: "download",
      title: `Download Finished: ${title}${epSuffix}`,
      subtitle: "Ready Offline • 100% Complete",
      description: `Your offline copy is saved and ready to watch anywhere without internet.`,
      timestamp: Date.now(),
      imageUrl:
        posterUrl ||
        "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
      isRead: false,
      mediaId,
      mediaType,
      season,
      episode,
      filePath,
    };

    set((state) => {
      // Avoid duplicate completion alerts for the same item within short window
      const exists = state.notifications.some(
        (n) => n.title === newNotif.title && Date.now() - n.timestamp < 10000
      );
      if (exists) return state;

      const updated = [newNotif, ...state.notifications];
      saveNotifications(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      saveNotifications(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
      saveNotifications(updated);
      return {
        notifications: updated,
        unreadCount: 0,
      };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      saveNotifications(updated);
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  clearAll: () => {
    saveNotifications([]);
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
}));
