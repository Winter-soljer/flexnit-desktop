import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Server,
  Download,
  Maximize2,
  SkipForward,
  FastForward,
  Play,
  X,
} from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useUIStore } from "../../stores/useUIStore";
import { streamingService, DEFAULT_STREAM_SOURCES } from "../../services/streamingConfig";
import { useDownloadStore } from "../../stores/useDownloadStore";
import { useHistoryStore } from "../../stores/useHistoryStore";
import { useProfileStore } from "../../stores/useProfileStore";
import { tmdbService } from "../../services/tmdb";
import { Season, Episode } from "../../types/movie";

export const VideoPlayerModal: React.FC = () => {
  const { activePlayer, closePlayer, openPlayer } = useUIStore();
  const { addDownload, downloads } = useDownloadStore();
  const { addToHistory } = useHistoryStore();
  const { autoplayNext } = useProfileStore();

  const [activeServerId, setActiveServerId] = useState<string>("vidlink");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeasonEpisodes, setCurrentSeasonEpisodes] = useState<Episode[]>([]);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [showSkipIntroToast, setShowSkipIntroToast] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const season = activePlayer?.season ?? 1;
  const episode = activePlayer?.episode ?? 1;
  const isSeries = activePlayer?.media?.mediaType === "series";

  // Reset countdown & local states when activePlayer changes
  useEffect(() => {
    setShowCountdown(false);
    setCountdownSeconds(null);
    setStreamStartTime(null);
  }, [activePlayer?.media?.id, activePlayer?.season, activePlayer?.episode]);

  // Record to watch history
  useEffect(() => {
    if (activePlayer && activePlayer.media) {
      addToHistory(
        activePlayer.media,
        25,
        activePlayer.season,
        activePlayer.episode
      );
    }
  }, [activePlayer?.media?.id, activePlayer?.season, activePlayer?.episode, addToHistory]);

  // Load seasons and episodes when a series is active
  useEffect(() => {
    if (!activePlayer || !activePlayer.media || activePlayer.media.mediaType !== "series") {
      setSeasons([]);
      setCurrentSeasonEpisodes([]);
      return;
    }
    let isMounted = true;

    tmdbService.getTvDetails(activePlayer.media.id).then((res) => {
      if (!isMounted) return;
      if (res.seasons) {
        setSeasons(res.seasons);
      }
    });

    const currentSeasonNum = activePlayer.season || 1;
    tmdbService
      .getSeasonDetails(activePlayer.media.id, currentSeasonNum)
      .then((seasonData) => {
        if (!isMounted) return;
        if (seasonData.episodes) {
          setCurrentSeasonEpisodes(seasonData.episodes);
        }
      })
      .catch(() => { });

    return () => {
      isMounted = false;
    };
  }, [activePlayer?.media?.id, activePlayer?.season]);

  // Calculate Next Episode & Next Season rollover
  const currentSeasonObj = seasons.find((s) => s.season_number === season);
  const totalEpisodesInSeason =
    currentSeasonObj?.episode_count || currentSeasonEpisodes.length || 0;
  const isLastEpisodeOfSeason =
    totalEpisodesInSeason > 0 && episode >= totalEpisodesInSeason;

  // Next season lookup
  const nextSeasonObj = seasons.find((s) => s.season_number > season);
  const hasNextSeason = !!nextSeasonObj;

  let nextTarget: {
    season: number;
    episode: number;
    isNewSeason: boolean;
    label: string;
  } | null = null;

  if (isSeries) {
    if (!isLastEpisodeOfSeason) {
      nextTarget = {
        season,
        episode: episode + 1,
        isNewSeason: false,
        label: `Next Ep (S${season} E${episode + 1})`,
      };
    } else if (hasNextSeason && nextSeasonObj) {
      nextTarget = {
        season: nextSeasonObj.season_number,
        episode: 1,
        isNewSeason: true,
        label: `Next Season (S${nextSeasonObj.season_number} E1)`,
      };
    }
  }

  const handleNext = () => {
    if (!nextTarget || !media) return;
    setShowCountdown(false);
    setCountdownSeconds(null);
    openPlayer({
      media,
      season: nextTarget.season,
      episode: nextTarget.episode,
      sourceId: activeServerId,
    });
  };

  const triggerAutoNext = () => {
    if (!nextTarget) return;
    setShowCountdown(true);
    setCountdownSeconds(5);
  };

  const cancelCountdown = () => {
    setShowCountdown(false);
    setCountdownSeconds(null);
  };

  // Countdown timer effect (MUST be declared before any early return)
  useEffect(() => {
    if (!showCountdown || countdownSeconds === null || !autoplayNext) return;
    if (countdownSeconds <= 0) {
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [showCountdown, countdownSeconds, nextTarget, autoplayNext]);

  // Listen for embed postMessage end events (e.g. VidLink, JWPlayer)
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data) return;

      const isEnded =
        data.type === "ENDED" ||
        data.event === "ended" ||
        (data.type === "PLAYER_EVENT" && data.data?.event === "ended") ||
        (data.type === "MEDIA_DATA" &&
          data.data?.currentTime &&
          data.data?.duration &&
          data.data.duration - data.data.currentTime < 2);

      if (isEnded && isSeries && nextTarget) {
        triggerAutoNext();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isSeries, nextTarget]);

  // ALL HOOKS ARE COMPLETE - Safe to check activePlayer now!
  if (!activePlayer || !activePlayer.media) return null;

  const media = activePlayer.media;

  // Determine streaming URL (Local completed download vs. Live stream)
  let streamUrl = "";
  let isYouTube = false;
  let isLocalVideo = false;

  const downloadItem = downloads.find(
    (d) =>
      d.status === "completed" &&
      (d.fileUrl || d.filePath) &&
      (d.id === `${media.mediaType}_${media.id}` ||
        d.id === `tv_${media.id}_s${season}_e${episode}` ||
        d.mediaId === media.id)
  );

  if (downloadItem) {
    if (downloadItem.fileUrl) {
      streamUrl = downloadItem.fileUrl;
      isLocalVideo = true;
    } else if (downloadItem.filePath) {
      try {
        streamUrl = convertFileSrc(downloadItem.filePath);
      } catch {
        streamUrl = downloadItem.filePath;
      }
      isLocalVideo = true;
    }
  } else if (media.mediaType === "african" || media.youtubeKey) {
    const videoId = media.youtubeKey || String(media.id);
    const startParam = streamStartTime ? `&start=${streamStartTime}` : "";
    streamUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&fs=1${startParam}`;
    isYouTube = true;
  } else if (media.mediaType === "series") {
    let url = streamingService.getTvStreamUrl(
      media.id,
      season,
      episode,
      activeServerId
    );
    if (streamStartTime && activeServerId === "vidlink") {
      url += `&startAt=${streamStartTime}`;
    }
    streamUrl = url;
  } else {
    let url = streamingService.getMovieStreamUrl(media.id, activeServerId);
    if (streamStartTime && activeServerId === "vidlink") {
      url += `&startAt=${streamStartTime}`;
    }
    streamUrl = url;
  }

  // Skip Intro handler: seeks forward +85s (or jumps to 85s if near start)
  const handleSkipIntro = () => {
    if (isLocalVideo && videoRef.current) {
      const targetTime = Math.max(videoRef.current.currentTime + 85, 85);
      videoRef.current.currentTime = targetTime;
    } else {
      setStreamStartTime(85);
      setShowSkipIntroToast(true);
      setTimeout(() => setShowSkipIntroToast(false), 3000);
    }
  };

  const handleDownload = () => {
    addDownload(
      media.id,
      media.mediaType,
      media.title,
      media.posterPath,
      media.backdropPath,
      season,
      episode,
      undefined,
      media.youtubeKey
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none animate-in fade-in duration-300">
      {/* Player Header Controls */}
      <div className="h-16 shrink-0 px-6 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between text-white z-30">
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={closePlayer}
            className="w-10 h-10 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            title="Back to Browse"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {media.title}
            </h2>
            {isSeries && (
              <p className="text-xs text-zinc-400">
                Season {season} • Episode {episode}
              </p>
            )}
          </div>
        </div>

        {/* Right: Server Selector, Next Episode, Download, Fullscreen */}
        <div className="flex items-center space-x-3">
          {!isYouTube && (
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-lg text-xs">
              <Server className="w-3.5 h-3.5 text-red-500" />
              <select
                value={activeServerId}
                onChange={(e) => setActiveServerId(e.target.value)}
                className="bg-transparent border-none text-white text-xs outline-none cursor-pointer"
              >
                {DEFAULT_STREAM_SOURCES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Next Episode / Next Season Quick Button in Header */}
          {isSeries && nextTarget && (
            <button
              onClick={handleNext}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm cursor-pointer ${nextTarget.isNewSeason
                ? "bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110"
                : "bg-red-600 hover:bg-red-700"
                }`}
              title={nextTarget.label}
            >
              <span>{nextTarget.label}</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Download for offline"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Embedded Cinema Player Container */}
      <div className="flex-1 w-full relative bg-black flex items-center justify-center overflow-hidden">
        {isLocalVideo ? (
          <video
            ref={videoRef}
            src={streamUrl}
            controls
            autoPlay
            onEnded={() => {
              if (isSeries && nextTarget) {
                triggerAutoNext();
              }
            }}
            className="w-full h-full max-h-screen object-contain"
          />
        ) : (
          <iframe
            key={streamUrl}
            src={streamUrl}
            title={media.title}
            className="w-full h-full border-none"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}

        {/* Skip Intro Button - Far left directly above the scrub line */}
        <button
          onClick={handleSkipIntro}
          className="absolute bottom-16 sm:bottom-20 left-8 z-30 flex items-center space-x-2 bg-black/85 hover:bg-black text-white border border-white/30 hover:border-white px-4 py-2 rounded-lg font-bold text-xs shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
          title="Skip Intro (+85s)"
        >
          <FastForward className="w-4 h-4 text-red-500" />
          <span>Skip Intro</span>
        </button>

        {/* Skip Intro Toast Notification */}
        {showSkipIntroToast && (
          <div className="absolute top-6 z-40 bg-zinc-900/95 border border-zinc-700 text-white text-xs px-4 py-2 rounded-lg shadow-xl backdrop-blur-sm flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
            <FastForward className="w-4 h-4 text-red-500" />
            <span>Skipped ahead 85 seconds</span>
          </div>
        )}

        {/* Auto Next Episode / Season Countdown Dialog (Far right directly above scrub line) */}
        {showCountdown && nextTarget && (
          <div className="absolute bottom-16 sm:bottom-20 right-8 z-40 bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded">
                  {nextTarget.isNewSeason ? "Next Season" : "Up Next"}
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  Season {nextTarget.season} • Episode {nextTarget.episode}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {autoplayNext ? (
                    <>
                      Starting in{" "}
                      <span className="text-white font-extrabold text-sm">
                        {countdownSeconds}s
                      </span>
                      ...
                    </>
                  ) : (
                    "Episode finished • Ready to play"
                  )}
                </p>
              </div>
              <button
                onClick={cancelCountdown}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Cancel Auto-play"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Animated Receding Progress Bar (Draining from 100% to 0%) */}
            {autoplayNext && (
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-red-600 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((countdownSeconds ?? 5) / 5) * 100))}%`,
                  }}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center space-x-1.5 bg-white hover:bg-zinc-200 text-black font-bold py-2 px-3 rounded text-xs transition-colors cursor-pointer active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play Now</span>
              </button>
              <button
                onClick={cancelCountdown}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold rounded text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
