import React, { useState, useEffect } from "react";
import { Search, Bell, Download, X } from "lucide-react";
import { FlexnitLogo } from "../common/FlexnitLogo";
import { useUIStore, NavTab } from "../../stores/useUIStore";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { useProfileStore } from "../../stores/useProfileStore";

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useUIStore();
  const { downloads } = useDownloadStore();
  const { unreadCount } = useNotificationStore();
  const { profiles, activeProfileId } = useProfileStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const downloadCount = downloads.length;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems: { label: string; tab: NavTab }[] = [
    { label: "Home", tab: "home" },
    { label: "TV Shows", tab: "series" },
    { label: "Movies", tab: "films" },
    { label: "African Cinema", tab: "african" },
    { label: "New & Popular", tab: "popular" },
    { label: "My List", tab: "mylist" },
  ];

  return (
    <nav
      className={`fixed top-8 left-0 right-0 z-40 h-16 transition-colors duration-500 flex items-center justify-between px-8 md:px-14 select-none ${
        isScrolled
          ? "bg-[#141414] shadow-lg shadow-black/60"
          : "bg-gradient-to-b from-[#141414] via-[#141414]/80 to-transparent"
      }`}
    >
      {/* Left side: Logo & Nav items */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div onClick={() => setActiveTab("home")}>
          <FlexnitLogo size="md" />
        </div>

        <ul className="hidden md:flex items-center space-x-5 text-sm">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab && !searchQuery;
            return (
              <li key={item.tab}>
                <button
                  onClick={() => {
                    setActiveTab(item.tab);
                    setSearchQuery("");
                  }}
                  className={`transition-colors duration-200 ${
                    isActive
                      ? "text-white font-bold cursor-default"
                      : "text-zinc-300 hover:text-zinc-400 font-normal"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right side utilities */}
      <div className="flex items-center space-x-5 text-white">
        {/* Animated Search input */}
        <div className="flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center bg-black/80 border border-white/60 px-2.5 py-1 rounded transition-all duration-300 w-48 sm:w-64">
              <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "african" || activeTab === "african_catalog"
                    ? "Search African movies, actors..."
                    : "Titles, people, genres"
                }
                autoFocus
                className="bg-transparent border-none outline-none text-white text-xs w-full placeholder:text-zinc-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-zinc-200 hover:text-white transition-colors p-1"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Notifications Icon with Dynamic Unread Badge */}
        <button
          onClick={() => {
            setActiveTab("notifications");
            setSearchQuery("");
          }}
          className={`transition-colors relative p-1.5 rounded hover:bg-white/10 cursor-pointer ${
            activeTab === "notifications"
              ? "text-red-500 bg-white/5"
              : "text-zinc-200 hover:text-white"
          }`}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#E50914] text-white text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-sm shadow-black/80 animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Downloads Quick Icon with Counter */}
        <button
          onClick={() => {
            setActiveTab("downloads");
            setSearchQuery("");
          }}
          className={`transition-colors relative p-1.5 rounded hover:bg-white/10 cursor-pointer ${
            activeTab === "downloads"
              ? "text-red-500 bg-white/5"
              : "text-zinc-200 hover:text-white"
          }`}
          title="Downloads"
        >
          <Download className="w-5 h-5" />
          {downloadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#E50914] text-white text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow-sm shadow-black/80">
              {downloadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => {
            setActiveTab("profile");
            setSearchQuery("");
          }}
          className={`flex items-center space-x-1.5 cursor-pointer group p-1 rounded transition-all hover:scale-105 ${
            activeTab === "profile" ? "ring-2 ring-white/60 rounded-md bg-white/5" : ""
          }`}
          title={`Active Profile: ${activeProfile.name}`}
        >
          {activeProfile.avatarUrl ? (
            <img
              src={activeProfile.avatarUrl}
              alt={activeProfile.name}
              className="w-8 h-8 rounded object-cover shadow-sm shadow-black/80 border border-white/20"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded bg-gradient-to-tr ${activeProfile.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-black/80 border border-white/10`}
            >
              {activeProfile.name.charAt(0)}
            </div>
          )}
          <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">
            ▼
          </span>
        </button>
      </div>
    </nav>
  );
};
