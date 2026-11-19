export interface AfricanMovie {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  backdropUrl?: string | null;
  channelTitle?: string | null;
  channelId?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  genre?: string | null;
  subGenres?: string[] | null;
  language?: string | null;
  durationMinutes?: number | null;
  durationFormatted?: string | null;
  durationSeconds?: number | null;
  releaseYear?: number | null;
  viewCount?: number | null;
  contentOwner?: string | null;
  permissionStatus?: string | null;
  publicationStatus?: string | null;
  isFeatured?: boolean | null;
  isHero?: boolean | null;
  isNewRelease?: boolean | null;
  featured?: boolean | null;
  trending?: boolean | null;
  curatedCategory?: string | null;
  tags?: string[] | null;
  verifiedByAdmin?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  [key: string]: any;
}

export interface AfricanChannelRail {
  channelId: string;
  channelTitle: string;
  countryCode?: string;
  countryName?: string;
  movieCount: number;
  movies: AfricanMovie[];
}

export interface AfricanCountryInfo {
  code: string;
  name: string;
  count: number;
}

export interface AfricanGenreInfo {
  name: string;
  count: number;
}

export interface AfricanFeedResponse {
  hero: AfricanMovie[];
  trending: AfricanMovie[];
  featured: AfricanMovie[];
  nollywood: AfricanMovie[];
  ghallywood: AfricanMovie[];
  mzansi: AfricanMovie[];
  eastAfrica: AfricanMovie[];
  latestUploads?: AfricanMovie[];
  channelRails?: AfricanChannelRail[];
  genres?: { name: string; movies: AfricanMovie[] }[];
}

export interface AfricanMoviesQuery {
  page?: number;
  limit?: number;
  country?: string;
  genre?: string;
  channel?: string;
  search?: string;
  sort?: "views" | "latest" | "title" | string;
}

export interface AfricanMoviesResponse {
  movies: AfricanMovie[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
