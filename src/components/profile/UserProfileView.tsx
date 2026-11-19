import React, { useState } from "react";
import {
  User,
  Info,
  Film,
  HardDrive,
  Globe,
  Sliders,
  Check,
  ArrowLeft,
  Tv,
} from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import { Footer } from "../layout/Footer";

export const UserProfileView: React.FC = () => {
  const { setActiveTab } = useUIStore();

  const [activeSection, setActiveSection] = useState<"account" | "about">("account");

  // Mock settings state (unwired as requested, but interactive for great feel)
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [autoplayPreviews, setAutoplayPreviews] = useState(true);
  const [smartDownloads, setSmartDownloads] = useState(true);
  const [streamQuality, setStreamQuality] = useState("4k");
  const [subtitleLang, setSubtitleLang] = useState("en");

  const profiles = [
    { name: "Flexnit VIP", color: "from-cyan-600 to-blue-600", current: true },
    { name: "Family", color: "from-purple-600 to-pink-600", current: false },
    { name: "Kids", color: "from-amber-600 to-orange-600", current: false },
  ];

  return (
    <div className="w-full px-8 md:px-14 pt-24 pb-20 min-h-[85vh] select-none text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide">Account & Profile</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your viewing preferences, streaming quality, and system information
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("home")}
          className="px-5 py-2 bg-[#222222] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] text-xs font-bold text-white rounded-md border border-white/10 shadow-md shadow-black/50 transition-all active:scale-95"
        >
          Done
        </button>
      </div>

      {/* Profile Header & Switcher */}
      <div className="mt-8 p-6 sm:p-7 bg-[#181818] rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-black/80 border border-white/10">
            <User className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-white">Flexnit Member</h2>
              <span className="px-2.5 py-0.5 text-[9px] bg-[#E50914] text-white font-black rounded-xs tracking-wider uppercase shadow-xs">
                VIP ULTRA HD
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">member@flexnit.desktop • 4 Screens Active</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Next billing date: November 2027</p>
          </div>
        </div>

        {/* Profile Switcher Row */}
        <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-white/[0.06]">
          {profiles.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col items-center cursor-pointer group p-2 rounded-lg transition-all ${
                p.current ? "scale-105" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-md bg-gradient-to-tr ${p.color} flex items-center justify-center text-white text-xs font-bold shadow-md shadow-black/70 border ${
                  p.current ? "border-2 border-white" : "border-white/10"
                }`}
              >
                {p.name.charAt(0)}
              </div>
              <span className="text-[10px] text-zinc-400 group-hover:text-white mt-1.5 font-medium">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-6 border-b border-white/[0.08] mt-8">
        <button
          onClick={() => setActiveSection("account")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeSection === "account"
              ? "border-[#E50914] text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Playback & Preferences</span>
        </button>

        <button
          onClick={() => setActiveSection("about")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
            activeSection === "about"
              ? "border-[#E50914] text-white"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <Info className="w-4 h-4" />
          <span>About Flexnit</span>
        </button>
      </div>

      {/* Section Content */}
      {activeSection === "account" ? (
        <div className="mt-6 space-y-6">
          {/* Playback Controls */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 space-y-5">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-2">
              <Film className="w-4 h-4 text-[#E50914]" />
              <span>Playback Settings</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <div>
                  <h4 className="text-sm font-bold text-white">Autoplay next episode</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Automatically plays the next episode in a series without clicking
                  </p>
                </div>
                <button
                  onClick={() => setAutoplayNext(!autoplayNext)}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 ${
                    autoplayNext ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/60 block" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <div>
                  <h4 className="text-sm font-bold text-white">Autoplay previews</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Preview trailers and video clips while browsing rails
                  </p>
                </div>
                <button
                  onClick={() => setAutoplayPreviews(!autoplayPreviews)}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 ${
                    autoplayPreviews ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/60 block" />
                </button>
              </div>
            </div>
          </div>

          {/* Streaming & Video Quality */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 space-y-5">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-2">
              <Tv className="w-4 h-4 text-zinc-300" />
              <span>Video & Stream Quality</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "4k", label: "Ultra HD (4K)", sub: "Highest visual fidelity • Best sound" },
                { id: "1080p", label: "Full HD (1080p)", sub: "Crisp picture • Balanced data" },
                { id: "auto", label: "Data Saver", sub: "Optimized for limited bandwidth" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStreamQuality(opt.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    streamQuality === opt.id
                      ? "bg-[#242424] border-2 border-white/40 shadow-lg shadow-black/70 text-white"
                      : "bg-[#121212] border border-white/[0.05] hover:bg-[#1a1a1a] hover:border-white/10 shadow-md shadow-black/50 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{opt.label}</span>
                    {streamQuality === opt.id && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium">{opt.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subtitles & Audio Languages */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 space-y-5">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-2">
              <Globe className="w-4 h-4 text-zinc-300" />
              <span>Audio & Subtitle Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <label className="text-xs text-zinc-300 font-bold block mb-2">
                  Default Subtitle Language
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-md px-3.5 py-2.5 outline-none focus:border-white/30 shadow-inner shadow-black/60 transition-colors cursor-pointer"
                >
                  <option value="en">English [CC]</option>
                  <option value="fr">French (Français)</option>
                  <option value="yo">Yorùbá</option>
                  <option value="ha">Hausa</option>
                  <option value="ig">Igbo</option>
                  <option value="sw">Swahili (Kiswahili)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="off">Off</option>
                </select>
              </div>

              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <label className="text-xs text-zinc-300 font-bold block mb-2">
                  Preferred Audio Language
                </label>
                <select
                  defaultValue="original"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-md px-3.5 py-2.5 outline-none focus:border-white/30 shadow-inner shadow-black/60 transition-colors cursor-pointer"
                >
                  <option value="original">Original Audio (Recommended)</option>
                  <option value="en">English (Dubbed)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offline & Storage Settings */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 space-y-5">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-zinc-300" />
              <span>Downloads & Storage</span>
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <div>
                  <h4 className="text-sm font-bold text-white">Smart Downloads</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Automatically download the next episode when on Wi-Fi
                  </p>
                </div>
                <button
                  onClick={() => setSmartDownloads(!smartDownloads)}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 ${
                    smartDownloads ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/60 block" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <div>
                  <h4 className="text-sm font-bold text-white">Download Storage Location</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Downloads/Flexnit/Videos</p>
                </div>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className="px-4 py-2 text-xs bg-[#222222] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] rounded-md text-zinc-200 font-bold border border-white/10 shadow-md shadow-black/50 transition-all active:scale-95"
                >
                  Manage Downloads
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* "About Flexnit" Section - Contains App info + Relocated Footer */
        <div className="mt-6 space-y-8 animate-fadeIn">
          {/* App Specifications Card */}
          <div className="bg-[#181818] p-6 sm:p-8 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80">
            <div className="flex items-center space-x-3.5 mb-4">
              <img src="/icon.png" alt="Flexnit" className="w-9 h-9 object-contain rounded shadow-sm shadow-black/60" />
              <div>
                <h3 className="text-base font-bold text-white">Flexnit Desktop Client</h3>
                <p className="text-xs text-zinc-400">Version 1.0.0 (Production Release)</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
              Flexnit is an ultra-fast, cinematic desktop entertainment client delivering Hollywood
              blockbusters, global series, and the finest curated African cinema (Nollywood & beyond).
              Engineered with native Tauri architecture and high-performance video streaming pipelines.
            </p>

            {/* Architecture Details Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/[0.06] text-xs">
              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.05] shadow-md shadow-black/60">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Core Engine</span>
                <span className="font-bold text-white mt-1 block">Tauri v2 Native</span>
              </div>

              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.05] shadow-md shadow-black/60">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">UI Runtime</span>
                <span className="font-bold text-white mt-1 block">React 19 & Vite</span>
              </div>

              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.05] shadow-md shadow-black/60">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Media Pipeline</span>
                <span className="font-bold text-white mt-1 block">StreamLink + Sidecars</span>
              </div>

              <div className="p-4 bg-[#121212] rounded-lg border border-white/[0.05] shadow-md shadow-black/60">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Platform</span>
                <span className="font-bold text-white mt-1 block">Windows x86_64</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
              System Diagnostics
            </h4>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="px-3.5 py-2 bg-[#121212] border border-white/[0.08] shadow-md shadow-black/50 text-zinc-200 rounded-md font-semibold flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>StreamLink Engine: Active</span>
              </div>
              <div className="px-3.5 py-2 bg-[#121212] border border-white/[0.08] shadow-md shadow-black/50 text-zinc-200 rounded-md font-semibold flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Native Sidecar: Ready</span>
              </div>
              <div className="px-3.5 py-2 bg-[#121212] border border-white/[0.08] shadow-md shadow-black/50 text-zinc-200 rounded-md font-semibold flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Hardware Acceleration: Enabled</span>
              </div>
            </div>
          </div>

          {/* The Relocated Footer (Exclusively here in About page) */}
          <div className="pt-2 border-t border-white/[0.08]">
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
};
