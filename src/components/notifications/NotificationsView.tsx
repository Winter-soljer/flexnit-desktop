import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Play,
  Film,
  Download,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";

interface NotificationItem {
  id: string;
  type: "new_release" | "african" | "reminder" | "download";
  title: string;
  subtitle: string;
  description: string;
  timeAgo: string;
  imageUrl: string;
  isRead: boolean;
  category: "all" | "new" | "african" | "downloads";
  actionLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "african",
    title: "Aníkúlápó: Rise of the Spectre",
    subtitle: "New 🇳🇬 Nollywood Masterpiece Available",
    description: "Kunle Afolayan's epic series returns with breathtaking intrigue, folklore, and drama.",
    timeAgo: "2 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
    isRead: false,
    category: "african",
    actionLabel: "Watch Now",
  },
  {
    id: "notif-2",
    type: "new_release",
    title: "Blood & Water (Season 4)",
    subtitle: "Brand New Season Streaming",
    description: "Parkhurst High's deepest secrets unfold once again in this gripping South African teen drama.",
    timeAgo: "5 hours ago",
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
    isRead: false,
    category: "new",
    actionLabel: "Explore Episodes",
  },
  {
    id: "notif-3",
    type: "download",
    title: "Download Finished: Jagun Jagun",
    subtitle: "Offline Ready • 1080p Full HD",
    description: "Your offline copy of Jagun Jagun is saved and ready to watch anywhere without internet.",
    timeAgo: "Yesterday",
    imageUrl: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=600&q=80",
    isRead: true,
    category: "downloads",
    actionLabel: "Go to Downloads",
  },
  {
    id: "notif-4",
    type: "reminder",
    title: "Continue Watching: The Black Book",
    subtitle: "Paused at 1h 14m",
    description: "Paul Edima's mission of vengeance awaits. Jump back in right where you left off.",
    timeAgo: "2 days ago",
    imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80",
    isRead: true,
    category: "new",
    actionLabel: "Resume",
  },
  {
    id: "notif-5",
    type: "african",
    title: "African Cinema Spotlight: Shanty Town",
    subtitle: "Top 10 in Crime Thrillers",
    description: "A gritty story of survival, power, and freedom featuring an ensemble Nollywood all-star cast.",
    timeAgo: "3 days ago",
    imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
    isRead: true,
    category: "african",
    actionLabel: "View Details",
  },
];

export const NotificationsView: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "new" | "african" | "downloads">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.category === filter;
  });

  const getBadge = (type: NotificationItem["type"]) => {
    switch (type) {
      case "african":
        return {
          label: "AFRICAN CINEMA",
          bg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
          icon: <Sparkles className="w-3 h-3 mr-1 inline" />,
        };
      case "new_release":
        return {
          label: "NEW RELEASE",
          bg: "bg-red-500/20 text-red-400 border border-red-500/30",
          icon: <Film className="w-3 h-3 mr-1 inline" />,
        };
      case "download":
        return {
          label: "DOWNLOAD READY",
          bg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
          icon: <Download className="w-3 h-3 mr-1 inline" />,
        };
      case "reminder":
        return {
          label: "REMINDER",
          bg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
          icon: <Clock className="w-3 h-3 mr-1 inline" />,
        };
    }
  };

  return (
    <div className="pt-24 pb-20 px-6 sm:px-10 md:px-14 max-w-5xl mx-auto min-h-[80vh] select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm shadow-red-600/40">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Latest premieres, episode releases, and offline download status
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-red-500" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setNotifications([])}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-800/60 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto py-4 scrollbar-none">
        {[
          { key: "all", label: "All" },
          { key: "new", label: "New Releases" },
          { key: "african", label: "African Cinema" },
          { key: "downloads", label: "Downloads" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filter === tab.key
                ? "bg-white text-black font-bold shadow"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3 mt-2">
        {filteredNotifications.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-zinc-600 mb-4">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-zinc-300">No Notifications</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              You're all caught up! When new movies or series drop on Flexnit, you'll see them right here.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="mt-5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-colors"
            >
              Browse Content
            </button>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const badge = getBadge(notif.type);
            return (
              <div
                key={notif.id}
                onClick={() => markItemAsRead(notif.id)}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg transition-all border ${
                  notif.isRead
                    ? "bg-[#181818]/60 border-zinc-800/40 hover:bg-[#181818]"
                    : "bg-[#1c1c1c] border-red-900/30 hover:border-red-600/40 shadow-sm shadow-red-950/20"
                }`}
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start space-x-4 flex-1">
                  <div className="relative w-20 h-28 sm:w-24 sm:h-20 rounded overflow-hidden shrink-0 bg-zinc-800 shadow">
                    <img
                      src={notif.imageUrl}
                      alt={notif.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {!notif.isRead && (
                      <span className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wider ${badge.bg}`}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{notif.timeAgo}</span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-white mt-1 group-hover:text-red-400 transition-colors">
                      {notif.title}
                    </h2>
                    <p className="text-xs text-zinc-300 font-medium">{notif.subtitle}</p>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {notif.description}
                    </p>
                  </div>
                </div>

                {/* Right: Action & Dismiss */}
                <div className="flex items-center space-x-3 mt-3 sm:mt-0 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  {notif.actionLabel && (
                    <button
                      onClick={() => {
                        if (notif.category === "downloads") {
                          setActiveTab("downloads");
                        } else {
                          setActiveTab("home");
                        }
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold transition-colors shadow"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{notif.actionLabel}</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => removeNotification(notif.id, e)}
                    className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
