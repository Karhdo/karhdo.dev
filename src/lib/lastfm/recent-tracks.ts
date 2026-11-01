/**
 * Last.fm source for the Now playing card. Spotify's Web API only answers when the app owner has
 * Premium, so with Spotify connected to Last.fm (scrobbling works on the Free plan) the card reads
 * `user.getRecentTracks` instead. Maps it to the same `/api/spotify` payload. Pure (no `astro:*`).
 */
import type { SpotifyNowPlayingData } from '~/types/spotify';
import { NOT_PLAYING } from '../spotify/now-playing';

export const LASTFM_API = 'https://ws.audioscrobbler.com/2.0/';

/** Last.fm's grey star, served when a track has no artwork. */
const PLACEHOLDER_IMAGE = '2a96cbd8b46e442fc41c2b86b821562f';

/** Pixel widths of Last.fm's image sizes (the `34s` / `64s` / `174s` / `300x300` URL segments). */
const IMAGE_WIDTHS: Readonly<Record<string, number>> = { small: 34, medium: 64, large: 174, extralarge: 300 };

/**
 * `limit=1` still returns two entries while a track is playing: the current one, then the last
 * scrobble. The API key travels in the query, so never log this URL.
 */
export function recentTracksUrl(user: string, apiKey: string): string {
  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user,
    api_key: apiKey,
    format: 'json',
    limit: '1',
  });
  return `${LASTFM_API}?${params}`;
}

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

/** Last.fm wraps names as `{ '#text': … }`. */
const text = (value: unknown): string | undefined =>
  value && typeof value === 'object' ? str((value as { '#text'?: unknown })['#text']) : undefined;

interface LastfmImage {
  size?: unknown;
  '#text'?: unknown;
}

interface LastfmTrack {
  name?: unknown;
  url?: unknown;
  artist?: unknown;
  album?: unknown;
  image?: LastfmImage[];
  date?: { uts?: unknown };
  '@attr'?: { nowplaying?: unknown };
}

/** Real artwork only (drops empty URLs and the placeholder), smallest first. */
function images(track: LastfmTrack): { url: string; width: number }[] {
  return (track.image ?? [])
    .map((image) => ({ url: str(image['#text']), width: IMAGE_WIDTHS[String(image.size)] }))
    .filter((image): image is { url: string; width: number } =>
      Boolean(image.url && image.width && !image.url.includes(PLACEHOLDER_IMAGE))
    )
    .sort((a, b) => a.width - b.width);
}

/**
 * The playing track (`@attr.nowplaying`), else the last scrobble (`playedAt`). Errors, an empty
 * history or a malformed body are "not playing". Last.fm reports no position or length, so the
 * payload has no timing and the card hides its progress row.
 */
export function toLastfmNowPlaying(status: number, body: unknown, fetchedAt = Date.now()): SpotifyNowPlayingData {
  if (status !== 200 || !body || typeof body !== 'object') return NOT_PLAYING;
  const raw = (body as { recenttracks?: { track?: unknown } }).recenttracks?.track;
  const tracks = (Array.isArray(raw) ? raw : raw ? [raw] : []) as LastfmTrack[];
  const track = tracks[0];
  const title = str(track?.name);
  if (!track || !title) return NOT_PLAYING;

  const art = images(track);
  const cover = art.find((image) => image.width >= 64) ?? art.at(-1);
  const fields = {
    title,
    artist: text(track.artist),
    album: text(track.album),
    albumImageUrl: cover?.url,
    albumImageSrcset: art.length > 1 ? art.map((image) => `${image.url} ${image.width}w`).join(', ') : undefined,
    songUrl: str(track.url),
    fetchedAt,
  };

  if (track['@attr']?.nowplaying === 'true') return { isPlaying: true, ...fields };

  const uts = Number(track.date?.uts);
  if (!Number.isFinite(uts) || uts <= 0) return NOT_PLAYING;
  return { isPlaying: false, ...fields, playedAt: new Date(uts * 1000).toISOString() };
}
