/**
 * Last.fm service: `user.getRecentTracks` for the Now playing card, wired to `astro:env`.
 * Resolves to `null` when `LASTFM_API_KEY` or `LASTFM_USERNAME` is not set (the route then uses Spotify).
 */
import { LASTFM_API_KEY, LASTFM_USERNAME } from 'astro:env/server';
import { recentTracksUrl } from '~/lib/lastfm/recent-tracks';
import { UPSTREAM_TIMEOUT_MS } from '~/lib/spotify/client';

export async function getLastfmRecentTracks(): Promise<Response | null> {
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) return null;
  return fetch(recentTracksUrl(LASTFM_USERNAME, LASTFM_API_KEY), {
    headers: { Accept: 'application/json', 'User-Agent': 'karhdo.dev (+https://karhdo.dev)' },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
}
