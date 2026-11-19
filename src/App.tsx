import React, { useEffect } from "react";
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
import { Footer } from "./components/layout/Footer";
import { useMovieStore } from "./stores/useMovieStore";
import { useAfricanStore } from "./stores/useAfricanStore";
import { useHistoryStore } from "./stores/useHistoryStore";
import { useUIStore } from "./stores/useUIStore";
import { UnifiedMedia, Movie, TvSeries } from "./types/movie";

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
  const { activeTab, searchQuery } = useUIStore();

  useEffect(() => {
    fetchHomeData();
    fetchAfricanFeed();
  }, [fetchHomeData, fetchAfricanFeed]);

  const continueWatchingItems = history.map((h) => h.media);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Custom Title Bar for frameless desktop window */}
      <TitleBar />

      {/* Netflix Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {searchQuery.trim() ? (
          <SearchOverlay />
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
                Binge-worthy series, dramas, and comedy hits
              </p>
            </div>
            <ContentRail
              title="Popular TV Shows"
              items={popularTv.map(mapTvToUnified)}
            />
            <ContentRail
              title="Critically Acclaimed Series"
              items={topRatedTv.map(mapTvToUnified)}
            />
            {feed?.nollywood && (
              <ContentRail
                title="African Drama Series"
                items={feed.nollywood.map((m) => ({
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
                Hollywood hits, international features, and timeless classics
              </p>
            </div>
            <ContentRail
              title="Top 10 Movies Today"
              items={trending.map(mapMovieToUnified)}
              isTop10
            />
            <ContentRail
              title="Popular Movies"
              items={popularMovies.map(mapMovieToUnified)}
            />
            <ContentRail
              title="Top Rated Movies"
              items={topRatedMovies.map(mapMovieToUnified)}
            />
            <ContentRail
              title="Upcoming Releases"
              items={upcomingMovies.map(mapMovieToUnified)}
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
              items={trending.map(mapMovieToUnified)}
              isTop10
            />
            <ContentRail
              title="New On Flexnit"
              items={upcomingMovies.map(mapMovieToUnified)}
            />
            {feed?.trending && (
              <ContentRail
                title="Trending in African Cinema"
                items={feed.trending.map((m) => ({
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
            {/* Cinematic Hero Banner */}
            <HeroBanner movie={heroMedia} />

            {/* Rails Stack */}
            <div className="-mt-14 sm:-mt-16 md:-mt-18 relative z-30 space-y-6">
              {/* Continue Watching (if any) */}
              {continueWatchingItems.length > 0 && (
                <ContentRail
                  title="Continue Watching"
                  items={continueWatchingItems}
                />
              )}

              {/* Top 10 in Movies Today (Numbered Cards) */}
              <ContentRail
                title="Top 10 in Movies Today"
                items={trending.slice(0, 10).map(mapMovieToUnified)}
                isTop10
              />

              {/* Popular Movies */}
              <ContentRail
                title="Popular on Flexnit"
                items={popularMovies.map(mapMovieToUnified)}
              />

              {/* African Cinema Feature Rail */}
              {feed?.trending && feed.trending.length > 0 && (
                <ContentRail
                  title="African Cinema Spotlight (Nollywood & Beyond)"
                  items={feed.trending.map((m) => ({
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
                />
              )}

              {/* TV Dramas & Shows */}
              <ContentRail
                title="TV Shows & Binge-Worthy Series"
                items={popularTv.map(mapTvToUnified)}
              />

              {/* Top Rated Masterpieces */}
              <ContentRail
                title="Critically Acclaimed & Top Rated"
                items={topRatedMovies.map(mapMovieToUnified)}
              />

              {/* Upcoming Releases */}
              <ContentRail
                title="Worth the Wait (Upcoming)"
                items={upcomingMovies.map(mapMovieToUnified)}
              />

              {/* Nollywood Premieres */}
              {feed?.nollywood && feed.nollywood.length > 0 && (
                <ContentRail
                  title="🇳🇬 Nollywood Premieres"
                  items={feed.nollywood.map((m) => ({
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
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Netflix Footer */}
      <Footer />

      {/* Expanded Movie/TV Detail Modal */}
      <DetailModal />

      {/* In-App Fullscreen Video Player */}
      <VideoPlayerModal />
    </div>
  );
};

export default App;
