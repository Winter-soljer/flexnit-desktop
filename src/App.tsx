import React, { useEffect, useState } from "react";
import { SplashScreen } from "./components/common/SplashScreen";
import { TitleBar } from "./components/layout/TitleBar";
import { Navbar } from "./components/layout/Navbar";
import { HeroBanner } from "./components/home/HeroBanner";
import { ContentRail } from "./components/home/ContentRail";
import { AfricanSection } from "./components/african/AfricanSection";
import { AfricanCatalogView } from "./components/african/AfricanCatalogView";
import { SearchOverlay } from "./components/search/SearchOverlay";
import { MyListView } from "./components/mylist/MyListView";
import { DownloadsView } from "./components/downloads/DownloadsView";
import { DetailModal } from "./components/modals/DetailModal";
import { VideoPlayerModal } from "./components/modals/VideoPlayerModal";
import { NotificationsView } from "./components/notifications/NotificationsView";
import { UserProfileView } from "./components/profile/UserProfileView";
import { useMovieStore } from "./stores/useMovieStore";
import { useAfricanStore } from "./stores/useAfricanStore";
import { useHistoryStore } from "./stores/useHistoryStore";
import { useUIStore } from "./stores/useUIStore";
import { useProfileStore } from "./stores/useProfileStore";
import { UnifiedMedia, Movie, TvSeries } from "./types/movie";

const MATURE_GENRE_IDS = new Set([27, 80, 53, 10752]); // Horror, Crime, Thriller, War
const MATURE_REGEX = /\b(horror|erotic|sex|bloody|massacre|murder|cartel|gangster|kill|gore|explicit|prostitut|violence)\b/i;

const isKidsSafeMovie = (m: Movie): boolean => {
  if (m.genre_ids?.some((g) => MATURE_GENRE_IDS.has(g))) return false;
  if (MATURE_REGEX.test(m.title) || MATURE_REGEX.test(m.overview || "")) return false;
  return true;
};

const isKidsSafeTv = (s: TvSeries): boolean => {
  if (s.genre_ids?.some((g) => MATURE_GENRE_IDS.has(g))) return false;
  if (MATURE_REGEX.test(s.name) || MATURE_REGEX.test(s.overview || "")) return false;
  return true;
};

const isKidsSafeAfrican = (item: { title: string; description?: string }): boolean => {
  if (MATURE_REGEX.test(item.title) || MATURE_REGEX.test(item.description || "")) return false;
  return true;
};

const mapMovieToUnified = (m: Movie): UnifiedMedia => ({
  id: m.id,
  title: m.title,
  overview: m.overview,
  posterPath: m.poster_path,
  backdropPath: m.backdrop_path,
  voteAverage: m.vote_average,
  releaseDate: m.release_date || "",
  mediaType: "movie",
});

const mapTvToUnified = (s: TvSeries): UnifiedMedia => ({
  id: s.id,
  title: s.name,
  overview: s.overview,
  posterPath: s.poster_path,
  backdropPath: s.backdrop_path,
  voteAverage: s.vote_average,
  releaseDate: s.first_air_date || "",
  mediaType: "series",
});

export const App: React.FC = () => {
  const {
    trending,
    popularMovies,
    topRatedMovies,
    upcomingMovies,
    popularTv,
    topRatedTv,
    heroMedia,
    fetchHomeData,
  } = useMovieStore();

  const { feed, fetchAfricanFeed } = useAfricanStore();
  const { history } = useHistoryStore();
  const { activeTab, searchQuery, setActiveTab } = useUIStore();
  const { profiles, activeProfileId } = useProfileStore();
  const [showSplash, setShowSplash] = useState(true);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) || profiles[0];
  const isKids = activeProfile.isKids;

  useEffect(() => {
    fetchHomeData();
    fetchAfricanFeed();
  }, [fetchHomeData, fetchAfricanFeed]);

  const continueWatchingItems = history.map((h) => h.media);

  // Content Filtering for Kids Profile
  const displayMovies = isKids ? popularMovies.filter(isKidsSafeMovie) : popularMovies;
  const displayTrending = isKids ? trending.filter(isKidsSafeMovie) : trending;
  const displayTopRatedMovies = isKids ? topRatedMovies.filter(isKidsSafeMovie) : topRatedMovies;
  const displayUpcoming = isKids ? upcomingMovies.filter(isKidsSafeMovie) : upcomingMovies;
  const displayPopularTv = isKids ? popularTv.filter(isKidsSafeTv) : popularTv;
  const displayTopRatedTv = isKids ? topRatedTv.filter(isKidsSafeTv) : topRatedTv;

  const displayHero = isKids
    ? (heroMedia && isKidsSafeMovie(heroMedia) ? heroMedia : displayTrending[0] || heroMedia)
    : heroMedia;

  const displayNollywood = feed?.nollywood
    ? (isKids ? feed.nollywood.filter(isKidsSafeAfrican) : feed.nollywood)
    : [];

  const displayAfricanTrending = feed?.trending
    ? (isKids ? feed.trending.filter(isKidsSafeAfrican) : feed.trending)
    : [];

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Cinematic Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Custom Title Bar for frameless desktop window */}
      <TitleBar />

      {/* Netflix Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {searchQuery.trim() ? (
          <SearchOverlay />
        ) : activeTab === "notifications" ? (
          <NotificationsView />
        ) : activeTab === "profile" ? (
          <UserProfileView />
        ) : activeTab === "african" ? (
          <AfricanSection />
        ) : activeTab === "african_catalog" ? (
          <AfricanCatalogView />
        ) : activeTab === "mylist" ? (
          <MyListView />
        ) : activeTab === "downloads" ? (
          <DownloadsView />
        ) : activeTab === "series" ? (
          <div className="pt-20 pb-16 space-y-4">
            <div className="px-8 md:px-14 mb-4">
              <h1 className="text-3xl font-black tracking-wide">TV Series & Shows</h1>
              <p className="text-xs text-zinc-400 mt-1">
                {isKids ? "Kid-friendly series, cartoons, and family comedies" : "Binge-worthy series, dramas, and comedy hits"}
              </p>
            </div>
            {isKids && (
              <div className="px-8 md:px-14 mb-4">
                <div className="bg-amber-600/20 border border-amber-500/40 rounded-lg px-4 py-2 text-xs font-semibold text-amber-200">
                  Kids Safe Profile active • Mature and adult-rated series are hidden.
                </div>
              </div>
            )}
            <ContentRail
              title="Popular TV Shows"
              items={displayPopularTv.map(mapTvToUnified)}
            />
            <ContentRail
              title="Critically Acclaimed Series"
              items={displayTopRatedTv.map(mapTvToUnified)}
            />
            {displayNollywood.length > 0 && (
              <ContentRail
                title="African Drama Series"
                items={displayNollywood.map((m) => ({
                  id: m.id,
                  title: m.title,
                  overview: m.description,
                  posterPath: m.thumbnailUrl,
                  backdropPath: m.backdropUrl || m.thumbnailUrl || null,
                  voteAverage: 8.5,
                  releaseDate: String(m.releaseYear || 2024),
                  mediaType: "african",
                  youtubeKey: m.youtubeVideoId,
                }))}
              />
            )}
          </div>
        ) : activeTab === "films" ? (
          <div className="pt-20 pb-16 space-y-4">
            <div className="px-8 md:px-14 mb-4">
              <h1 className="text-3xl font-black tracking-wide">Movies & Blockbusters</h1>
              <p className="text-xs text-zinc-400 mt-1">
                {isKids ? "Family features, animation, and uplifting adventures" : "Hollywood hits, international features, and timeless classics"}
              </p>
            </div>
            {isKids && (
              <div className="px-8 md:px-14 mb-4">
                <div className="bg-amber-600/20 border border-amber-500/40 rounded-lg px-4 py-2 text-xs font-semibold text-amber-200">
                  Kids Safe Profile active • Mature movies (Horror, Crime, Thriller) are hidden.
                </div>
              </div>
            )}
            <ContentRail
              title="Top 10 Movies Today"
              items={displayTrending.map(mapMovieToUnified)}
              isTop10
            />
            <ContentRail
              title="Popular Movies"
              items={displayMovies.map(mapMovieToUnified)}
            />
            <ContentRail
              title="Top Rated Movies"
              items={displayTopRatedMovies.map(mapMovieToUnified)}
            />
            <ContentRail
              title="Upcoming Releases"
              items={displayUpcoming.map(mapMovieToUnified)}
            />
          </div>
        ) : activeTab === "popular" ? (
          <div className="pt-20 pb-16 space-y-4">
            <div className="px-8 md:px-14 mb-4">
              <h1 className="text-3xl font-black tracking-wide">New & Popular</h1>
              <p className="text-xs text-zinc-400 mt-1">
                What's trending now across movies, series, and African blockbusters
              </p>
            </div>
            <ContentRail
              title="Top 10 on Flexnit"
              items={displayTrending.map(mapMovieToUnified)}
              isTop10
            />
            <ContentRail
              title="New On Flexnit"
              items={displayUpcoming.map(mapMovieToUnified)}
            />
            {displayAfricanTrending.length > 0 && (
              <ContentRail
                title="Trending in African Cinema"
                items={displayAfricanTrending.map((m) => ({
                  id: m.id,
                  title: m.title,
                  overview: m.description,
                  posterPath: m.thumbnailUrl,
                  backdropPath: m.backdropUrl || m.thumbnailUrl || null,
                  voteAverage: 8.7,
                  releaseDate: String(m.releaseYear || 2024),
                  mediaType: "african",
                  youtubeKey: m.youtubeVideoId,
                }))}
              />
            )}
          </div>
        ) : (
          /* "home" Tab (Default) */
          <div>
            {/* Kids Mode Banner Indicator */}
            {isKids && (
              <div className="pt-20 px-8 md:px-14 pb-1">
                <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 border border-amber-500/40 rounded-xl px-5 py-3 text-xs font-bold text-white flex items-center justify-between shadow-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-black/40 rounded text-[10px] font-black uppercase tracking-wider">
                      Kids Safe Profile
                    </span>
                    <span>Family & child-safe content filter is active</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="underline text-amber-100 hover:text-white cursor-pointer"
                  >
                    Change Profile
                  </button>
                </div>
              </div>
            )}

            {/* Cinematic Hero Banner */}
            <HeroBanner movie={displayHero} />

            {/* Rails Stack */}
            <div className="-mt-14 sm:-mt-16 md:-mt-18 relative z-30 space-y-6">
              {/* Continue Watching (if any) */}
              {continueWatchingItems.length > 0 && (
                <ContentRail
                  title="Continue Watching"
                  items={continueWatchingItems}
                  onExploreAll={() => setActiveTab("mylist")}
                />
              )}

              {/* Top 10 in Movies Today (Numbered Cards) */}
              <ContentRail
                title="Top 10 in Movies Today"
                items={displayTrending.slice(0, 10).map(mapMovieToUnified)}
                isTop10
                onExploreAll={() => setActiveTab("popular")}
              />

              {/* Popular Movies */}
              <ContentRail
                title="Popular on Flexnit"
                items={displayMovies.map(mapMovieToUnified)}
                onExploreAll={() => setActiveTab("films")}
              />

              {/* African Cinema Feature Rail */}
              {displayAfricanTrending.length > 0 && (
                <ContentRail
                  title="African Cinema Spotlight (Nollywood & Beyond)"
                  items={displayAfricanTrending.map((m) => ({
                    id: m.id,
                    title: m.title,
                    overview: m.description,
                    posterPath: m.thumbnailUrl,
                    backdropPath: m.backdropUrl || m.thumbnailUrl || null,
                    voteAverage: 8.8,
                    releaseDate: String(m.releaseYear || 2024),
                    mediaType: "african",
                    youtubeKey: m.youtubeVideoId,
                    durationFormatted: m.durationFormatted || null,
                  }))}
                  onExploreAll={() => setActiveTab("african")}
                />
              )}

              {/* TV Dramas & Shows */}
              <ContentRail
                title="TV Shows & Binge-Worthy Series"
                items={displayPopularTv.map(mapTvToUnified)}
                onExploreAll={() => setActiveTab("series")}
              />

              {/* Top Rated Masterpieces */}
              <ContentRail
                title="Critically Acclaimed & Top Rated"
                items={displayTopRatedMovies.map(mapMovieToUnified)}
                onExploreAll={() => setActiveTab("films")}
              />

              {/* Upcoming Releases */}
              <ContentRail
                title="Worth the Wait (Upcoming)"
                items={displayUpcoming.map(mapMovieToUnified)}
                onExploreAll={() => setActiveTab("films")}
              />

              {/* Nollywood Premieres */}
              {displayNollywood.length > 0 && (
                <ContentRail
                  title="🇳🇬 Nollywood Premieres"
                  items={displayNollywood.map((m) => ({
                    id: m.id,
                    title: m.title,
                    overview: m.description,
                    posterPath: m.thumbnailUrl,
                    backdropPath: m.backdropUrl || m.thumbnailUrl || null,
                    voteAverage: 8.5,
                    releaseDate: String(m.releaseYear || 2024),
                    mediaType: "african",
                    youtubeKey: m.youtubeVideoId,
                    durationFormatted: m.durationFormatted || null,
                  }))}
                  onExploreAll={() => setActiveTab("african_catalog")}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Expanded Movie/TV Detail Modal */}
      <DetailModal />

      {/* In-App Fullscreen Video Player */}
      <VideoPlayerModal />
    </div>
  );
};

export default App;
