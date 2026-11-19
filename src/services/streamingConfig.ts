import axios from "axios";
import { StreamSource } from "../types/streaming";

export const DEFAULT_STREAM_SOURCES: StreamSource[] = [
  {
    id: "vidlink",
    name: "Server 1 (VidLink - Ultra Fast)",
    movieUrl:
      "https://vidlink.pro/movie/{id}?autoplay=true&player=jw&controls=false&mute=false&title=true&poster=true&primaryColor=e50914",
    tvUrl:
      "https://vidlink.pro/tv/{id}/{season}/{episode}?autoplay=true&player=jw&controls=false&mute=false&title=true&poster=true&primaryColor=e50914",
  },
  {
    id: "vidsrc",
    name: "Server 2 (VidSrc - 4K / Multi)",
    movieUrl: "https://vidsrc.to/embed/movie/{id}",
    tvUrl: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
  },
  {
    id: "multiembed",
    name: "Server 3 (MultiEmbed - 10+ Mirrors)",
    movieUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tvUrl: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
  },
  {
    id: "autoembed",
    name: "Server 4 (AutoEmbed - Failover)",
    movieUrl: "https://autoembed.co/movie/tmdb/{id}",
    tvUrl: "https://autoembed.co/tv/tmdb/{id}-{season}-{episode}",
  },
  {
    id: "vidbinge",
    name: "Server 5 (VidBinge - Clean Player)",
    movieUrl: "https://vidbinge.dev/embed/movie/{id}",
    tvUrl: "https://vidbinge.dev/embed/tv/{id}/{season}/{episode}",
  },
  {
    id: "vidspark",
    name: "Server 6 (VidSpark - Fast)",
    movieUrl: "https://vidspark.to/movie/{id}",
    tvUrl: "https://vidspark.to/tv/{id}-{season}-{episode}",
  },
];

export const streamingService = {
  sources: DEFAULT_STREAM_SOURCES,

  async initRemoteConfig(): Promise<StreamSource[]> {
    try {
      const res = await axios.get("https://flexnit-1.web.app/sources.json", {
        timeout: 4000,
      });
      if (res.data && Array.isArray(res.data.servers)) {
        this.sources = res.data.servers;
        return this.sources;
      }
    } catch {
      // Continue with default sources
    }
    return this.sources;
  },

  getMovieStreamUrl(movieId: number | string, sourceId?: string): string {
    const src =
      this.sources.find((s) => s.id === sourceId) || this.sources[0];
    return src.movieUrl
      .replace(/{id}/g, String(movieId))
      .replace(/{movieId}/g, String(movieId))
      .replace(/{tmdb_id}/g, String(movieId));
  },

  getTvStreamUrl(
    tvId: number | string,
    season: number,
    episode: number,
    sourceId?: string
  ): string {
    const src =
      this.sources.find((s) => s.id === sourceId) || this.sources[0];
    return src.tvUrl
      .replace(/{id}/g, String(tvId))
      .replace(/{tvId}/g, String(tvId))
      .replace(/{tmdb_id}/g, String(tvId))
      .replace(/{season}/g, String(season))
      .replace(/{seasonNumber}/g, String(season))
      .replace(/{episode}/g, String(episode))
      .replace(/{episodeNumber}/g, String(episode));
  },

  getDownloadExtractionUrl(
    mediaType: "movie" | "series",
    id: number,
    season = 1,
    episode = 1
  ): string {
    if (mediaType === "movie") {
      return `https://vidspark.to/movie/${id}`;
    }
    return `https://vidspark.to/tv/${id}-${season}-${episode}`;
  },
};
