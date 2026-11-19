import React, { useState, useEffect } from "react";
import { ArrowLeft, Server, Download, Maximize2, SkipForward } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useUIStore } from "../../stores/useUIStore";
import { streamingService, DEFAULT_STREAM_SOURCES } from "../../services/streamingConfig";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useHistoryStore } from "../../stores/useHistoryStore";

export const VideoPlayerModal: React.FC = () => {
  const { activePlayer, closePlayer, openPlayer } = useUIStore();
  const { addDownload, downloads } = useDownloadStore();
  const { addToHistory } = useHistoryStore();

  const [activeServerId, setActiveServerId] = useState<string>("vidlink");

  useEffect(() => {
    if (activePlayer) {
      addToHistory(
        activePlayer.media,
        25,
        activePlayer.season,
        activePlayer.episode
      );
    }
  }, [activePlayer?.media.id, activePlayer?.season, activePlayer?.episode, addToHistory]);

  if (!activePlayer) return null;

  const { media, season = 1, episode = 1 } = activePlayer;

  // Determine streaming URL (Local completed download vs. Live stream)
  let streamUrl = "";
  let isYouTube = false;
  let isLocalVideo = false;

  const downloadItem = downloads.find(
    (d) =>
      d.status === "completed" &&
      (d.fileUrl || d.filePath) &&
      (d.id === `${media.mediaType}_${media.id}` ||
        d.id === `tv_${media.id}_s${season}_e${episode}` ||
        d.mediaId === media.id)
  );

  if (downloadItem) {
    if (downloadItem.fileUrl) {
      streamUrl = downloadItem.fileUrl;
      isLocalVideo = true;
    } else if (downloadItem.filePath) {
      try {
        streamUrl = convertFileSrc(downloadItem.filePath);
      } catch {
        streamUrl = downloadItem.filePath;
      }
      isLocalVideo = true;
    }
  } else if (media.mediaType === "african" || media.youtubeKey) {
    const videoId = media.youtubeKey || String(media.id);
    streamUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&fs=1`;
    isYouTube = true;
  } else if (media.mediaType === "series") {
    streamUrl = streamingService.getTvStreamUrl(
      media.id,
      season,
      episode,
      activeServerId
    );
  } else {
    streamUrl = streamingService.getMovieStreamUrl(media.id, activeServerId);
  }

  const handleNextEpisode = () => {
    openPlayer({
      media,
      season,
      episode: episode + 1,
      sourceId: activeServerId,
    });
  };

  const handleDownload = () => {
    addDownload(
      media.id,
      media.mediaType,
      media.title,
      media.posterPath,
      media.backdropPath,
      season,
      episode,
      undefined,
      media.youtubeKey
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none animate-in fade-in duration-300">
      {/* Player Header Controls */}
      <div className="h-16 px-6 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between text-white z-20">
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={closePlayer}
            className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Back to Browse"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {media.title}
            </h2>
            {media.mediaType === "series" && (
              <p className="text-xs text-zinc-400">
                Season {season} • Episode {episode}
              </p>
            )}
          </div>
        </div>

        {/* Right: Server Selector, Next Episode, Download, Fullscreen */}
        <div className="flex items-center space-x-4">
          {!isYouTube && (
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-xs">
              <Server className="w-3.5 h-3.5 text-red-500" />
              <select
                value={activeServerId}
                onChange={(e) => setActiveServerId(e.target.value)}
                className="bg-transparent border-none text-white text-xs outline-none cursor-pointer"
              >
                {DEFAULT_STREAM_SOURCES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {media.mediaType === "series" && (
            <button
              onClick={handleNextEpisode}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold"
              title="Next Episode"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Download for offline"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Embedded Cinema Player Container */}
      <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center">
        {isLocalVideo ? (
          <video
            src={streamUrl}
            controls
            autoPlay
            className="w-full h-full max-h-screen object-contain"
          />
        ) : (
          <iframe
            src={streamUrl}
            title={media.title}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};
