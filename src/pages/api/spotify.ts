/**
 * `GET /api/spotify` (task 19): what is playing on Spotify right now. On demand, with a 30 s CDN-only
 * cache (`SPOTIFY_CACHE_HEADERS`; browsers always revalidate), so many visitors polling cost one
 * upstream call per 30 s. Missing credentials, an upstream error or a timeout all answer
 * `{ isPlaying: false }` (200), never a 5xx.
 */
import type { APIRoute } from 'astro';
import { getSpotifyNowPlaying } from '~/lib/services/spotify';
import { NOT_PLAYING, SPOTIFY_CACHE_HEADERS, toNowPlaying } from '~/lib/spotify/now-playing';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const response = await getSpotifyNowPlaying();
    if (!response) return Response.json(NOT_PLAYING, { headers: SPOTIFY_CACHE_HEADERS });
    const fetchedAt = Date.now();
    let body: unknown;
    if (response.status === 200) body = await response.json();
    else await response.body?.cancel(); // free the connection (204 has no body; errors are ignored)
    if (response.status >= 400) console.warn(`[api/spotify] upstream status ${response.status}`);
    return Response.json(toNowPlaying(response.status, body, fetchedAt), { headers: SPOTIFY_CACHE_HEADERS });
  } catch (error) {
    // Only the error name/message (never request details, which carry the credentials).
    console.warn('[api/spotify]', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error');
    return Response.json(NOT_PLAYING, { headers: SPOTIFY_CACHE_HEADERS });
  }
};
