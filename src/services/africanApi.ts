import axios from "axios";
import {
  AfricanFeedResponse,
  AfricanMovie,
  AfricanMoviesQuery,
  AfricanMoviesResponse,
  AfricanCountryInfo,
  AfricanGenreInfo,
} from "../types/african";
import {
  SEED_AFRICAN_MOVIES,
  SEED_AFRICAN_HOME_FEED,
} from "./africanSeed";

const BASE_URL = "https://flexnitweb.web.app";

export const africanService = {
  async getFeed(): Promise<AfricanFeedResponse> {
    try {
      const res = await axios.get(`${BASE_URL}/api/african/home`, {
        timeout: 10000,
      });
      if (res.data && (res.data.trending?.length || res.data.featured?.length || res.data.hero?.length)) {
        return res.data;
      }
    } catch (e) {
      console.warn("Live API /api/african/home unavailable, using rich seed feed:", e);
    }
    return SEED_AFRICAN_HOME_FEED as unknown as AfricanFeedResponse;
  },

  async getMovies(query: AfricanMoviesQuery = {}): Promise<AfricanMoviesResponse> {
    const { page = 1, limit = 24, country, genre, channel, search, sort = "views" } = query;
    const params: Record<string, string | number> = { page, limit };
    if (country && country !== "all" && country !== "") params.country = country;
    if (genre && genre !== "all" && genre !== "") params.genre = genre;
    if (channel && channel.trim()) params.channel = channel.trim();
    if (search && search.trim()) params.search = search.trim();
    if (sort) params.sort = sort;

    try {
      const res = await axios.get(`${BASE_URL}/api/african/movies`, {
        params,
        timeout: 10000,
      });
      if (res.data && Array.isArray(res.data.movies) && res.data.movies.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn("Live API /api/african/movies unavailable, using rich seed fallback:", e);
    }

    // Comprehensive Fallback filtered from the 382 bundled African movies
    let filtered: AfricanMovie[] = [...SEED_AFRICAN_MOVIES];

    if (country && country !== "all" && country !== "") {
      filtered = filtered.filter((m) => m.countryCode === country);
    }

    if (genre && genre !== "all" && genre !== "") {
      const targetGenre = genre.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.genre?.toLowerCase().includes(targetGenre) ||
          m.subGenres?.some((sg) => sg.toLowerCase().includes(targetGenre))
      );
    }

    if (channel && channel.trim()) {
      const targetChannel = channel.toLowerCase().trim();
      filtered = filtered.filter((m) =>
        m.channelTitle?.toLowerCase().includes(targetChannel)
      );
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.channelTitle?.toLowerCase().includes(q)
      );
    }

    if (sort === "views") {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    } else if (sort === "latest") {
      filtered.sort((a, b) => (b.releaseYear || 2024) - (a.releaseYear || 2024));
    } else if (sort === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    const offset = (page - 1) * limit;
    return {
      movies: filtered.slice(offset, offset + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    };
  },

  async getCountries(): Promise<AfricanCountryInfo[]> {
    try {
      const res = await axios.get(`${BASE_URL}/api/african/countries`, { timeout: 6000 });
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // Fallback
    }
    return [
      { code: "NG", name: "Nigeria (Nollywood)", count: 6410 },
      { code: "GH", name: "Ghana (Ghallywood)", count: 1084 },
      { code: "TZ", name: "Tanzania (Bongo)", count: 626 },
      { code: "ZA", name: "South Africa (Mzansi)", count: 228 },
      { code: "KE", name: "Kenya (Riverwood)", count: 125 },
      { code: "UG", name: "Uganda (Ugawood)", count: 96 },
    ];
  },

  async getGenres(): Promise<AfricanGenreInfo[]> {
    try {
      const res = await axios.get(`${BASE_URL}/api/african/genres`, { timeout: 6000 });
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {
      // Fallback
    }
    return [
      { name: "Drama", count: 5424 },
      { name: "Romance", count: 1785 },
      { name: "Epic/Period", count: 542 },
      { name: "Comedy", count: 378 },
      { name: "Thriller", count: 339 },
      { name: "Action", count: 215 },
    ];
  },

  async searchMovies(query: string, page = 1, limit = 24): Promise<AfricanMoviesResponse> {
    return this.getMovies({ search: query, page, limit });
  },
};
