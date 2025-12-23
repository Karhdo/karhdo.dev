export interface SpotifyNowPlayingData {
  isPlaying: boolean;
  songUrl?: string;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
}

export interface ViewApiResponse {
  total: string;
}

export interface TagCounts {
  [tag: string]: number;
}
