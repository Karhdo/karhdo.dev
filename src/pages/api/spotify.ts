/**
 * `GET /api/spotify` (task 19; v1 URL kept): what is playing right now, or else the last played track
 * (`playedAt` set), from Last.fm `user.getRecentTracks` (Spotify scrobbles to Last.fm; Spotify's Web API
 * needs Premium on the app owner's account). On demand, with a 30 s CDN-only cache
 * (`NOW_PLAYING_CACHE_HEADERS`; browsers always revalidate), so many visitors polling cost one upstream
 * call per 30 s. Missing env vars, an upstream error or a timeout all answer `{ isPlaying: false }` (200),
 * never a 5xx.
 */
import type { APIRoute } from 'astro';
import { toLastfmNowPlaying } from '~/lib/lastfm/recent-tracks';
import { NOT_PLAYING, NOW_PLAYING_CACHE_HEADERS } from '~/lib/now-playing';
import { getLastfmRecentTracks } from '~/lib/services/lastfm';

export const prerender = false;

const json = (data: unknown) => Response.json(data, { headers: NOW_PLAYING_CACHE_HEADERS });

export const GET: APIRoute = async () => {
  try {
    const response = await getLastfmRecentTracks();
    if (!response) return json(NOT_PLAYING);
    if (response.status !== 200) {
      console.warn(`[api/spotify] lastfm status ${response.status}`);
      await response.body?.cancel();
      return json(NOT_PLAYING);
    }
    return json(toLastfmNowPlaying(200, await response.json(), Date.now()));
  } catch (error) {
    // Only the error name/message (never the request URL, which carries the Last.fm key).
    console.warn('[api/spotify]', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error');
    return json(NOT_PLAYING);
  }
};
