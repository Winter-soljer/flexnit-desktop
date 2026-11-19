export interface StreamSource {
  id: string;
  name: string;
  movieUrl: string;
  tvUrl: string;
}

export interface DownloadItem {
  id: string; // unique download id, e.g. movie_123 or tv_123_s1_e1
  mediaId: number;
  mediaType: "movie" | "series" | "african";
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  downloadUrl: string;
  progress: number; // 0-100
  status: "queued" | "downloading" | "completed" | "failed";
  sizeFormatted?: string;
  downloadedAt: number;
  phase?: string;
  speed?: string;
  eta?: string;
  fileUrl?: string;
  filePath?: string;
  error?: string;
  jobId?: string;
  youtubeKey?: string | null;
}
