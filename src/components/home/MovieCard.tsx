import React, { useState } from "react";
import { Play, Plus, Check, ChevronDown, Download, ThumbsUp } from "lucide-react";
import { UnifiedMedia } from "../../types/movie";
import { getBackdropUrl, getPosterUrl } from "../../services/tmdb";
import { useMyListStore } from "../../stores/useMyListStore";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useUIStore } from "../../stores/useUIStore";

interface MovieCardProps {
  media: UnifiedMedia;
  isLarge?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  media,
  isLarge = false,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const { isInList, toggleItem } = useMyListStore();
  const { addDownload, downloads } = useDownloadStore();
  const { openDetailModal, openPlayer } = useUIStore();

  const isSaved = isInList(media.id);
  const backdrop =
    getBackdropUrl(media.backdropPath) ||
    getPosterUrl(media.posterPath) ||
    "";
  const matchScore = Math.min(99, Math.max(65, Math.round((media.voteAverage || 7.5) * 10)));

  const isDownloaded = downloads.some(
    (d) => d.mediaId === media.id && d.status === "completed"
  );
  const isDownloading = downloads.some(
    (d) => d.mediaId === media.id && d.status === "downloading"
  );

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    openPlayer({ media });
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem(media);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    addDownload(
      media.id,
      media.mediaType,
      media.title,
      media.posterPath,
      media.backdropPath
    );
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetailModal(media);
  };

  return (
    <div
      className={`relative flex-none cursor-pointer select-none group transition-all duration-300 ease-out hover:scale-105 hover:z-30 ${className}`}
      style={{
        width: className ? undefined : isLarge ? "280px" : "240px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpenDetail}
    >
      {/* Contained Card Thumbnail & Action Overlay */}
      <div className="relative aspect-video rounded-md overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-md group-hover:shadow-2xl group-hover:shadow-black group-hover:border-zinc-600 transition-all duration-300">
        {backdrop ? (
          <img
            src={backdrop}
            alt={media.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-850 p-2 text-center text-xs text-zinc-400">
            {media.title}
          </div>
        )}

        {/* Resting Title Gradient (visible when not hovered) */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-2.5 transition-opacity duration-200 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-xs font-semibold text-white drop-shadow truncate w-full">
            {media.title}
          </span>
        </div>

        {/* Hover Quick Action Drawer (seamlessly fades & slides up inside card) */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col justify-end p-2.5 transition-all duration-200 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="space-y-1.5">
            {/* Title */}
            <p className="text-xs font-bold text-white drop-shadow truncate">
              {media.title}
            </p>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {/* Play Button */}
                <button
                  onClick={handlePlay}
                  className="w-6 h-6 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-transform hover:scale-110 shadow"
                  title="Play"
                >
                  <Play className="w-3 h-3 fill-black translate-x-0.5" />
                </button>

                {/* Add to List */}
                <button
                  onClick={handleToggleList}
                  className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                  title={isSaved ? "Remove from My List" : "Add to My List"}
                >
                  {isSaved ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </button>

                {/* Like Button */}
                <button
                  className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                  title="Like"
                >
                  <ThumbsUp className="w-2.5 h-2.5" />
                </button>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className={`w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 flex items-center justify-center transition-colors ${
                    isDownloaded
                      ? "text-green-400"
                      : isDownloading
                      ? "text-red-500 animate-pulse"
                      : "text-white"
                  }`}
                  title={
                    isDownloaded
                      ? "Downloaded"
                      : isDownloading
                      ? "Downloading..."
                      : "Download to App"
                  }
                >
                  <Download className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Expand Details Modal Button */}
              <button
                onClick={handleOpenDetail}
                className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                title="More info"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Badges / Metadata */}
            <div className="flex items-center space-x-1.5 text-[9px] text-zinc-300 font-medium">
              <span className="text-green-400 font-bold">{matchScore}% Match</span>
              <span className="px-1 py-0.2 border border-zinc-600 text-zinc-400 rounded text-[7px]">
                HD
              </span>
              <span className="px-1 py-0.2 border border-zinc-600 text-zinc-400 rounded text-[7px]">
                16+
              </span>
              {media.durationFormatted ? (
                <span className="text-zinc-400 truncate">{media.durationFormatted}</span>
              ) : media.releaseDate ? (
                <span className="text-zinc-400">{media.releaseDate.slice(0, 4)}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
