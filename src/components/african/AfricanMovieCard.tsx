import React, { useState } from "react";
import { Play, Plus, Check, Info, Clock, Eye, CheckCircle2, Film } from "lucide-react";
import { AfricanMovie } from "../../types/african";
import { UnifiedMedia } from "../../types/movie";
import { useMyListStore } from "../../stores/useMyListStore";
import { useUIStore } from "../../stores/useUIStore";

interface AfricanMovieCardProps {
  movie: AfricanMovie;
  className?: string;
  showDetailsBelow?: boolean;
}

function formatViews(views?: number | null): string {
  if (!views) return "0";
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(0) + "K";
  return views.toString();
}

export const AfricanMovieCard: React.FC<AfricanMovieCardProps> = ({
  movie,
  className = "",
  showDetailsBelow = true,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [fallbackAttempt, setFallbackAttempt] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { isInList, toggleItem } = useMyListStore();
  const { openPlayer, openDetailModal } = useUIStore();

  const unifiedMedia: UnifiedMedia = {
    id: movie.id,
    title: movie.title,
    overview: movie.description,
    posterPath: movie.thumbnailUrl,
    backdropPath: movie.backdropUrl || movie.thumbnailUrl || null,
    voteAverage: 8.6,
    releaseDate: String(movie.releaseYear || 2026),
    mediaType: "african",
    durationFormatted: movie.durationFormatted || "Feature",
    youtubeKey: movie.youtubeVideoId,
    genres: [movie.countryName || "African Cinema", movie.genre || "Drama"],
  };

  const isSaved = isInList(movie.id);

  // YouTube high quality CDN resolution with fallbacks
  let imgSrc: string = movie.thumbnailUrl || movie.backdropUrl || "";
  if (fallbackAttempt === 1 && movie.youtubeVideoId) {
    imgSrc = `https://i.ytimg.com/vi/${movie.youtubeVideoId}/hqdefault.jpg`;
  } else if (fallbackAttempt === 2 && movie.youtubeVideoId) {
    imgSrc = `https://i.ytimg.com/vi/${movie.youtubeVideoId}/mqdefault.jpg`;
  } else if (imgSrc && imgSrc.includes("img.youtube.com")) {
    imgSrc = imgSrc.replace("img.youtube.com", "i.ytimg.com");
  }

  const handleImageError = () => {
    if (fallbackAttempt < 2 && movie.youtubeVideoId) {
      setFallbackAttempt((prev) => prev + 1);
    } else {
      setImgFailed(true);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    openPlayer({ media: unifiedMedia });
  };

  const handleToggleList = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleItem(unifiedMedia);
  };

  const handleOpenDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDetailModal(unifiedMedia);
  };

  return (
    <div
      className={`relative group cursor-pointer select-none flex flex-col transition-all duration-300 ease-out hover:scale-105 hover:z-30 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOpenDetail}
    >
      {/* 16:9 Widescreen Card Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-md group-hover:shadow-2xl group-hover:shadow-black group-hover:border-zinc-600 transition-all duration-300">
        {!imgFailed && imgSrc ? (
          <img
            src={imgSrc}
            alt={movie.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-90"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-950/80 via-zinc-900 to-black p-3 flex flex-col justify-between items-center text-center">
            <div className="w-full flex justify-between items-center">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 font-bold border border-red-600/40">
                {movie.countryCode || "AF"}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded border border-white/20 text-zinc-300">
                {movie.releaseYear || 2026}
              </span>
            </div>
            <div className="my-auto flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center mb-1 text-red-500">
                <Film className="w-4 h-4" />
              </div>
              <h4 className="text-[11px] font-bold text-white line-clamp-1 px-1">
                {movie.title}
              </h4>
            </div>
            <div className="w-full text-left">
              <span className="text-[9px] text-zinc-400 block truncate">
                {movie.channelTitle}
              </span>
            </div>
          </div>
        )}

        {/* Top Badges (Country Tag & Studio Pill) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[10px] bg-red-600/40 text-white font-black px-1.5 py-0.5 rounded backdrop-blur-md border border-red-500/50">
            {movie.countryCode || "AF"}
          </span>
          {movie.channelTitle && (
            <span className="text-[10px] bg-black/75 backdrop-blur-md text-zinc-300 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1 max-w-[150px] truncate shadow">
              <span className="truncate">{movie.channelTitle}</span>
              <CheckCircle2 className="w-3 h-3 text-red-500 shrink-0" />
            </span>
          )}
        </div>

        {/* Bottom Badges (Duration & Views) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          {movie.viewCount ? (
            <span className="text-[10px] bg-black/80 backdrop-blur-md text-zinc-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
              <Eye className="w-3 h-3 text-zinc-400" />
              {formatViews(movie.viewCount)}
            </span>
          ) : <span />}

          {movie.durationFormatted && (
            <span className="text-[10px] bg-black/85 backdrop-blur-md text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
              <Clock className="w-3 h-3" />
              {movie.durationFormatted}
            </span>
          )}
        </div>

        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-70 group-hover:opacity-40 transition-opacity pointer-events-none" />

        {/* Resting Title Gradient (visible when not hovered) */}
        <div
          className={`absolute inset-x-0 bottom-7 px-2.5 transition-opacity duration-200 pointer-events-none ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="text-xs font-bold text-white drop-shadow truncate block">
            {movie.title}
          </span>
        </div>

        {/* Hover Action Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] p-3 flex flex-col justify-between transition-opacity duration-200 z-20 ${
            isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
              {movie.genre || "African Cinema"}
            </span>
            <span className="text-[10px] text-zinc-400">
              {movie.releaseYear || 2026}
            </span>
          </div>

          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handlePlay}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transform hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Watch Full Movie"
            >
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </button>
            <button
              onClick={handleToggleList}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center border border-zinc-600 transition-colors cursor-pointer"
              title={isSaved ? "Remove from My List" : "Add to My List"}
            >
              {isSaved ? <Check className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4" />}
            </button>
            <button
              onClick={handleOpenDetail}
              className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-center border border-zinc-600 transition-colors cursor-pointer"
              title="More Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-white truncate">{movie.title}</p>
          </div>
        </div>
      </div>

      {/* Details Below Card (when in grid/catalog view) */}
      {showDetailsBelow && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-100 truncate pr-2 group-hover:text-red-400 transition-colors">
              {movie.title}
            </span>
            <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
              {movie.releaseYear || 2026}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate">{movie.channelTitle || movie.countryName}</span>
            <span className="text-amber-400/90 font-semibold shrink-0">
              {movie.genre}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfricanMovieCard;
