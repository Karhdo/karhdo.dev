/** Shared pieces of the Now playing card and `/api/spotify`. Pure (no `astro:*`). */
import type { NowPlayingData } from '~/types/now-playing';

export const NOT_PLAYING: NowPlayingData = Object.freeze({ isPlaying: false });

/**
 * `/api/spotify` caching (00-overview cache-header rule): browsers always revalidate, while Vercel's CDN
 * keeps a copy for 30 s (+30 s stale-while-revalidate), so many visitors polling cost one upstream call.
 */
export const NOW_PLAYING_CACHE_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=30, stale-while-revalidate=30',
});
