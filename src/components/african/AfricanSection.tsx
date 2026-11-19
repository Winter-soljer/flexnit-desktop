import React, { useEffect } from "react";
import {
  Globe,
  Loader2,
  Film,
  ArrowRight,
} from "lucide-react";
import { useAfricanStore } from "../../stores/useAfricanStore";
import { useUIStore } from "../../stores/useUIStore";
import { AfricanChannelRail } from "../../types/african";
import { AfricanHeroSlider } from "./AfricanHeroSlider";
import { AfricanRow } from "./AfricanRow";

export const AfricanSection: React.FC = () => {
  const {
    feed,
    newReleases,
    isLoadingFeed,
    totalCount,
    availableCountries,
    fetchAfricanFeed,
    setCountry,
    setChannel,
    setSort,
  } = useAfricanStore();

  const { setActiveTab } = useUIStore();

  useEffect(() => {
    fetchAfricanFeed();
  }, [fetchAfricanFeed]);

  const navigateToCatalog = (filters?: {
    country?: string;
    channel?: string;
    sort?: "views" | "latest" | "title";
  }) => {
    if (filters?.country !== undefined) setCountry(filters.country);
    if (filters?.channel !== undefined) setChannel(filters.channel);
    if (filters?.sort !== undefined) setSort(filters.sort);
    setActiveTab("african_catalog");
  };

  if (isLoadingFeed && !feed) {
    return (
      <div className="pt-24 px-8 md:px-14 min-h-screen text-zinc-400">
        <div className="h-96 rounded-xl bg-zinc-900 animate-pulse flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          <span className="text-sm font-semibold">Connecting to African Cinema Spotlight...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 select-none">
      {/* 2026 New Releases Hero Slider */}
      {newReleases.length > 0 && <AfricanHeroSlider movies={newReleases} />}

      {/* Country Hub Bar & Full Catalogue Entry Point */}
      <div className="relative z-20 -mt-2 sm:-mt-3 px-8 md:px-14">
        <div className="bg-[#181818]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Quick Country Hub Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full lg:w-auto no-scrollbar py-1">
            <span className="text-xs font-semibold text-zinc-400 shrink-0 mr-1 flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>Regional Hubs:</span>
            </span>

            {availableCountries.map((c) => (
              <button
                key={c.code}
                onClick={() => navigateToCatalog({ country: c.code })}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-850 hover:bg-zinc-750 text-zinc-300 hover:text-white transition-all shrink-0 border border-zinc-750 cursor-pointer"
              >
                <span>{c.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400">
                  {c.count.toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {/* Full Production Catalogue Dedicated Page Button */}
          <button
            onClick={() => navigateToCatalog()}
            className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 cursor-pointer"
          >
            <Film className="w-4 h-4" />
            <span>Open Full Catalogue ({totalCount > 0 ? totalCount.toLocaleString() : "8,470+"} Films)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Curated Rails Section */}
      {feed && (
        <div className="space-y-2 mt-4">
          {/* Trending Across Africa */}
          {feed.trending && feed.trending.length > 0 && (
            <AfricanRow
              title="Trending Across Africa"
              subtitle="Top Streamed Movies Right Now"
              badgeText="Trending"
              movies={feed.trending}
              onViewAll={() => navigateToCatalog({ sort: "views" })}
            />
          )}

          {/* Newly Uploaded by Studios (2026 Releases) */}
          {feed.latestUploads && feed.latestUploads.length > 0 && (
            <AfricanRow
              title="Newly Uploaded by Studios (2026 Premieres)"
              subtitle="Fresh 2026 Productions"
              badgeText="New Releases"
              movies={feed.latestUploads}
              onViewAll={() => navigateToCatalog({ sort: "latest" })}
            />
          )}

          {/* Studio Channel Directory Rails (from flexnitweb feed.channelRails) */}
          {feed.channelRails &&
            feed.channelRails.slice(0, 8).map((rail: AfricanChannelRail) => (
              <AfricanRow
                key={rail.channelId || rail.channelTitle}
                title={rail.channelTitle}
                subtitle={`Studio Channel • ${rail.countryName || rail.countryCode || "Official Creator"}`}
                badgeText={`${rail.movieCount} films`}
                movies={rail.movies}
                onViewAll={() => navigateToCatalog({ channel: rail.channelTitle })}
              />
            ))}

          {/* Nollywood Blockbusters */}
          {feed.nollywood && feed.nollywood.length > 0 && (
            <AfricanRow
              title="Nollywood Blockbusters (Nigeria)"
              subtitle="Lagos to the World"
              badgeText="6,410+ Films"
              movies={feed.nollywood}
              onViewAll={() => navigateToCatalog({ country: "NG" })}
            />
          )}

          {/* Ghallywood Stories */}
          {feed.ghallywood && feed.ghallywood.length > 0 && (
            <AfricanRow
              title="Ghallywood Stories (Ghana)"
              subtitle="Acclaimed Cinema from Ghana"
              badgeText="1,080+ Films"
              movies={feed.ghallywood}
              onViewAll={() => navigateToCatalog({ country: "GH" })}
            />
          )}

          {/* Mzansi Cinema */}
          {feed.mzansi && feed.mzansi.length > 0 && (
            <AfricanRow
              title="Mzansi Cinema (South Africa)"
              subtitle="South African Features & Drama"
              badgeText="220+ Films"
              movies={feed.mzansi}
              onViewAll={() => navigateToCatalog({ country: "ZA" })}
            />
          )}

          {/* East African Cinema */}
          {feed.eastAfrica && feed.eastAfrica.length > 0 && (
            <AfricanRow
              title="East African Cinema (Bongo & Swahili)"
              subtitle="Swahili & Regional Hits"
              badgeText="620+ Films"
              movies={feed.eastAfrica}
              onViewAll={() => navigateToCatalog({ country: "TZ" })}
            />
          )}
        </div>
      )}

      {/* Cinematic Full Catalogue Callout Billboard Card */}
      <div className="mt-14 px-8 md:px-14">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-red-950/80 via-zinc-900 to-black p-8 md:p-12 border border-red-900/40 shadow-2xl">
          <div className="max-w-xl space-y-3 relative z-10">
            <span className="px-2.5 py-0.5 bg-red-600 text-white font-extrabold text-[11px] rounded tracking-wider uppercase inline-block">
              COMPLETE ARCHIVE
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Explore Africa's Largest Cinema Archive
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Browse over {totalCount > 0 ? totalCount.toLocaleString() : "8,470+"} full-length feature films across Nigeria, Ghana, South Africa, Tanzania, and Kenya. Filter by studio channel, genre, or release year with multi-page navigation.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigateToCatalog()}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xl transition-transform hover:scale-105 cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Open Full Production Catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
