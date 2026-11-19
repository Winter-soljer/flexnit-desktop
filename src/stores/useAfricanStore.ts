import { create } from "zustand";
import {
  AfricanFeedResponse,
  AfricanMovie,
  AfricanCountryInfo,
  AfricanGenreInfo,
} from "../types/african";
import { africanService } from "../services/africanApi";

interface AfricanState {
  // Feed & Slider
  feed: AfricanFeedResponse | null;
  newReleases: AfricanMovie[];
  activeSlide: number;
  isLoadingFeed: boolean;

  // Catalog state
  catalogMovies: AfricanMovie[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoadingCatalog: boolean;
  isLoadingMore: boolean;

  // Filter dimensions from flexnitweb
  viewMode: "home" | "catalog";
  selectedSort: "views" | "latest" | "title";
  selectedCountry: string; // empty string or "NG", "GH", "TZ", "ZA", "KE"
  selectedGenre: string; // empty string or "Drama", "Romance", "Epic/Period", "Comedy", "Thriller"
  selectedChannel: string; // empty string or channelTitle
  catalogSearchQuery: string;

  // Available metadata lists
  availableCountries: AfricanCountryInfo[];
  availableGenres: AfricanGenreInfo[];

  // Actions
  setViewMode: (mode: "home" | "catalog") => void;
  fetchAfricanFeed: () => Promise<void>;
  fetchMetadata: () => Promise<void>;
  fetchCatalog: (page?: number) => Promise<void>;
  loadMoreCatalog: () => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: "views" | "latest" | "title") => void;
  setCountry: (country: string) => void;
  setGenre: (genre: string) => void;
  setChannel: (channel: string) => void;
  setCatalogSearchQuery: (query: string) => void;
  resetFilters: () => void;
  nextSlide: () => void;
  prevSlide: () => void;
  setActiveSlide: (index: number) => void;
}

export const useAfricanStore = create<AfricanState>((set, get) => ({
  feed: null,
  newReleases: [],
  activeSlide: 0,
  isLoadingFeed: false,

  catalogMovies: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  isLoadingCatalog: false,
  isLoadingMore: false,

  viewMode: "home",
  selectedSort: "views",
  selectedCountry: "",
  selectedGenre: "",
  selectedChannel: "",
  catalogSearchQuery: "",

  availableCountries: [
    { code: "NG", name: "Nigeria (Nollywood)", count: 6410 },
    { code: "GH", name: "Ghana (Ghallywood)", count: 1084 },
    { code: "TZ", name: "Tanzania (Bongo)", count: 626 },
    { code: "ZA", name: "South Africa (Mzansi)", count: 228 },
    { code: "KE", name: "Kenya (Riverwood)", count: 125 },
  ],
  availableGenres: [
    { name: "Drama", count: 5424 },
    { name: "Romance", count: 1785 },
    { name: "Epic/Period", count: 542 },
    { name: "Comedy", count: 378 },
    { name: "Thriller", count: 339 },
  ],

  setViewMode: (mode: "home" | "catalog") => {
    set({ viewMode: mode });
  },

  fetchAfricanFeed: async () => {
    if (get().feed) return;
    set({ isLoadingFeed: true });
    try {
      const feed = await africanService.getFeed();
      const newReleases =
        feed.latestUploads && feed.latestUploads.length > 0
          ? feed.latestUploads
          : (feed.hero || []).filter((m) => m.releaseYear === 2026 || m.isNewRelease);

      const sliderMovies =
        newReleases.length > 0
          ? newReleases
          : feed.hero && feed.hero.length > 0
          ? feed.hero
          : feed.trending || [];

      set({
        feed,
        newReleases: sliderMovies,
        isLoadingFeed: false,
      });

      // Load metadata and first page of catalog
      get().fetchMetadata();
      get().fetchCatalog(1);
    } catch {
      set({ isLoadingFeed: false });
    }
  },

  fetchMetadata: async () => {
    try {
      const [countries, genres] = await Promise.all([
        africanService.getCountries(),
        africanService.getGenres(),
      ]);
      if (countries && countries.length > 0) set({ availableCountries: countries });
      if (genres && genres.length > 0) set({ availableGenres: genres });
    } catch {
      // Keep defaults
    }
  },

  fetchCatalog: async (page = 1) => {
    const {
      selectedSort,
      selectedCountry,
      selectedGenre,
      selectedChannel,
      catalogSearchQuery,
    } = get();

    set({ isLoadingCatalog: true, currentPage: page });

    try {
      const res = await africanService.getMovies({
        page,
        limit: 24,
        sort: selectedSort,
        country: selectedCountry,
        genre: selectedGenre,
        channel: selectedChannel,
        search: catalogSearchQuery,
      });

      set({
        catalogMovies: res.movies,
        totalCount: res.total,
        currentPage: res.page,
        totalPages: res.totalPages,
        isLoadingCatalog: false,
      });
    } catch {
      set({ isLoadingCatalog: false });
    }
  },

  loadMoreCatalog: async () => {
    const {
      currentPage,
      totalPages,
      isLoadingMore,
      selectedSort,
      selectedCountry,
      selectedGenre,
      selectedChannel,
      catalogSearchQuery,
      catalogMovies,
    } = get();

    if (isLoadingMore || currentPage >= totalPages) return;

    set({ isLoadingMore: true });
    try {
      const nextPage = currentPage + 1;
      const res = await africanService.getMovies({
        page: nextPage,
        limit: 24,
        sort: selectedSort,
        country: selectedCountry,
        genre: selectedGenre,
        channel: selectedChannel,
        search: catalogSearchQuery,
      });

      const existingIds = new Set(catalogMovies.map((m) => m.id));
      const freshMovies = res.movies.filter((m) => !existingIds.has(m.id));

      set({
        catalogMovies: [...catalogMovies, ...freshMovies],
        currentPage: nextPage,
        totalCount: res.total,
        totalPages: res.totalPages,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  setPage: (page: number) => {
    get().fetchCatalog(page);
  },

  setSort: (sort: "views" | "latest" | "title") => {
    set({ selectedSort: sort, currentPage: 1 });
    get().fetchCatalog(1);
  },

  setCountry: (country: string) => {
    set({ selectedCountry: country, currentPage: 1 });
    get().fetchCatalog(1);
  },

  setGenre: (genre: string) => {
    set({ selectedGenre: genre, currentPage: 1 });
    get().fetchCatalog(1);
  },

  setChannel: (channel: string) => {
    set({ selectedChannel: channel, currentPage: 1 });
    get().fetchCatalog(1);
  },

  setCatalogSearchQuery: (query: string) => {
    set({ catalogSearchQuery: query, currentPage: 1 });
    get().fetchCatalog(1);
  },

  resetFilters: () => {
    set({
      selectedSort: "views",
      selectedCountry: "",
      selectedGenre: "",
      selectedChannel: "",
      catalogSearchQuery: "",
      currentPage: 1,
    });
    get().fetchCatalog(1);
  },

  nextSlide: () => {
    const { newReleases, activeSlide } = get();
    if (newReleases.length === 0) return;
    set({ activeSlide: (activeSlide + 1) % newReleases.length });
  },

  prevSlide: () => {
    const { newReleases, activeSlide } = get();
    if (newReleases.length === 0) return;
    set({
      activeSlide: (activeSlide - 1 + newReleases.length) % newReleases.length,
    });
  },

  setActiveSlide: (index: number) => {
    set({ activeSlide: index });
  },
}));
