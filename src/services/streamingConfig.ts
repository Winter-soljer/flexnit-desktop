import axios from "axios";
import { StreamSource } from "../types/streaming";

export const DEFAULT_STREAM_SOURCES: StreamSource[] = [
  {
    id: "vidlink",
    name: "Server 1 (VidLink - Ultra Fast)",
    movieUrl:
      "https://vidlink.pro/movie/{id}?primaryColor=e50914&autoplay=true",
    tvUrl:
      "https://vidlink.pro/tv/{id}/{season}/{episode}?primaryColor=e50914&autoplay=true&nextbutton=true",
  },
  {
    id: "autoembed",
    name: "Server 2 (AutoEmbed - Multi-Source)",
    movieUrl: "https://autoembed.me/movie/tmdb/{id}",
    tvUrl: "https://autoembed.me/tv/tmdb/{id}-{season}-{episode}",
  },
  {
    id: "vidspark",
    name: "Server 3 (VidSpark - Fast)",
    movieUrl: "https://vidspark.to/movie/{id}",
    tvUrl: "https://vidspark.to/tv/{id}-{season}-{episode}",
  },
  {
    id: "vidsrc",
    name: "Server 4 (VidSrc - 4K / Multi)",
    movieUrl: "https://vidsrc.to/embed/movie/{id}",
    tvUrl: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
  },
  {
    id: "multiembed",
    name: "Server 5 (MultiEmbed - Mirrors)",
    movieUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tvUrl: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
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
