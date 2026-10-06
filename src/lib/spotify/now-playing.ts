/**
 * Pure Spotify helpers (task 19): map the currently-playing response to the `/api/spotify` payload,
 * pick the album art, and interpolate / format the playback position. No `astro:*` imports, so
 * `bun test` covers them with fixtures.
 */
import type { SpotifyNowPlayingData } from '~/types/spotify';

export const NOT_PLAYING: SpotifyNowPlayingData = Object.freeze({ isPlaying: false });

/**
 * `/api/spotify` caching (00-overview cache-header rule): browsers always revalidate, while Vercel's CDN
 * keeps a copy for 30 s (+30 s stale-while-revalidate), so many visitors polling cost one upstream call.
 * The CDN still sends `Age`, which `payloadAgeMs` uses to correct the playback position.
 */
export const SPOTIFY_CACHE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=30, stale-while-revalidate=30',
});

export interface SpotifyImage {
  url: string;
  width?: number | null;
  height?: number | null;
}

/** The smallest image at least `min` px wide (Spotify sends 640 / 300 / 64); else the largest one. */
export function pickAlbumImage(images: readonly SpotifyImage[] | undefined, min = 64): string | undefined {
  if (!images?.length) return undefined;
  const sized = images.filter((image) => typeof image.width === 'number');
  if (!sized.length) return images[0]?.url;
  const bySize = [...sized].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (bySize.find((image) => (image.width ?? 0) >= min) ?? bySize.at(-1))?.url;
}

/** `srcset` over the sized images, smallest first (the browser picks by DPR against `sizes`). */
export function albumSrcset(images: readonly SpotifyImage[] | undefined): string | undefined {
  const sized = (images ?? []).filter((image) => typeof image.width === 'number' && image.width > 0);
  if (sized.length < 2) return undefined;
  return [...sized]
    .sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
    .map((image) => `${image.url} ${image.width}w`)
    .join(', ');
}

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;

const str = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

// Loose view of the Spotify "currently playing" object (only the fields read here).
interface CurrentlyPlaying {
  is_playing?: unknown;
  progress_ms?: unknown;
  currently_playing_type?: unknown;
  item?: {
    name?: unknown;
    duration_ms?: unknown;
    external_urls?: { spotify?: unknown };
    artists?: { name?: unknown }[];
    album?: { name?: unknown; images?: SpotifyImage[] };
    images?: SpotifyImage[];
    show?: { name?: unknown; images?: SpotifyImage[] };
  } | null;
}

/**
 * v1 route semantics: 204 or ≥ 400 → not playing; an episode → title + link; a track → the full
 * payload. Anything malformed (no item, e.g. an ad or a private session) is "not playing".
 */
export function toNowPlaying(status: number, body: unknown, fetchedAt = Date.now()): SpotifyNowPlayingData {
  if (status === 204 || status >= 400 || !body || typeof body !== 'object') return NOT_PLAYING;
  const data = body as CurrentlyPlaying;
  const item = data.item;
  const title = str(item?.name);
  if (!item || !title) return NOT_PLAYING;

  const timing = { progressMs: num(data.progress_ms), durationMs: num(item.duration_ms), fetchedAt };
  const songUrl = str(item.external_urls?.spotify);

  if (data.currently_playing_type === 'episode') {
    const images = item.images ?? item.show?.images;
    return {
      isPlaying: data.is_playing !== false, // a paused episode freezes like a paused track
      title,
      songUrl,
      artist: str(item.show?.name),
      albumImageUrl: pickAlbumImage(images),
      albumImageSrcset: albumSrcset(images),
      ...timing,
    };
  }

  return { isPlaying: data.is_playing === true, ...trackFields(item, title), ...timing };
}

type Track = NonNullable<CurrentlyPlaying['item']>;

function trackFields(item: Track, title: string) {
  const images = item.album?.images;
  const artist = (item.artists ?? [])
    .map((a) => str(a.name))
    .filter(Boolean)
    .join(', ');
  return {
    title,
    artist: artist || undefined,
    album: str(item.album?.name),
    albumImageUrl: pickAlbumImage(images),
    albumImageSrcset: albumSrcset(images),
    songUrl: str(item.external_urls?.spotify),
  };
}

/**
 * The last played track (`/me/player/recently-played?limit=1`), shown when nothing is playing.
 * Not playing, no timing; `playedAt` marks it as history. Errors (e.g. 403 without the
 * `user-read-recently-played` scope) or an empty history are "not playing".
 */
export function toRecentlyPlayed(status: number, body: unknown, fetchedAt = Date.now()): SpotifyNowPlayingData {
  if (status !== 200 || !body || typeof body !== 'object') return NOT_PLAYING;
  const entry = (body as { items?: { track?: Track; played_at?: unknown }[] }).items?.[0];
  const title = str(entry?.track?.name);
  const playedAt = str(entry?.played_at);
  if (!entry?.track || !title || !playedAt || Number.isNaN(Date.parse(playedAt))) return NOT_PLAYING;
  return { isPlaying: false, ...trackFields(entry.track, title), playedAt, fetchedAt };
}

/** `m:ss` (or `h:mm:ss` from one hour), floored to whole seconds. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Longest plausible CDN cache age (`Vercel-CDN-Cache-Control` max-age 30 + stale-while-revalidate 30, plus slack). */
const MAX_AGE_MS = 120_000;

/**
 * How old the payload already was when the browser received it. Prefers the CDN `Age` header
 * (skew-free); falls back to the server `fetchedAt` stamp when it is plausible for this clock.
 */
export function payloadAgeMs(ageHeader: string | null, fetchedAt: number | undefined, receivedAt: number): number {
  const age = ageHeader === null ? Number.NaN : Number(ageHeader);
  if (Number.isFinite(age) && age >= 0) return Math.min(age * 1000, MAX_AGE_MS);
  if (fetchedAt === undefined) return 0;
  const diff = receivedAt - fetchedAt;
  return diff >= 0 && diff <= MAX_AGE_MS ? diff : 0;
}

/**
 * Playback position at `now`: `progressMs` plus the time since the server read it while playing,
 * clamped to `[0, durationMs]`; frozen at `progressMs` when paused.
 */
export function positionAt(
  data: Pick<SpotifyNowPlayingData, 'isPlaying' | 'progressMs' | 'durationMs'>,
  elapsedMs: number
): number {
  const base = data.progressMs ?? 0;
  const at = data.isPlaying ? base + Math.max(0, elapsedMs) : base;
  const max = data.durationMs ?? at;
  return Math.min(Math.max(0, at), max);
}
