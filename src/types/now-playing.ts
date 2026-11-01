/** `GET /api/spotify` payload (v1 shape). Read from Last.fm, which reports no playback position. */
export interface NowPlayingData {
  isPlaying: boolean;
  songUrl?: string;
  title?: string;
  artist?: string;
  album?: string;
  /** Smallest cover image that is at least 64 px wide (to cut bytes). */
  albumImageUrl?: string;
  /** `srcset` over the cover images (`<url> <w>w, …`) so 2x screens get a sharp cover. */
  albumImageSrcset?: string;
  /** Set only for the last played track (nothing is playing): when it was played (ISO 8601). */
  playedAt?: string;
  /** Server time (epoch ms) of the upstream read. */
  fetchedAt?: number;
}
