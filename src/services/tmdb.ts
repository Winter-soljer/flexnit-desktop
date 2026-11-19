import axios from "axios";
import { Movie, TvSeries, Season, Video, CastMember } from "../types/movie";

const API_KEY = "dade4c57dbabc51b2888699212978cac";
const BASE_URL = "https://api.themoviedb.org/3";

export const TMDB_IMAGE_BASE = {
  original: "https://image.tmdb.org/t/p/original",
  backdrop: "https://image.tmdb.org/t/p/w1280",
  poster: "https://image.tmdb.org/t/p/w500",
  thumb: "https://image.tmdb.org/t/p/w300",
  profile: "https://image.tmdb.org/t/p/w185",
};

export const getBackdropUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${TMDB_IMAGE_BASE.backdrop}${path}`;
};

export const getPosterUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${TMDB_IMAGE_BASE.poster}${path}`;
};

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export const tmdbService = {
  async getTrendingMovies(): Promise<Movie[]> {
    const res = await api.get("/trending/movie/week");
    return (res.data.results || []).map((m: any) => ({ ...m, type: "movie" }));
  },

  async getPopularMovies(page = 1): Promise<Movie[]> {
    const res = await api.get("/movie/popular", { params: { page } });
    return (res.data.results || []).map((m: any) => ({ ...m, type: "movie" }));
  },

  async getTopRatedMovies(page = 1): Promise<Movie[]> {
    const res = await api.get("/movie/top_rated", { params: { page } });
    return (res.data.results || []).map((m: any) => ({ ...m, type: "movie" }));
  },

  async getUpcomingMovies(page = 1): Promise<Movie[]> {
    const res = await api.get("/movie/upcoming", { params: { page } });
    return (res.data.results || []).map((m: any) => ({ ...m, type: "movie" }));
  },

  async getPopularTvSeries(page = 1): Promise<TvSeries[]> {
    const res = await api.get("/tv/popular", { params: { page } });
    return (res.data.results || []).map((s: any) => ({ ...s, type: "series" }));
  },

  async getTopRatedTvSeries(page = 1): Promise<TvSeries[]> {
    const res = await api.get("/tv/top_rated", { params: { page } });
    return (res.data.results || []).map((s: any) => ({ ...s, type: "series" }));
  },

  async getMovieDetails(movieId: number): Promise<{
    movie: Movie;
    credits: CastMember[];
    videos: Video[];
    similar: Movie[];
  }> {
    const res = await api.get(`/movie/${movieId}`, {
      params: { append_to_response: "credits,videos,similar" },
    });
    const d = res.data;
    const movie: Movie = {
      id: d.id,
      title: d.title,
      overview: d.overview,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      vote_average: d.vote_average,
      release_date: d.release_date,
      genres: d.genres,
      runtime: d.runtime,
      type: "movie",
    };
    const credits: CastMember[] = (d.credits?.cast || []).slice(0, 15);
    const videos: Video[] = d.videos?.results || [];
    const similar: Movie[] = (d.similar?.results || []).slice(0, 12);
    return { movie, credits, videos, similar };
  },

  async getTvDetails(tvId: number): Promise<{
    tv: TvSeries;
    credits: CastMember[];
    videos: Video[];
    similar: TvSeries[];
    seasons: Season[];
  }> {
    const res = await api.get(`/tv/${tvId}`, {
      params: { append_to_response: "credits,videos,similar" },
    });
    const d = res.data;
    const tv: TvSeries = {
      id: d.id,
      name: d.name,
      overview: d.overview,
      poster_path: d.poster_path,
      backdrop_path: d.backdrop_path,
      vote_average: d.vote_average,
      first_air_date: d.first_air_date,
      genres: d.genres,
      number_of_seasons: d.number_of_seasons,
      number_of_episodes: d.number_of_episodes,
      type: "series",
    };
    const credits: CastMember[] = (d.credits?.cast || []).slice(0, 15);
    const videos: Video[] = d.videos?.results || [];
    const similar: TvSeries[] = (d.similar?.results || []).slice(0, 12);
    const seasons: Season[] = (d.seasons || []).filter(
      (s: any) => s.season_number > 0
    );
    return { tv, credits, videos, similar, seasons };
  },

  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<Season> {
    const res = await api.get(`/tv/${tvId}/season/${seasonNumber}`);
    return res.data;
  },

  async getMovieVideos(movieId: number): Promise<Video[]> {
    const res = await api.get(`/movie/${movieId}/videos`);
    return res.data.results || [];
  },

  async getTvVideos(tvId: number): Promise<Video[]> {
    const res = await api.get(`/tv/${tvId}/videos`);
    return res.data.results || [];
  },

  async searchMulti(query: string, page = 1): Promise<(Movie | TvSeries)[]> {
    if (!query.trim()) return [];
    const res = await api.get("/search/multi", {
      params: { query, page, include_adult: false },
    });
    return (res.data.results || [])
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => {
        if (item.media_type === "tv") {
          return { ...item, type: "series" };
        }
        return { ...item, type: "movie" };
      });
  },
};
