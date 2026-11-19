import React from "react";
import { UnifiedMedia } from "../../types/movie";
import { getPosterUrl } from "../../services/tmdb";
import { useUIStore } from "../../stores/useUIStore";

interface Top10CardProps {
  media: UnifiedMedia;
  rank: number; // 1 to 10
}

export const Top10Card: React.FC<Top10CardProps> = ({ media, rank }) => {
  const { openDetailModal } = useUIStore();
  const poster = getPosterUrl(media.posterPath);

  return (
    <div
      onClick={() => openDetailModal(media)}
      className="relative flex-none flex items-end cursor-pointer group select-none transition-transform duration-300 hover:scale-105"
      style={{ width: "230px", height: "190px" }}
    >
      {/* Giant Stylized Rank Number SVG */}
      <div className="relative -mr-6 z-10 w-28 h-full flex items-end">
        <svg
          viewBox="0 0 100 130"
          className="w-full h-full overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
        >
          <text
            x="10"
            y="120"
            fontSize="140"
            fontWeight="900"
            fontFamily="'Arial Black', Impact, sans-serif"
            fill="#141414"
            stroke="#595959"
            strokeWidth="4"
            letterSpacing="-8"
          >
            {rank}
          </text>
        </svg>
      </div>

      {/* Vertical Poster Card */}
      <div className="relative w-32 h-44 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl z-20">
        {poster ? (
          <img
            src={poster}
            alt={media.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:brightness-110 transition-all"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2 text-center text-xs text-zinc-400 bg-zinc-800">
            {media.title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <span className="text-[11px] font-bold text-white truncate drop-shadow">
            {media.title}
          </span>
        </div>
      </div>
    </div>
  );
};
