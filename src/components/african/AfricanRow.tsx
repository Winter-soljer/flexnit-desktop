import React, { useRef } from "react";
import { AfricanMovie } from "../../types/african";
import { AfricanMovieCard } from "./AfricanMovieCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AfricanRowProps {
  title: string;
  subtitle?: string;
  movies: AfricanMovie[];
  onViewAll?: () => void;
  flag?: string;
  badgeText?: string;
}

export const AfricanRow: React.FC<AfricanRowProps> = ({
  title,
  subtitle,
  movies,
  onViewAll,
  flag,
  badgeText,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!movies || movies.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="py-4 md:py-6 px-8 md:px-14 relative group select-none">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            {flag && <span className="text-xs px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-bold border border-red-600/30">{flag}</span>}
            <h2 className="text-lg md:text-2xl font-bold tracking-tight text-white">
              {title}
            </h2>
            {badgeText && (
              <span className="text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2.5 py-0.5 rounded-full">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs md:text-sm text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs md:text-sm font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer group/link"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Row Scroll Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll("left")}
          className="absolute -left-5 top-0 bottom-6 w-10 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-r shadow-xl cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Movies Track */}
        <div
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto no-scrollbar scroll-smooth pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[240px] sm:w-[270px] md:w-[300px] flex-none"
            >
              <AfricanMovieCard movie={movie} showDetailsBelow={true} />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll("right")}
          className="absolute -right-5 top-0 bottom-6 w-10 bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-l shadow-xl cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default AfricanRow;

