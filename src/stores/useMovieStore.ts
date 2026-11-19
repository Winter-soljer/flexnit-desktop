import { create } from "zustand";
import { Movie, TvSeries } from "../types/movie";
import { tmdbService } from "../services/tmdb";

interface MovieState {
  trending: Movie[];
  popularMovies: Movie[];
  topRatedMovies: Movie[];
  upcomingMovies: Movie[];
  popularTv: TvSeries[];
  topRatedTv: TvSeries[];
  heroMedia: Movie | null;
  isLoading: boolean;
  error: string | null;
  fetchHomeData: () => Promise<void>;
}

export const useMovieStore = create<MovieState>((set, get) => ({
  trending: [],
  popularMovies: [],
  topRatedMovies: [],
  upcomingMovies: [],
  popularTv: [],
  topRatedTv: [],
  heroMedia: null,
  isLoading: false,
  error: null,

  fetchHomeData: async () => {
    if (get().trending.length > 0) return; // cache
    set({ isLoading: true, error: null });
    try {
      const [
        trending,
        popularMovies,
        topRatedMovies,
        upcomingMovies,
        popularTv,
        topRatedTv,
      ] = await Promise.all([
        tmdbService.getTrendingMovies(),
        tmdbService.getPopularMovies(1),
        tmdbService.getTopRatedMovies(1),
        tmdbService.getUpcomingMovies(1),
        tmdbService.getPopularTvSeries(1),
        tmdbService.getTopRatedTvSeries(1),
      ]);

      // Pick a random top movie for the hero banner
      const hero =
        trending.length > 0
          ? trending[Math.floor(Math.random() * Math.min(trending.length, 5))]
          : null;

      set({
        trending,
        popularMovies,
        topRatedMovies,
        upcomingMovies,
        popularTv,
        topRatedTv,
        heroMedia: hero,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || "Failed to load content", isLoading: false });
    }
  },
}));
