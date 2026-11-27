import React from "react";
import { Download, Play, Trash2, CheckCircle2, Clock, AlertCircle, RotateCcw, Loader2 } from "lucide-react";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useUIStore } from "../../stores/useUIStore";
import { getPosterUrl, getBackdropUrl } from "../../services/tmdb";
import { UnifiedMedia } from "../../types/movie";

export const DownloadsView: React.FC = () => {
  const { downloads, removeDownload, retryDownload, clearFailedDownloads } = useDownloadStore();
  const { openPlayer } = useUIStore();
  const hasFailed = downloads.some((d) => d.status === "failed");

  const handlePlayDownloaded = (item: any) => {
    const cleanTitle = item.title
      ? item.title.replace(/ - S\d+:E\d+.*$/i, "").trim()
      : "";

    const media: UnifiedMedia = {
      id: item.mediaId,
      title: cleanTitle || item.title,
      overview: item.episodeTitle || "Downloaded for offline viewing",
      posterPath: item.posterUrl,
      backdropPath: item.backdropUrl,
      voteAverage: 9.0,
      releaseDate: "",
      mediaType: item.mediaType,
      youtubeKey: item.youtubeKey,
    };

    openPlayer({
      media,
      season: item.season,
      episode: item.episode,
    });
  };

  return (
    <div className="pt-24 px-8 md:px-14 min-h-screen text-white select-none pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide flex items-center">
            <Download className="w-7 h-7 text-red-500 mr-3" />
            Downloads & Offline Storage
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Titles saved directly to your app storage via StreamLink
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasFailed && (
            <button
              onClick={clearFailedDownloads}
              className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-900/60 px-3 py-1.5 rounded-lg btn-tactile cursor-pointer flex items-center gap-1.5"
              title="Clear all failed downloads from history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Failed</span>
            </button>
          )}

          <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
            Total Downloads: <span className="font-bold text-white">{downloads.length} items</span>
          </div>
        </div>
      </div>

      {downloads.length > 0 ? (
        <div className="space-y-3">
          {(() => {
            const queuedItems = downloads
              .filter((d) => d.status === "queued")
              .sort((a, b) => a.downloadedAt - b.downloadedAt);

            return downloads.map((item) => {
              const poster = getPosterUrl(item.posterUrl) || getBackdropUrl(item.backdropUrl);
              const isDone = item.status === "completed";
              const isFailed = item.status === "failed";
              const isDownloading = item.status === "downloading";
              const isQueued = item.status === "queued";
              const queueIndex = isQueued
                ? queuedItems.findIndex((q) => q.id === item.id)
                : -1;
              const queueLabel =
                queueIndex === 0
                  ? "Next in succession"
                  : queueIndex > 0
                  ? `In Queue (#${queueIndex + 1})`
                  : undefined;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors shadow-lg"
                >
                  {/* Left side: Thumbnail & Info */}
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="relative w-20 aspect-video rounded-md overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800">
                      {poster ? (
                        <img src={poster} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-500">
                          Media
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white truncate max-w-md">
                          {item.title}
                        </h3>
                        {item.season && item.episode && (
                          <span className="shrink-0 text-[10px] bg-red-950/80 border border-red-800/80 text-red-300 font-bold px-1.5 py-0.5 rounded">
                            S{item.season}:E{item.episode}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                        <span className="capitalize">{item.mediaType}</span>
                        <span>•</span>
                        <span>{item.sizeFormatted || "1080p Full HD"}</span>
                        {item.speed && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">{item.speed}</span>
                          </>
                        )}
                        {item.eta && (
                          <>
                            <span>•</span>
                            <span className="text-zinc-400">ETA {item.eta}</span>
                          </>
                        )}
                        {isQueued && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {queueLabel || "Queued"}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="flex items-center text-zinc-400">
                          <Clock className="w-3 h-3 mr-1" />
                          StreamLink Verified
                        </span>
                      </div>

                      {/* Progress Bar if actively downloading */}
                      {isDownloading && (
                        <div className="w-48 sm:w-80 space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-zinc-400">
                            <span className="truncate mr-2 text-zinc-300">
                              {item.phase || "Downloading stream chunks..."}
                            </span>
                            <span className="font-bold text-red-500">{item.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300 shimmer-progress"
                              style={{ width: `${Math.max(3, item.progress)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Queued notification if queued */}
                      {isQueued && (
                        <div className="pt-1 flex items-center space-x-1.5 text-[11px] text-amber-400/90 font-medium">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.phase || queueLabel || "Waiting for previous episode..."}</span>
                        </div>
                      )}

                      {/* Error display if failed */}
                      {isFailed && (
                        <div className="flex items-start space-x-1.5 text-xs text-red-400 pt-0.5 max-w-lg">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={item.error}>{item.error || "Download failed. Click retry to resume."}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 ml-4">
                    {isDone && (
                      <>
                        <span className="hidden sm:flex items-center text-xs text-green-400 font-semibold mr-2">
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Ready Offline
                        </span>
                        <button
                          onClick={() => handlePlayDownloaded(item)}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-lg btn-tactile cursor-pointer shadow-md"
                        >
                          <Play className="w-3.5 h-3.5 fill-black" />
                          <span>Play</span>
                        </button>
                      </>
                    )}

                    {isDownloading && (
                      <div className="flex items-center space-x-2 text-xs text-zinc-400 mr-2">
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                        <span className="hidden sm:inline font-medium">Downloading</span>
                      </div>
                    )}

                    {isQueued && (
                      <div className="flex items-center space-x-1.5 text-xs text-amber-400/90 mr-2 bg-amber-950/30 border border-amber-900/50 px-2 py-1 rounded">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline font-medium">{queueLabel || "Queued"}</span>
                      </div>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => retryDownload(item.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg btn-tactile cursor-pointer mr-1"
                        title="Retry download"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400 mr-1" />
                        <span>Retry</span>
                      </button>
                    )}

                    <button
                      onClick={() => removeDownload(item.id)}
                      className="p-2 rounded-lg bg-zinc-800/80 hover:bg-red-600/20 text-zinc-400 hover:text-red-500 btn-tactile cursor-pointer"
                      title={isQueued ? "Remove from queue" : "Delete download"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-28 text-center text-zinc-500">
          <Download className="w-14 h-14 text-zinc-700 mb-4" />
          <p className="text-base font-semibold text-zinc-300">
            No offline downloads yet.
          </p>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm">
            Click the download button on any movie or TV episode card to save it for offline
            viewing without internet.
          </p>
        </div>
      )}
    </div>
  );
};
