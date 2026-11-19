import React, { useEffect, useState } from "react";
import {
  Search,
  X,
  Globe,
  Filter,
  Tv,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Film,
  ArrowLeft,
} from "lucide-react";
import { useAfricanStore } from "../../stores/useAfricanStore";
import { useUIStore } from "../../stores/useUIStore";
import { AfricanMovie } from "../../types/african";
import { UnifiedMedia } from "../../types/movie";
import { MovieCard } from "../home/MovieCard";

export const AfricanCatalogView: React.FC = () => {
  const {
    catalogMovies,
    totalCount,
    currentPage,
    totalPages,
    isLoadingCatalog,
    selectedSort,
    selectedCountry,
    selectedGenre,
    selectedChannel,
    catalogSearchQuery,
    availableCountries,
    availableGenres,
    setPage,
    setSort,
    setCountry,
    setGenre,
    setChannel,
    setCatalogSearchQuery,
    resetFilters,
    fetchCatalog,
    fetchMetadata,
  } = useAfricanStore();

  const { setActiveTab } = useUIStore();
  const [searchInput, setSearchInput] = useState(catalogSearchQuery);

  useEffect(() => {
    fetchMetadata();
    fetchCatalog(currentPage || 1);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== catalogSearchQuery) {
        setCatalogSearchQuery(searchInput);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, catalogSearchQuery, setCatalogSearchQuery]);

  const mapToUnified = (movie: AfricanMovie): UnifiedMedia => ({
    id: movie.id,
    title: movie.title,
    overview: movie.description,
    posterPath: movie.thumbnailUrl,
    backdropPath: movie.backdropUrl || movie.thumbnailUrl,
    voteAverage: 8.6,
    releaseDate: String(movie.releaseYear || 2026),
    mediaType: "african",
    durationFormatted: movie.durationFormatted || "Feature",
    youtubeKey: movie.youtubeVideoId,
    genres: [movie.countryName || "African Cinema", movie.genre || "Drama"],
  });

  const sortOptions = [
    { value: "views" as const, label: "Most Viewed", icon: TrendingUp },
    { value: "latest" as const, label: "Newly Uploaded", icon: Sparkles },
    { value: "title" as const, label: "A - Z", icon: SlidersHorizontal },
  ];

  const hasActiveFilters = Boolean(
    searchInput || selectedCountry || selectedGenre || selectedChannel || selectedSort !== "views"
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startRecord = (currentPage - 1) * 24 + 1;
  const endRecord = Math.min(currentPage * 24, totalCount);

  return (
    <div className="pt-24 pb-24 px-8 md:px-14 min-h-screen text-white select-none">
      {/* Top Breadcrumb & Switcher */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setActiveTab("african")}
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to African Cinema Spotlight</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-zinc-500 font-medium">Viewing Mode:</span>
          <span className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-xs font-bold">
            Full Archive (8,470+ Titles)
          </span>
        </div>
      </div>

      {/* Page Title & Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Globe className="w-4 h-4" />
            <span>Full Production Catalogue</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
            {selectedChannel ? `${selectedChannel} Library` : "African Cinema Catalogue"}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Stream full-length releases from Africa's top production studios with official YouTube embedded playback.
          </p>
        </div>

        {/* Total Feature Films Badge */}
        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 rounded-lg border border-red-600/40 bg-red-950/30 text-red-400 font-bold text-xs tracking-wide shadow-md">
            {totalCount > 0 ? totalCount.toLocaleString() : "8,470+"} Total Feature Films
          </span>
        </div>
      </div>

      {/* Filter and Search Box (Matching flexnitweb AfricanCatalog.tsx) */}
      <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-4 md:p-6 mb-8 space-y-4 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Search by title, actor, channel..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full h-11 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 pr-10 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-red-600 transition-colors"
            />
            {searchInput ? (
              <button
                onClick={() => {
                  setSearchInput("");
                  setCatalogSearchQuery("");
                }}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="w-4 h-4 absolute right-3 top-3.5 text-zinc-500 pointer-events-none" />
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-semibold text-zinc-400 shrink-0">Sort:</span>
            {sortOptions.map((s) => {
              const Icon = s.icon;
              const isActive = selectedSort === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-750"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-dashed border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Selected Channel Active Badge */}
        {selectedChannel && (
          <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
            <span className="text-xs text-zinc-400">Filtering Studio Channel:</span>
            <div className="bg-red-600/20 text-red-400 border border-red-600/30 flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold">
              <Tv className="w-3.5 h-3.5" />
              <span>{selectedChannel}</span>
              <button
                onClick={() => setChannel("")}
                className="hover:text-white ml-1 cursor-pointer"
                title="Clear channel filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Multi-Filter Pills Row */}
        <div className="space-y-3 pt-3 border-t border-zinc-800">
          {/* Countries Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-semibold text-zinc-400 shrink-0 mr-1 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>Country:</span>
            </span>

            {/* All Countries chip */}
            <button
              onClick={() => setCountry("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCountry === ""
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-750"
              }`}
            >
              All Countries
            </button>

            {availableCountries.map((c) => {
              const isActive = selectedCountry === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                      : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-750"
                  }`}
                >
                  <span>{c.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-black/30 text-white" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {c.count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Genres Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-semibold text-zinc-400 shrink-0 mr-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span>Genre:</span>
            </span>

            {/* All Genres chip */}
            <button
              onClick={() => setGenre("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedGenre === ""
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-md"
                  : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-750"
              }`}
            >
              All Genres
            </button>

            {availableGenres.map((g) => {
              const isActive = selectedGenre === g.name;
              return (
                <button
                  key={g.name}
                  onClick={() => setGenre(g.name)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 text-zinc-950 font-semibold shadow-md"
                      : "bg-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-750"
                  }`}
                >
                  <span>{g.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-zinc-300 text-zinc-900" : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {g.count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Metadata Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-3 mb-6">
        <span>
          Showing {totalCount > 0 ? `${startRecord} - ${endRecord}` : 0} of{" "}
          {totalCount.toLocaleString()} African feature films
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Catalog 16:9 Widescreen Grid */}
      {isLoadingCatalog ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 py-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-video bg-zinc-900 rounded-xl animate-pulse border border-zinc-800"
            />
          ))}
        </div>
      ) : catalogMovies.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {catalogMovies.map((movie) => (
              <MovieCard key={movie.id} media={mapToUnified(movie)} className="w-full" />
            ))}
          </div>

          {/* Numbered Pagination Bar (Matching flexnitweb AfricanCatalog.tsx) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-8 pb-12">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = idx + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                  else pageNum = currentPage - 2 + idx;

                  if (pageNum < 1 || pageNum > totalPages) return null;

                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                          : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="min-h-[35vh] flex flex-col items-center justify-center text-center p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800/80 my-6">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
            <Film className="w-7 h-7 text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No African Movies Found</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            We couldn't find any African cinema matching your current filters. Try searching for a different keyword or resetting your country and genre filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-lg transition-transform hover:scale-105 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
