import React, { useEffect, useState } from "react";
import {
  X,
  Play,
  Plus,
  Check,
  Download,
  ThumbsUp,
  Clock,
  Calendar,
  Star,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { UnifiedMedia, CastMember, Season, Episode } from "../../types/movie";
import { tmdbService, getBackdropUrl, getPosterUrl } from "../../services/tmdb";
import { useUIStore } from "../../stores/useUIStore";
import { useMyListStore } from "../../stores/useMyListStore";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useHistoryStore } from "../../stores/useHistoryStore";

export const DetailModal: React.FC = () => {
  const { selectedMedia, closeDetailModal, openPlayer } = useUIStore();
  const { isInList, toggleItem } = useMyListStore();
  const {
    downloads,
    addDownload,
    downloadSeason,
    cancelSeasonDownloads,
    retryDownload,
  } = useDownloadStore();

  const [cast, setCast] = useState<CastMember[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [similar, setSimilar] = useState<UnifiedMedia[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (!selectedMedia) return;
    let isMounted = true;

    // Load full details depending on mediaType
    if (selectedMedia.mediaType === "movie") {
      tmdbService.getMovieDetails(selectedMedia.id).then((res) => {
        if (!isMounted) return;
        setCast(res.credits);
        const trailer = res.videos.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailer) setTrailerKey(trailer.key);
        setSimilar(
          res.similar.map((m) => ({
            id: m.id,
            title: m.title,
            overview: m.overview,
            posterPath: m.poster_path,
            backdropPath: m.backdrop_path,
            voteAverage: m.vote_average,
            releaseDate: m.release_date || "",
            mediaType: "movie",
          }))
        );
      });
    } else if (selectedMedia.mediaType === "series") {
      tmdbService.getTvDetails(selectedMedia.id).then((res) => {
        if (!isMounted) return;
        setCast(res.credits);
        setSeasons(res.seasons);
        const trailer = res.videos.find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        );
        if (trailer) setTrailerKey(trailer.key);
        setSimilar(
          res.similar.map((s) => ({
            id: s.id,
            title: s.name,
            overview: s.overview,
            posterPath: s.poster_path,
            backdropPath: s.backdrop_path,
            voteAverage: s.vote_average,
            releaseDate: s.first_air_date || "",
            mediaType: "series",
          }))
        );
      });
    } else if (selectedMedia.mediaType === "african") {
      setTrailerKey(selectedMedia.youtubeKey || null);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedMedia]);

  // Load episodes when season changes
  useEffect(() => {
    if (selectedMedia?.mediaType !== "series" || !selectedMedia?.id) return;
    let isMounted = true;
    setIsLoadingEpisodes(true);
    tmdbService
      .getSeasonDetails(selectedMedia.id, selectedSeason)
      .then((s) => {
        if (!isMounted) return;
        setEpisodes(s.episodes || []);
        setIsLoadingEpisodes(false);
      })
      .catch(() => {
        if (isMounted) setIsLoadingEpisodes(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedMedia, selectedSeason]);

  if (!selectedMedia) return null;

  const isSaved = isInList(selectedMedia.id);
  const backdrop =
    getBackdropUrl(selectedMedia.backdropPath) ||
    getPosterUrl(selectedMedia.posterPath) ||
    "";
  const matchScore = Math.min(
    99,
    Math.max(65, Math.round(selectedMedia.voteAverage * 10))
  );

  const { getHistoryItem } = useHistoryStore();
  const historyItem = selectedMedia ? getHistoryItem(selectedMedia.id) : undefined;
  const hasResumeProgress = Boolean(
    historyItem &&
    historyItem.currentTime &&
    historyItem.currentTime > 5 &&
    (!historyItem.duration || historyItem.currentTime / historyItem.duration < 0.95)
  );

  const handlePlay = (season = 1, episode = 1, startTime?: number) => {
    if (!selectedMedia) return;
    openPlayer({ media: selectedMedia, season, episode, startTime });
  };

  const handleDownload = (season?: number, episode?: number, epTitle?: string) => {
    if (!selectedMedia) return;

    addDownload(
      selectedMedia.id,
      selectedMedia.mediaType,
      selectedMedia.title,
      selectedMedia.posterPath,
      selectedMedia.backdropPath,
      season,
      episode,
      epTitle,
      selectedMedia.youtubeKey
    );
  };

  const getEpisodeDownloadItem = (seasonNum: number, epNum: number) => {
    if (!selectedMedia) return undefined;
    return downloads.find(
      (d) =>
        d.mediaId === selectedMedia.id &&
        d.season === seasonNum &&
        d.episode === epNum
    );
  };

  const seasonEpisodesDownloaded = episodes.filter((ep) => {
    const item = getEpisodeDownloadItem(selectedSeason, ep.episode_number);
    return item?.status === "completed";
  }).length;

  const seasonEpisodesInProgress = episodes.filter((ep) => {
    const item = getEpisodeDownloadItem(selectedSeason, ep.episode_number);
    return item?.status === "downloading" || item?.status === "queued";
  }).length;

  const isSeasonFullyDownloaded =
    episodes.length > 0 && seasonEpisodesDownloaded === episodes.length;

  const isSeasonDownloading = seasonEpisodesInProgress > 0;

  const handleDownloadSeason = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMedia || episodes.length === 0) return;
    downloadSeason(
      selectedMedia.id,
      selectedMedia.mediaType === "african" ? "african" : "series",
      selectedMedia.title,
      selectedMedia.posterPath,
      selectedMedia.backdropPath,
      selectedSeason,
      episodes.map((ep) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        name: ep.name,
        season_number: ep.season_number,
      }))
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm px-4 py-10 md:py-16 flex justify-center items-start"
      onClick={closeDetailModal}
    >
      <div
        className="relative w-full max-w-4xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl shadow-black border border-zinc-700/80 mb-16 text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeDetailModal}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media Hero Banner */}
        <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden">
          {trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0`}
              title="Media Trailer"
              className="w-full h-full object-cover"
              allow="autoplay; encrypted-media; fullscreen"
            />
          ) : backdrop ? (
            <img
              src={backdrop}
              alt={selectedMedia.title}
              className="w-full h-full object-cover"
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent pointer-events-none" />

          {/* Quick Controls overlay */}
          <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (hasResumeProgress && historyItem) {
                    handlePlay(
                      historyItem.season ?? selectedSeason,
                      historyItem.episode ?? 1,
                      historyItem.currentTime
                    );
                  } else {
                    handlePlay(selectedSeason, 1);
                  }
                }}
                className="flex items-center space-x-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-sm rounded shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>
                  {hasResumeProgress
                    ? selectedMedia.mediaType === "series"
                      ? `Resume S${historyItem?.season ?? selectedSeason}:E${historyItem?.episode ?? 1}`
                      : "Resume"
                    : "Play"}
                </span>
              </button>

              <button
                onClick={() => toggleItem(selectedMedia)}
                className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                title={isSaved ? "Remove from My List" : "Add to My List"}
              >
                {isSaved ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => handleDownload()}
                className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                className="w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-600 text-white flex items-center justify-center transition-colors"
                title="Rate"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Title, Synopsis, Metadata */}
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {selectedMedia.title}
              </h2>

              <div className="flex items-center space-x-3 text-xs text-zinc-300">
                <span className="text-green-400 font-bold flex items-center">
                  <Star className="w-3.5 h-3.5 fill-green-400 mr-1" />
                  {matchScore}% Match
                </span>
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-zinc-500" />
                  {selectedMedia.releaseDate.slice(0, 4)}
                </span>
                <span className="px-1.5 py-0.5 border border-zinc-600 text-[10px] text-zinc-400 rounded">
                  16+
                </span>
                <span className="px-1.5 py-0.5 border border-zinc-600 text-[10px] text-zinc-400 rounded">
                  Ultra HD 4K
                </span>
                {selectedMedia.durationFormatted && (
                  <span className="flex items-center text-zinc-400">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {selectedMedia.durationFormatted}
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {selectedMedia.overview || "No synopsis available."}
              </p>
            </div>

            {/* Right Col: Cast & Tags */}
            <div className="space-y-3 text-xs text-zinc-400 border-l border-zinc-800 pl-4">
              {cast.length > 0 && (
                <div>
                  <span className="text-zinc-500 block mb-1 font-semibold">
                    Cast:
                  </span>
                  <p className="text-zinc-300 line-clamp-3">
                    {cast.map((c) => c.name).join(", ")}
                  </p>
                </div>
              )}

              {selectedMedia.genres && selectedMedia.genres.length > 0 && (
                <div>
                  <span className="text-zinc-500 block mb-1 font-semibold">
                    Genres:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedMedia.genres.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TV Shows: Seasons & Episodes Rails */}
          {selectedMedia.mediaType === "series" && seasons.length > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">Episodes</h3>
                  {episodes.length > 0 && (
                    <span className="text-xs text-zinc-400">
                      ({episodes.length} Total)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Download Season Button */}
                  {episodes.length > 0 && (
                    isSeasonFullyDownloaded ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-950/60 border border-green-800/80 text-green-400 text-xs font-semibold rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Season {selectedSeason} Downloaded</span>
                      </div>
                    ) : isSeasonDownloading ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-semibold rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                          <span>
                            Season {selectedSeason} ({seasonEpisodesDownloaded + seasonEpisodesInProgress}/{episodes.length})
                          </span>
                        </div>
                        <button
                          onClick={() => cancelSeasonDownloads(selectedMedia.id, selectedSeason)}
                          className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                          title="Cancel season download queue"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleDownloadSeason}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                        title={`Download all episodes of Season ${selectedSeason} in succession`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Season {selectedSeason}</span>
                      </button>
                    )
                  )}

                  {/* Season Dropdown */}
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs px-3 py-1.5 rounded outline-none cursor-pointer"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`} ({s.episode_count} eps)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isLoadingEpisodes ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
                  Loading episodes...
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        const isThisEp =
                          historyItem &&
                          historyItem.season === ep.season_number &&
                          historyItem.episode === ep.episode_number;
                        handlePlay(
                          ep.season_number,
                          ep.episode_number,
                          isThisEp ? historyItem.currentTime : undefined
                        );
                      }}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/90 border border-zinc-800/80 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-base font-bold text-zinc-400 w-6 text-center">
                          {ep.episode_number}
                        </span>

                        <div className="relative w-28 aspect-video rounded overflow-hidden bg-zinc-800 shrink-0">
                          {ep.still_path ? (
                            <img
                              src={getBackdropUrl(ep.still_path) || ""}
                              alt={ep.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                              No Preview
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-6 h-6 fill-white text-white" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">
                            {ep.name}
                          </h4>
                          <p className="text-xs text-zinc-400 line-clamp-2 max-w-lg">
                            {ep.overview || "No episode description."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 ml-4">
                        {ep.runtime && (
                          <span className="text-xs text-zinc-400">
                            {ep.runtime}m
                          </span>
                        )}

                        {(() => {
                          const epItem = getEpisodeDownloadItem(ep.season_number, ep.episode_number);
                          if (epItem?.status === "completed") {
                            return (
                              <div
                                className="flex items-center space-x-1 px-2.5 py-1 bg-green-950/60 border border-green-800/80 rounded-md text-green-400 text-xs font-medium"
                                title="Downloaded (Ready Offline)"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Downloaded</span>
                              </div>
                            );
                          }
                          if (epItem?.status === "downloading") {
                            return (
                              <div
                                className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-950/60 border border-red-800/80 rounded-md text-red-400 text-xs font-bold"
                                title={`Downloading: ${epItem.progress}%`}
                              >
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                                <span>{epItem.progress}%</span>
                              </div>
                            );
                          }
                          if (epItem?.status === "queued") {
                            return (
                              <div
                                className="flex items-center space-x-1 px-2.5 py-1 bg-amber-950/40 border border-amber-800/60 rounded-md text-amber-400 text-xs font-medium"
                                title="Queued (Will download in succession)"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Queued</span>
                              </div>
                            );
                          }
                          if (epItem?.status === "failed") {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  retryDownload(epItem.id);
                                }}
                                className="p-1.5 rounded-full hover:bg-zinc-700 text-amber-400 hover:text-white transition-colors cursor-pointer"
                                title="Retry episode download"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            );
                          }
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(
                                  ep.season_number,
                                  ep.episode_number,
                                  ep.name
                                );
                              }}
                              className="p-2 rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                              title="Download episode"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* More Like This */}
          {similar.length > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h3 className="text-lg font-bold text-white">More Like This</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {similar.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Switch detail modal to this item
                      useUIStore.getState().openDetailModal(item);
                    }}
                    className="relative aspect-video rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 cursor-pointer group hover:scale-105 transition-transform"
                  >
                    <img
                      src={
                        getBackdropUrl(item.backdropPath) ||
                        getPosterUrl(item.posterPath) ||
                        ""
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-2">
                      <span className="text-xs font-bold text-white truncate drop-shadow">
                        {item.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
