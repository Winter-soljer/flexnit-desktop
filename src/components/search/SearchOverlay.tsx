import React, { useEffect, useState } from "react";
import { Search, Globe2, Film } from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";
import { tmdbService } from "../../services/tmdb";
import { africanService } from "../../services/africanApi";
import { UnifiedMedia } from "../../types/movie";
import { AfricanMovie } from "../../types/african";
import { MovieCard } from "../home/MovieCard";

export const SearchOverlay: React.FC = () => {
  const { searchQuery, activeTab } = useUIStore();
  const [results, setResults] = useState<UnifiedMedia[]>([]);
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isAfricanMode, setIsAfricanMode] = useState(
    activeTab === "african" || activeTab === "african_catalog"
  );

  // Keep mode in sync with activeTab when search is opened
  useEffect(() => {
    setIsAfricanMode(activeTab === "african" || activeTab === "african_catalog");
  }, [activeTab]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        if (isAfricanMode) {
          // Query the 8,400+ African Movie Catalog
          const res = await africanService.searchMovies(searchQuery, 1, 36);
          const mapped: UnifiedMedia[] = res.movies.map((m: AfricanMovie) => ({
            id: m.id,
            title: m.title,
            overview: m.description,
            posterPath: m.thumbnailUrl,
            backdropPath: m.backdropUrl || m.thumbnailUrl,
            voteAverage: 8.5,
            releaseDate: String(m.releaseYear || 2026),
            mediaType: "african",
            durationFormatted: m.durationFormatted || "Feature",
            youtubeKey: m.youtubeVideoId,
            genres: [m.countryName || "African Cinema", m.genre || "Drama"],
          }));
          setResults(mapped);
        } else {
          // Query Global TMDB
          const data = await tmdbService.searchMulti(searchQuery);
          const mapped: UnifiedMedia[] = data.map((item: any) => ({
            id: item.id,
            title: item.title || item.name || "Untitled",
            overview: item.overview || "",
            posterPath: item.poster_path,
            backdropPath: item.backdrop_path,
            voteAverage: item.vote_average || 0,
            releaseDate: item.release_date || item.first_air_date || "",
            mediaType: item.type === "series" ? "series" : "movie",
          }));
          setResults(mapped);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAfricanMode]);

  if (!searchQuery.trim()) return null;

  const filteredResults = results.filter((r) => {
    if (filter === "all") return true;
    return r.mediaType === filter;
  });

  return (
    <div className="pt-24 px-8 md:px-14 min-h-screen text-white select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center">
              <Search className="w-5 h-5 text-red-500 mr-2" />
              {isAfricanMode ? "African Cinema" : "Search"} Results for{" "}
              <span className="text-red-500 ml-2">"{searchQuery}"</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Found {filteredResults.length} title{filteredResults.length === 1 ? "" : "s"} in{" "}
            {isAfricanMode ? "African Catalog (8,470+ database)" : "Global Catalog"}
          </p>
        </div>

        {/* Catalog Scope Switcher & Filters */}
        <div className="flex items-center space-x-2">
          {/* African / Global Catalog Toggle */}
          <button
            onClick={() => setIsAfricanMode(!isAfricanMode)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
              isAfricanMode
                ? "bg-red-600/20 border-red-600 text-red-400 hover:bg-red-600/30"
                : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white"
            }`}
          >
            {isAfricanMode ? (
              <>
                <Globe2 className="w-3.5 h-3.5 text-red-500" />
                <span>African Cinema Only</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5 text-zinc-400" />
                <span>Switch to African Search</span>
              </>
            )}
          </button>

          {!isAfricanMode && (
            <div className="flex items-center space-x-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {(["all", "movie", "series"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                    filter === tab ? "bg-red-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "movie" ? "Movies" : "TV Shows"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-video bg-zinc-900 rounded-md animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 pb-20 pt-2">
          {filteredResults.map((item) => (
            <MovieCard key={item.id} media={item} className="w-full" />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-base font-semibold">
            Your search did not have any matches {isAfricanMode ? "in the African Cinema catalog" : ""}.
          </p>
          <p className="text-xs mt-2 text-zinc-600">
            Try searching for another movie title, actor, or genre.
          </p>
          {isAfricanMode && (
            <button
              onClick={() => setIsAfricanMode(false)}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded font-semibold cursor-pointer"
            >
              Search Global Catalog
            </button>
          )}
        </div>
      )}
    </div>
  );
};
