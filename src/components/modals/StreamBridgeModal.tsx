import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Download,
  Play,
  Clipboard,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useDownloadStore } from "../../stores/useDownloadStore";

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

interface StreamBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StreamBridgeData | null;
  onDownloadStarted?: () => void;
}

export const StreamBridgeModal: React.FC<StreamBridgeModalProps> = ({
  isOpen,
  onClose,
  data,
  onDownloadStarted,
}) => {
  const [streamUrl, setStreamUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { addDownload } = useDownloadStore();

  if (!isOpen || !data) return null;

  const isTv =
    data.type === "series" &&
    data.season !== undefined &&
    data.episode !== undefined;

  const vidsparkUrl =
    data.vidsparkUrl ||
    (isTv
      ? `https://vidspark.to/tv/${data.tmdbId}/${data.season}/${data.episode}`
      : `https://vidspark.to/movie/${data.tmdbId}`);

  const handleOpenVidspark = () => {
    window.open(vidsparkUrl, "_blank", "noopener,noreferrer,width=1100,height=700");
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().startsWith("http")) {
          setStreamUrl(text.trim());
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch (e) {
      console.warn("Clipboard read not permitted:", e);
    }
  };

  const handleStartStreamDownload = () => {
    if (!streamUrl.trim()) return;

    const fullTitle = isTv
      ? `${data.title} S${data.season}E${data.episode}`
      : data.title;

    addDownload(
      data.tmdbId,
      data.type || "movie",
      fullTitle,
      data.posterUrl,
      data.backdropUrl,
      data.season,
      data.episode,
      undefined,
      null,
      streamUrl.trim()
    );

    setStreamUrl("");
    onClose();
    onDownloadStarted?.();
  };

  const handlePlayExternalHls = () => {
    if (!streamUrl.trim()) return;
    const playerUrl = `https://m3u8-player.com/#url=${encodeURIComponent(
      streamUrl.trim()
    )}`;
    window.open(playerUrl, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            TMDB Stream & Download Bridge
          </h2>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
          TMDB titles stream full movies via dynamic HLS. Open Vidspark to stream
          directly, or paste the stream URL to download in the background via
          StreamLink.
        </p>

        {/* Media Banner Card */}
        <div className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl mb-5">
          {data.posterUrl && (
            <img
              src={
                data.posterUrl.startsWith("http")
                  ? data.posterUrl
                  : `https://image.tmdb.org/t/p/w200${data.posterUrl}`
              }
              alt={data.title}
              className="w-12 h-16 rounded-md object-cover shrink-0 border border-zinc-800"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-white truncate">{data.title}</h3>
            <p className="text-xs text-zinc-400 capitalize">
              {isTv
                ? `Season ${data.season} • Episode ${data.episode}`
                : data.type || "Movie"}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              TMDB ID: {data.tmdbId}
            </p>
          </div>
        </div>

        {/* Action 1: Open Player Button */}
        <div className="space-y-4">
          <button
            onClick={handleOpenVidspark}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white font-medium text-xs transition-colors shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>Open Stream in Player Window</span>
          </button>

          {/* Action 2: Paste Stream URL */}
          <div className="space-y-2 pt-1 border-t border-zinc-900">
            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span className="font-semibold">Direct Stream URL (.m3u8 / .mp4):</span>
              <button
                onClick={handlePasteClipboard}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Pasted!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://.../master.m3u8"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Action 3: Start Download or Play Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleStartStreamDownload}
              disabled={!streamUrl.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Stream</span>
            </button>

            <button
              onClick={handlePlayExternalHls}
              disabled={!streamUrl.trim()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed border border-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
              title="Test playback in external HLS player"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamBridgeModal;
