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
    { name: "Flexnit VIP", color: "from-cyan-600 to-blue-500", current: true },
    { name: "Family", color: "from-purple-600 to-pink-500", current: false },
    { name: "Kids", color: "from-amber-500 to-orange-500", current: false },
  ];

  return (
    <div className="pt-24 pb-16 px-6 sm:px-10 md:px-14 max-w-5xl mx-auto min-h-[85vh] select-none text-white">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
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
          className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded transition-colors"
        >
          Done
        </button>
      </div>

      {/* Profile Header & Switcher */}
      <div className="mt-8 p-6 bg-[#181818] rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-cyan-900/30 ring-2 ring-white/20">
            <User className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">Flexnit Member</h2>
              <span className="px-2 py-0.5 text-[10px] bg-red-600 text-white font-black rounded tracking-wider">
                VIP ULTRA HD
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">member@flexnit.desktop • 4 Screens Active</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Next billing date: November 2027</p>
          </div>
        </div>

        {/* Profile Switcher Row */}
        <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-zinc-800">
          {profiles.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col items-center cursor-pointer group p-1.5 rounded-lg transition-transform ${
                p.current ? "scale-105" : "opacity-60 hover:opacity-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded bg-gradient-to-tr ${p.color} flex items-center justify-center text-white text-xs font-bold shadow ${
                  p.current ? "ring-2 ring-red-600" : ""
                }`}
              >
                {p.name.charAt(0)}
              </div>
              <span className="text-[10px] text-zinc-400 group-hover:text-white mt-1">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-4 border-b border-zinc-800 mt-8">
        <button
          onClick={() => setActiveSection("account")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeSection === "account"
              ? "border-red-600 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Playback & Preferences</span>
        </button>

        <button
          onClick={() => setActiveSection("about")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-colors border-b-2 ${
            activeSection === "about"
              ? "border-red-600 text-white"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
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
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80 space-y-5">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center space-x-2">
              <Film className="w-4 h-4 text-red-500" />
              <span>Playback Settings</span>
            </h3>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Autoplay next episode</h4>
                  <p className="text-xs text-zinc-400">
                    Automatically plays the next episode in a series without clicking
                  </p>
                </div>
                <button
                  onClick={() => setAutoplayNext(!autoplayNext)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoplayNext ? "bg-red-600 justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Autoplay previews</h4>
                  <p className="text-xs text-zinc-400">
                    Preview trailers and video clips while browsing rails
                  </p>
                </div>
                <button
                  onClick={() => setAutoplayPreviews(!autoplayPreviews)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoplayPreviews ? "bg-red-600 justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>
            </div>
          </div>

          {/* Streaming & Video Quality */}
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80 space-y-5">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center space-x-2">
              <Tv className="w-4 h-4 text-cyan-500" />
              <span>Video & Stream Quality</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "4k", label: "Ultra HD (4K)", sub: "Highest visual fidelity • Best sound" },
                { id: "1080p", label: "Full HD (1080p)", sub: "Crisp picture • Balanced data" },
                { id: "auto", label: "Data Saver", sub: "Optimized for limited bandwidth" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setStreamQuality(opt.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    streamQuality === opt.id
                      ? "border-red-600 bg-red-600/10 text-white"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{opt.label}</span>
                    {streamQuality === opt.id && <Check className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{opt.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subtitles & Audio Languages */}
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80 space-y-5">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center space-x-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Audio & Subtitle Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Default Subtitle Language
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-red-600 transition-colors cursor-pointer"
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

              <div>
                <label className="text-xs text-zinc-400 font-medium block mb-1.5">
                  Preferred Audio Language
                </label>
                <select
                  defaultValue="original"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-red-600 transition-colors cursor-pointer"
                >
                  <option value="original">Original Audio (Recommended)</option>
                  <option value="en">English (Dubbed)</option>
                  <option value="fr">French (Français)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offline & Storage Settings */}
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80 space-y-5">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Downloads & Storage</span>
            </h3>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Smart Downloads</h4>
                  <p className="text-xs text-zinc-400">
                    Automatically download the next episode when on Wi-Fi
                  </p>
                </div>
                <button
                  onClick={() => setSmartDownloads(!smartDownloads)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    smartDownloads ? "bg-red-600 justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">Download Storage Location</h4>
                  <p className="text-xs text-zinc-400">Downloads/Flexnit/Videos</p>
                </div>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 font-semibold transition-colors"
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
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80">
            <div className="flex items-center space-x-3 mb-4">
              <img src="/icon.png" alt="Flexnit" className="w-8 h-8 object-contain rounded" />
              <div>
                <h3 className="text-base font-bold text-white">Flexnit Desktop Client</h3>
                <p className="text-xs text-zinc-400">Version 1.0.0 (Production Release)</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
              Flexnit is an ultra-fast, cinematic desktop entertainment client delivering Hollywood
              blockbusters, global series, and the finest curated African cinema (Nollywood & beyond).
              Engineered with native Tauri architecture and high-performance video streaming pipelines.
            </p>

            {/* Architecture Details Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-zinc-800/60 text-xs">
              <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Core Engine</span>
                <span className="font-semibold text-white mt-0.5 block">Tauri v2 Native</span>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">UI Runtime</span>
                <span className="font-semibold text-white mt-0.5 block">React 19 & Vite</span>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Media Pipeline</span>
                <span className="font-semibold text-white mt-0.5 block">StreamLink + Sidecars</span>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Platform</span>
                <span className="font-semibold text-white mt-0.5 block">Windows x86_64</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-[#181818] p-6 rounded-xl border border-zinc-800/80">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              System Diagnostics
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>StreamLink Engine: Active</span>
              </span>
              <span className="px-3 py-1 bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Native Sidecar: Ready</span>
              </span>
              <span className="px-3 py-1 bg-blue-950/40 border border-blue-800/60 text-blue-400 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Hardware Acceleration: Enabled</span>
              </span>
            </div>
          </div>

          {/* The Relocated Footer (Exclusively here in About page) */}
          <div className="pt-4 border-t border-zinc-800">
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
};
