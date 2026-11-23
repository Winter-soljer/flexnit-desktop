import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Play,
  ArrowLeft,
  Download,
  Sparkles,
} from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import { useNotificationStore, NotificationItem } from "../../stores/useNotificationStore";

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export const NotificationsView: React.FC = () => {
  const { setActiveTab, openPlayer } = useUIStore();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotificationStore();

  const [filter, setFilter] = useState<"all" | "unread" | "downloads">("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "downloads") return n.type === "download";
    return true;
  });

  const handleAction = (notif: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notif.id);

    if (notif.type === "download") {
      if (notif.mediaId) {
        // Can directly play the completed media
        openPlayer({
          media: {
            id: notif.mediaId,
            title: notif.title.replace(/^Download Finished:\s*/i, ""),
            overview: notif.description,
            posterPath: notif.imageUrl || null,
            backdropPath: null,
            voteAverage: 8.5,
            releaseDate: "",
            mediaType: notif.mediaType || "movie",
          },
          season: notif.season,
          episode: notif.episode,
        });
      } else {
        setActiveTab("downloads");
      }
    } else {
      setActiveTab("home");
    }
  };

  return (
    <div className="w-full px-8 md:px-14 pt-24 pb-20 min-h-[85vh] select-none text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.08] gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wide">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-[#E50914] text-white text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm shadow-black/60">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time download notifications and offline readiness updates
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-[#222222] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] text-zinc-200 rounded-md border border-white/10 shadow-sm shadow-black/50 transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-zinc-300" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#141414] text-zinc-400 hover:text-zinc-200 rounded-md border border-white/[0.06] shadow-sm shadow-black/40 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2.5 overflow-x-auto py-5 scrollbar-none">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread" },
          { key: "downloads", label: "Downloads" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === tab.key
                ? "bg-white text-black shadow-md shadow-black/60 border border-white"
                : "bg-[#181818] text-zinc-300 hover:bg-[#222222] hover:text-white border border-white/[0.08] shadow-sm shadow-black/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Cards List */}
      <div className="space-y-4 mt-2">
        {filteredNotifications.length === 0 ? (
          <div className="py-28 text-center bg-[#181818] rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 p-8">
            <div className="w-16 h-16 rounded-full bg-[#121212] border border-white/[0.08] shadow-inner shadow-black/60 mx-auto flex items-center justify-center text-zinc-500 mb-4">
              <Bell className="w-7 h-7 opacity-60" />
            </div>
            <h3 className="text-lg font-bold text-zinc-200">No Notifications</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5">
              You're all caught up! Completed offline downloads and notifications will appear right here.
            </p>
            <button
              onClick={() => setActiveTab("home")}
              className="mt-6 px-5 py-2.5 bg-[#E50914] hover:bg-[#b80610] active:scale-98 text-white font-bold text-xs rounded-md shadow-md shadow-black/70 border border-white/10 transition-all cursor-pointer"
            >
              Browse Content
            </button>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isDownload = notif.type === "download";
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl transition-all cursor-pointer border ${
                  notif.isRead
                    ? "bg-[#181818] border-white/[0.06] border-t-white/[0.10] shadow-lg shadow-black/70 hover:bg-[#1f1f1f] hover:border-white/[0.14]"
                    : "bg-[#202020] border-l-4 border-l-[#E50914] border-t-white/[0.14] border-r-white/[0.08] border-b-black/50 shadow-xl shadow-black/80 hover:bg-[#252525]"
                }`}
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start space-x-5 flex-1 min-w-0">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-20 rounded-md overflow-hidden shrink-0 bg-[#121212] border border-white/10 shadow-md shadow-black/80 flex items-center justify-center">
                    {notif.imageUrl ? (
                      <img
                        src={notif.imageUrl}
                        alt={notif.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                        {isDownload ? <Download className="w-8 h-8 text-emerald-500" /> : <Sparkles className="w-8 h-8 text-red-500" />}
                      </div>
                    )}
                    {!notif.isRead && (
                      <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-[#E50914] ring-2 ring-black shadow-sm" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs ${
                          isDownload
                            ? "bg-emerald-600 text-white"
                            : "bg-[#E50914] text-white"
                        }`}
                      >
                        {isDownload ? "DOWNLOAD READY" : "WELCOME"}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>

                    <h2 className="text-sm sm:text-base font-bold text-white mt-1.5 tracking-tight group-hover:text-zinc-100 transition-colors">
                      {notif.title}
                    </h2>
                    <p className="text-xs text-zinc-300 font-medium mt-0.5">{notif.subtitle}</p>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {notif.description}
                    </p>
                  </div>
                </div>

                {/* Right: Action & Dismiss */}
                <div className="flex items-center space-x-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <button
                    onClick={(e) => handleAction(notif, e)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white hover:bg-zinc-200 active:bg-zinc-300 text-black text-xs font-bold transition-all shadow-md shadow-black/60 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isDownload ? "Play Offline" : "Explore"}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                    className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
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
