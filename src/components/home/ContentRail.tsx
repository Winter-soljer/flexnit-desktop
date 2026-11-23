import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { UnifiedMedia } from "../../types/movie";
import { MovieCard } from "./MovieCard";
import { Top10Card } from "./Top10Card";

interface ContentRailProps {
  title: string;
  items: UnifiedMedia[];
  isTop10?: boolean;
  isLarge?: boolean;
  onExploreAll?: () => void;
}

export const ContentRail: React.FC<ContentRailProps> = ({
  title,
  items,
  isTop10 = false,
  isLarge = false,
  onExploreAll,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [isMoved, setIsMoved] = useState(false);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.75
          : scrollLeft + clientWidth * 0.75;

      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      if (direction === "right") setIsMoved(true);
      if (direction === "left" && scrollTo <= 10) setIsMoved(false);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative group my-2">
      {/* Rail Title */}
      <div className="flex items-center space-x-2 mb-1 px-8 md:px-14">
        <h2
          onClick={onExploreAll}
          className={`text-lg md:text-xl font-bold text-white tracking-wide transition-colors ${
            onExploreAll ? "cursor-pointer group-hover:text-red-500" : ""
          }`}
        >
          {title}
        </h2>
        {onExploreAll && (
          <button
            onClick={onExploreAll}
            className="text-xs text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold cursor-pointer flex items-center gap-0.5 focus:outline-none"
            title={`Explore All ${title}`}
          >
            <span>Explore All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Left Chevron Button */}
      {isMoved && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-0 top-8 bottom-0 z-30 w-12 bg-black/70 hover:bg-black/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-r shadow-2xl backdrop-blur-sm cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Scrolling Content Rail */}
      <div
        ref={rowRef}
        className="flex items-center space-x-4 overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth py-5 px-8 md:px-14"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, idx) =>
          isTop10 ? (
            <Top10Card key={item.id} media={item} rank={idx + 1} />
          ) : (
            <MovieCard
              key={item.id}
              media={item}
              isLarge={isLarge}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
            />
          )
        )}
      </div>

      {/* Right Chevron Button */}
      <button
        onClick={() => handleScroll("right")}
        className="absolute right-0 top-8 bottom-0 z-30 w-12 bg-black/70 hover:bg-black/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-l shadow-2xl backdrop-blur-sm cursor-pointer"
        title="Scroll Right"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </div>
  );
};
