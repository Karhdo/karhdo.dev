/**
 * `GET /api/spotify` (task 19): what is playing right now, or else the last played track
 * (`playedAt` set). Source: Last.fm when `LASTFM_API_KEY` + `LASTFM_USERNAME` are set (Spotify's
 * Web API needs Premium on the app owner's account), else the Spotify Web API. On demand, with a 30 s CDN-only cache (`SPOTIFY_CACHE_HEADERS`; browsers always
 * revalidate), so many visitors polling cost one upstream call per 30 s. Missing credentials, an
 * upstream error or a timeout all answer `{ isPlaying: false }` (200), never a 5xx.
 */
import type { APIRoute } from 'astro';
import { toLastfmNowPlaying } from '~/lib/lastfm/recent-tracks';
import { getLastfmRecentTracks } from '~/lib/services/lastfm';
import { getSpotifyNowPlaying, getSpotifyRecentlyPlayed } from '~/lib/services/spotify';
import { NOT_PLAYING, SPOTIFY_CACHE_HEADERS, toNowPlaying, toRecentlyPlayed } from '~/lib/spotify/now-playing';

export const prerender = false;

/** Status + JSON body (only on 200); any other body is discarded to free the connection. */
async function read(response: Response, source = 'spotify'): Promise<{ status: number; body: unknown }> {
  if (response.status >= 400) console.warn(`[api/spotify] ${source} status ${response.status}`);
  if (response.status === 200) return { status: 200, body: await response.json() };
  await response.body?.cancel();
  return { status: response.status, body: undefined };
}

export const GET: APIRoute = async () => {
  try {
    const lastfm = await getLastfmRecentTracks();
    if (lastfm) {
      const recent = await read(lastfm, 'lastfm');
      return Response.json(toLastfmNowPlaying(recent.status, recent.body, Date.now()), {
        headers: SPOTIFY_CACHE_HEADERS,
      });
    }
    const response = await getSpotifyNowPlaying();
    if (!response) return Response.json(NOT_PLAYING, { headers: SPOTIFY_CACHE_HEADERS });
    const now = await read(response);
    const current = toNowPlaying(now.status, now.body, Date.now());
    // Nothing current (not even paused): show the last played track instead.
    if (current.title || now.status >= 400) return Response.json(current, { headers: SPOTIFY_CACHE_HEADERS });
    const last = await getSpotifyRecentlyPlayed();
    if (!last) return Response.json(NOT_PLAYING, { headers: SPOTIFY_CACHE_HEADERS });
    const recent = await read(last);
    return Response.json(toRecentlyPlayed(recent.status, recent.body, Date.now()), { headers: SPOTIFY_CACHE_HEADERS });
  } catch (error) {
    // Only the error name/message (never request details, which carry the credentials or the Last.fm key).
    console.warn('[api/spotify]', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error');
    return Response.json(NOT_PLAYING, { headers: SPOTIFY_CACHE_HEADERS });
  }
};
