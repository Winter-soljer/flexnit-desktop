export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  type?: "movie";
}

export interface TvSeries {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  type?: "series";
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episode_count: number;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  vote_average: number;
  runtime?: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface UnifiedMedia {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
  mediaType: "movie" | "series" | "african";
  genres?: string[];
  durationFormatted?: string | null;
  youtubeKey?: string;
  seasonsCount?: number;
}
