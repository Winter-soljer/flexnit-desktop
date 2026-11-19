import React, { useEffect, useRef } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Clock, Globe } from "lucide-react";
import { AfricanMovie } from "../../types/african";
import { UnifiedMedia } from "../../types/movie";
import { useUIStore } from "../../stores/useUIStore";
import { useAfricanStore } from "../../stores/useAfricanStore";

interface AfricanHeroSliderProps {
  movies: AfricanMovie[];
}

export const AfricanHeroSlider: React.FC<AfricanHeroSliderProps> = ({ movies }) => {
  const { activeSlide, nextSlide, prevSlide, setActiveSlide } = useAfricanStore();
  const { openPlayer, openDetailModal } = useUIStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (!movies || movies.length <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [movies, nextSlide]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[activeSlide] || movies[0];

  const mapToUnified = (movie: AfricanMovie): UnifiedMedia => ({
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
  });

  const backdrop = currentMovie.backdropUrl || currentMovie.thumbnailUrl || "";

  return (
    <div className="relative h-[72vh] min-h-[500px] w-full overflow-hidden select-none group">
      {/* Background Image with Ken Burns effect */}
      <div className="absolute inset-0">
        <img
          key={currentMovie.id}
          src={backdrop}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-center animate-kenburns transition-opacity duration-700"
        />
      </div>

      {/* Cinematic Netflix Vignette Gradients matching flexnitweb */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent w-[75%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-black/30" />

      {/* Content Container */}
      <div className="absolute bottom-16 left-8 md:left-14 max-w-2xl z-20 space-y-4">
        {/* Release & Region Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 font-extrabold text-[11px] rounded-full tracking-wider uppercase flex items-center shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse text-amber-400" />
            African Cinema Spotlight
          </span>
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white">
            <Globe className="w-3.5 h-3.5 text-red-500" />
            <span className="font-semibold">{currentMovie.countryName || "Nollywood"}</span>
          </div>
          <span className="px-2 py-0.5 border border-zinc-600/80 bg-black/40 text-[10px] text-zinc-300 rounded font-semibold">
            Full HD
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
          {currentMovie.title}
        </h1>

        {/* Metadata Pill Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-zinc-300">
          <span className="text-amber-400 font-bold">{currentMovie.genre || "Drama"}</span>
          <span className="text-zinc-600">•</span>
          {currentMovie.releaseYear && <span>{currentMovie.releaseYear}</span>}
          {currentMovie.durationFormatted && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-zinc-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                {currentMovie.durationFormatted}
              </span>
            </>
          )}
          {currentMovie.channelTitle && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-zinc-300 font-medium">
                {currentMovie.channelTitle}
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
              </span>
            </>
          )}
        </div>

        {/* Synopsis */}
        <p className="text-xs sm:text-sm text-zinc-200 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
          {currentMovie.description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => openPlayer({ media: mapToUnified(currentMovie) })}
            className="flex items-center space-x-2 px-7 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white translate-x-0.5" />
            <span>Watch Full Movie</span>
          </button>

          <button
            onClick={() => openDetailModal(mapToUnified(currentMovie))}
            className="flex items-center space-x-2 px-6 py-3 bg-zinc-800/90 hover:bg-zinc-700 text-white font-semibold text-sm rounded-lg backdrop-blur-sm border border-zinc-700 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
            <span>More Info</span>
          </button>
        </div>
      </div>

      {/* Left Chevron Navigation */}
      {movies.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer shadow-lg"
          title="Previous Movie"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Chevron Navigation */}
      {movies.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer shadow-lg"
          title="Next Movie"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Slide Indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-6 right-8 md:right-14 z-30 flex items-center space-x-1.5">
          {movies.slice(0, 10).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                activeSlide === idx
                  ? "w-8 bg-red-600 shadow-md shadow-red-600/50"
                  : "w-3 bg-white/40 hover:bg-white/70"
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AfricanHeroSlider;
