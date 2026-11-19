import React, { useState, useEffect } from "react";
import { Search, Bell, Download, X, User } from "lucide-react";
import { FlexnitLogo } from "../common/FlexnitLogo";
import { useUIStore, NavTab } from "../../stores/useUIStore";
import { useDownloadStore } from "../../stores/useDownloadStore";

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, searchQuery, setSearchQuery } = useUIStore();
  const { downloads } = useDownloadStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const completedDownloadsCount = downloads.filter(
    (d) => d.status === "completed"
  ).length;

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
    { label: "Downloads", tab: "downloads" },
  ];

  return (
    <nav
      className={`fixed top-8 left-0 right-0 z-40 h-16 transition-colors duration-500 flex items-center justify-between px-8 md:px-14 select-none ${
        isScrolled
          ? "bg-[#141414] shadow-lg shadow-black/60"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
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
                  {item.tab === "downloads" && completedDownloadsCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-full font-bold">
                      {completedDownloadsCount}
                    </span>
                  )}
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

        {/* Notifications Icon */}
        <button
          className="text-zinc-200 hover:text-white transition-colors relative p-1"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
        </button>

        {/* Downloads Quick Icon */}
        <button
          onClick={() => {
            setActiveTab("downloads");
            setSearchQuery("");
          }}
          className={`transition-colors relative p-1 ${
            activeTab === "downloads"
              ? "text-red-500"
              : "text-zinc-200 hover:text-white"
          }`}
          title="Downloads"
        >
          <Download className="w-5 h-5" />
          {completedDownloadsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {completedDownloadsCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <div className="flex items-center space-x-1.5 cursor-pointer group">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">
            ▼
          </span>
        </div>
      </div>
    </nav>
  );
};
