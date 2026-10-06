/** `GET /api/spotify` payload (v1 shape, plus playback position for the progress bar). */
export interface SpotifyNowPlayingData {
  isPlaying: boolean;
  songUrl?: string;
  title?: string;
  artist?: string;
  album?: string;
  /** Smallest album image that is at least 64 px wide (to cut bytes). */
  albumImageUrl?: string;
  /** `srcset` over the album images (`<url> <w>w, …`) so 2x screens get a sharp cover. */
  albumImageSrcset?: string;
  /** Playback position when the server read it (Spotify `progress_ms`). */
  progressMs?: number;
  /** Track / episode length (Spotify `item.duration_ms`). */
  durationMs?: number;
  /** Set only for the last played track (nothing is playing): when it was played (ISO 8601). */
  playedAt?: string;
  /** Server time (epoch ms) of the Spotify read; lets the client correct for CDN caching. */
  fetchedAt?: number;
}
