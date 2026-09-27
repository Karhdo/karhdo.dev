/**
 * `GET /api/github/activity` (task 20): `{ total, streak, publicRepos, weeks: [{ days: [{ date, count,
 * level }] }] }` for the last 46 weeks, for the bento GitHub card. CDN-cached for an hour. Missing
 * token or upstream failure → 503 `{ message }` with a short cache; the card shows its empty state.
 */
import type { APIRoute } from 'astro';
import { fetchGithubActivity } from '~/lib/services/github';

export const prerender = false;

export const GET: APIRoute = async () => {
  const activity = await fetchGithubActivity();
  if (!activity) {
    return Response.json(
      { message: 'GitHub activity unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Vercel-CDN-Cache-Control': 'max-age=60' },
      }
    );
  }
  return Response.json(activity, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=3600, stale-while-revalidate=86400',
    },
  });
};
