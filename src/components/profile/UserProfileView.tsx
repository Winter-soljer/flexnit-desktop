import React, { useState, useRef } from "react";
import {
  Info,
  Film,
  HardDrive,
  Globe,
  Sliders,
  Check,
  ArrowLeft,
  Camera,
  Edit2,
  DownloadCloud,
} from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import { useProfileStore, DownloadQuality } from "../../stores/useProfileStore";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { Footer } from "../layout/Footer";

export const UserProfileView: React.FC = () => {
  const { setActiveTab } = useUIStore();
  const { downloads } = useDownloadStore();

  const {
    profiles,
    activeProfileId,
    downloadQuality,
    autoplayNext,
    autoplayPreviews,
    smartDownloads,
    subtitleLang,
    audioLang,
    switchProfile,
    updateProfileName,
    updateProfileAvatar,
    setDownloadQuality,
    setAutoplayNext,
    setAutoplayPreviews,
    setSmartDownloads,
    setSubtitleLang,
    setAudioLang,
  } = useProfileStore();

  const [activeSection, setActiveSection] = useState<"account" | "about">("account");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const handleStartEditName = () => {
    setEditedName(activeProfile.name);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateProfileName(activeProfile.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateProfileAvatar(activeProfile.id, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const qualityOptions: {
    id: DownloadQuality;
    label: string;
    sub: string;
    badge: string;
  }[] = [
    {
      id: "480p",
      label: "Standard Definition (480p)",
      sub: "Smallest file size • Fast downloads • Data saver",
      badge: "SD",
    },
    {
      id: "720p",
      label: "High Definition (720p)",
      sub: "Crisp HD • Great balance of speed and clarity",
      badge: "HD",
    },
    {
      id: "1080p",
      label: "Full HD (1080p)",
      sub: "Maximum resolution • Cinema detail • Crystal clear",
      badge: "FHD",
    },
  ];

  const completedDownloadsCount = downloads.filter((d) => d.status === "completed").length;

  return (
    <div className="w-full px-8 md:px-14 pt-24 pb-20 min-h-[85vh] select-none text-white">
      {/* Hidden File Input for Custom Avatar Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab("home")}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide">Account & Profile</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage your profile details, download quality, and playback settings
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("home")}
          className="px-5 py-2 bg-[#222222] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] text-xs font-bold text-white rounded-md border border-white/10 shadow-md shadow-black/50 transition-all active:scale-95 cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Profile Header & Switcher */}
      <div className="mt-8 p-6 sm:p-7 bg-[#181818] rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          {/* Avatar with Custom Upload Action */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group w-18 h-18 rounded-xl overflow-hidden cursor-pointer shadow-lg shadow-black/80 border-2 border-white/20 hover:border-white transition-all flex items-center justify-center shrink-0"
            title="Click to change profile picture"
          >
            {activeProfile.avatarUrl ? (
              <img
                src={activeProfile.avatarUrl}
                alt={activeProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-tr ${activeProfile.avatarColor} flex items-center justify-center text-white text-3xl font-bold`}
              >
                {activeProfile.name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold">
              <Camera className="w-5 h-5 mb-1" />
              <span>Change</span>
            </div>
          </div>

          <div>
            {/* Inline Username Editing */}
            <div className="flex items-center space-x-3">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    className="bg-black/80 border border-white/40 rounded px-2.5 py-1 text-sm font-bold text-white outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs font-bold rounded cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-white">{activeProfile.name}</h2>
                  <button
                    onClick={handleStartEditName}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span
                className={`px-2.5 py-0.5 text-[9px] text-white font-black rounded-xs tracking-wider uppercase shadow-xs ${
                  activeProfile.isKids ? "bg-amber-600" : "bg-[#E50914]"
                }`}
              >
                {activeProfile.roleBadge}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-1 font-medium">
              {activeProfile.isKids
                ? "Kids Profile: Mature & 18+ content restricted • Safe browsing"
                : "Full Catalog Access • 4K & Offline Downloads Enabled"}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Completed Downloads: {completedDownloadsCount} titles offline
            </p>
          </div>
        </div>

        {/* Profile Switcher Row */}
        <div className="flex items-center space-x-3 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-white/[0.06]">
          {profiles.map((p) => {
            const isCurrent = p.id === activeProfileId;
            return (
              <div
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={`flex flex-col items-center cursor-pointer group p-2 rounded-lg transition-all ${
                  isCurrent ? "scale-105" : "opacity-60 hover:opacity-100"
                }`}
                title={`Switch to ${p.name}`}
              >
                <div
                  className={`w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-md shadow-black/70 border-2 transition-all ${
                    isCurrent ? "border-white scale-105 ring-2 ring-red-500/50" : "border-white/10"
                  }`}
                >
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-tr ${p.avatarColor} flex items-center justify-center`}
                    >
                      {p.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium transition-colors ${
                    isCurrent ? "text-white font-bold" : "text-zinc-400 group-hover:text-white"
                  }`}
                >
                  {p.name}
                </span>
                {p.isKids && (
                  <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                    Kids
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-6 border-b border-white/[0.08] mt-8">
        <button
          onClick={() => setActiveSection("account")}
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 cursor-pointer ${
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
          className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 cursor-pointer ${
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
          {/* Preferred Download Quality Section (Replaced Streaming Quality) */}
          <div className="bg-[#181818] p-6 sm:p-7 rounded-xl border border-white/[0.06] border-t-white/[0.12] shadow-xl shadow-black/80 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase flex items-center space-x-2">
                <DownloadCloud className="w-4 h-4 text-[#E50914]" />
                <span>Preferred Download Quality</span>
              </h3>
              <span className="text-[11px] text-zinc-400">
                Applied to all new offline video downloads
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {qualityOptions.map((opt) => {
                const isSelected = downloadQuality === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setDownloadQuality(opt.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#242424] border-2 border-red-500 shadow-lg shadow-black/70 text-white"
                        : "bg-[#121212] border border-white/[0.05] hover:bg-[#1a1a1a] hover:border-white/10 shadow-md shadow-black/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{opt.label}</span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2 font-medium leading-relaxed">
                      {opt.sub}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

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
                    Automatically advance to the next episode in a series with countdown
                  </p>
                </div>
                <button
                  onClick={() => setAutoplayNext(!autoplayNext)}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 cursor-pointer ${
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
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 cursor-pointer ${
                    autoplayPreviews ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/60 block" />
                </button>
              </div>
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
                  value={audioLang}
                  onChange={(e) => setAudioLang(e.target.value)}
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
                    Automatically queue the next episode when watching a series
                  </p>
                </div>
                <button
                  onClick={() => setSmartDownloads(!smartDownloads)}
                  className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors shadow-inner shadow-black/70 cursor-pointer ${
                    smartDownloads ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-md shadow-black/60 block" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-white/[0.04] shadow-sm shadow-black/40">
                <div>
                  <h4 className="text-sm font-bold text-white">Download Storage Location</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    %LOCALAPPDATA%\Flexnit\downloads
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("downloads")}
                  className="px-4 py-2 text-xs bg-[#222222] hover:bg-[#2c2c2c] active:bg-[#1a1a1a] rounded-md text-zinc-200 font-bold border border-white/10 shadow-md shadow-black/50 transition-all active:scale-95 cursor-pointer"
                >
                  Manage Downloads ({completedDownloadsCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* "About Flexnit" Section */
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

          {/* The Relocated Footer */}
          <div className="pt-2 border-t border-white/[0.08]">
            <Footer />
          </div>
        </div>
      )}
    </div>
  );
};
