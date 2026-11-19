import React, { useState, useEffect } from "react";
import { Play, Info, Volume2, VolumeX, Plus, Check } from "lucide-react";
import { Movie, UnifiedMedia } from "../../types/movie";
import { getBackdropUrl } from "../../services/tmdb";
import { tmdbService } from "../../services/tmdb";
import { useUIStore } from "../../stores/useUIStore";
import { useMyListStore } from "../../stores/useMyListStore";

interface HeroBannerProps {
  movie: Movie | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movie }) => {
  const { openDetailModal, openPlayer } = useUIStore();
  const { isInList, toggleItem } = useMyListStore();

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!movie) return;
    let isMounted = true;

    // Fetch trailer for hero video preview
    tmdbService.getMovieVideos(movie.id).then((videos) => {
      if (!isMounted) return;
      const trailer =
        videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        videos[0];
      if (trailer) {
        setTrailerKey(trailer.key);
        // Auto-play trailer preview after 3 seconds
        const timer = setTimeout(() => {
          if (isMounted) setIsPlayingTrailer(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [movie]);

  if (!movie) {
    return (
      <div className="relative h-[70vh] w-full bg-zinc-900 animate-pulse flex items-center justify-center">
        <div className="text-zinc-600 text-lg">Loading Featured Content...</div>
      </div>
    );
  }

  const unifiedMedia: UnifiedMedia = {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    posterPath: movie.poster_path,
    backdropPath: movie.backdrop_path,
    voteAverage: movie.vote_average,
    releaseDate: movie.release_date || "",
    mediaType: "movie",
    durationFormatted: movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : undefined,
  };

  const isSaved = isInList(movie.id);
  const backdrop = getBackdropUrl(movie.backdrop_path);
  const matchScore = Math.min(99, Math.max(70, Math.round(movie.vote_average * 10)));

  return (
    <div className="relative h-[80vh] w-full select-none overflow-hidden">
      {/* Background Image / Video Player */}
      {isPlayingTrailer && trailerKey ? (
        <div className="absolute inset-0 w-full h-full pointer-events-none scale-125">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${
              isMuted ? 1 : 0
            }&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1`}
            title="Hero Trailer"
            className="w-full h-full object-cover"
            allow="autoplay; encrypted-media"
          />
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {backdrop && (
            <img
              src={backdrop}
              alt={movie.title}
              className="w-full h-full object-cover object-center animate-kenburns"
            />
          )}
        </div>
      )}

      {/* Multi-directional Cinematic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent w-[60%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#141414] to-transparent" />

      {/* Hero Content Stack */}
      <div className="absolute bottom-26 md:bottom-28 left-8 md:left-14 max-w-2xl z-20 space-y-4">
        {/* Original Series / Top Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-red-600 text-white font-black text-xs tracking-widest rounded-sm uppercase">
            FLEXNIT ORIGINAL
          </span>
          <span className="text-xs font-bold text-amber-400">
            ★ {matchScore}% Match
          </span>
          <span className="text-xs text-zinc-400">
            {movie.release_date?.slice(0, 4)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl leading-none">
          {movie.title}
        </h1>

        {/* Overview Synopsis */}
        <p className="text-sm md:text-base text-zinc-200 line-clamp-3 leading-relaxed drop-shadow max-w-xl">
          {movie.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          {/* Play Button */}
          <button
            onClick={() => openPlayer({ media: unifiedMedia })}
            className="flex items-center space-x-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-sm md:text-base rounded transition-all transform hover:scale-105 shadow-lg"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>Play</span>
          </button>

          {/* More Info Button */}
          <button
            onClick={() => openDetailModal(unifiedMedia)}
            className="flex items-center space-x-2 px-6 py-2.5 bg-zinc-600/70 hover:bg-zinc-600/90 text-white font-semibold text-sm md:text-base rounded backdrop-blur-sm transition-all shadow-lg"
          >
            <Info className="w-5 h-5" />
            <span>More Info</span>
          </button>

          {/* Add to List Button */}
          <button
            onClick={() => toggleItem(unifiedMedia)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 border border-white/40 text-white flex items-center justify-center transition-colors"
            title={isSaved ? "In My List" : "Add to My List"}
          >
            {isSaved ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Right Controls (Sound Toggle & Rating Tag) */}
      <div className="absolute bottom-26 md:bottom-28 right-8 md:right-14 z-20 flex items-center space-x-3">
        {trailerKey && isPlayingTrailer && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full border border-white/60 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-zinc-300" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        <div className="border-l-4 border-zinc-500 bg-black/50 text-zinc-200 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          16+ | Ultra HD 4K
        </div>
      </div>
    </div>
  );
};
