/**
 * `GET /api/stats/summary` (task 30): the homepage Blog stats card. A public, read-only aggregate over
 * the published posts, CDN-cached for 5 minutes (browsers always revalidate), so there is deliberately no Origin check (that stays
 * on the write endpoints). On demand only: nothing queries the DB at build time.
 */
import type { APIRoute } from 'astro';
import { getPublishedPosts, postUrl } from '~/lib/content';
import { DbNotConfiguredError } from '~/lib/db/client';
import { getBlogTotals, getDailyViews, getMostRead } from '~/lib/db/stats';
import { buildSummary, queryRange, unavailableSummary, utcDay } from '~/lib/stats/summary';

export const prerender = false;

// Browsers always revalidate (an `s-maxage`/SWR-only Cache-Control lets them serve stale data for the
// SWR window); the Vercel CDN alone caches for 5 minutes (00-overview cache-header rule).
const CACHED = {
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'Vercel-CDN-Cache-Control': 'max-age=300, stale-while-revalidate=600',
};
const UNCACHED = { 'Cache-Control': 'no-store' };

export const GET: APIRoute = async () => {
  const posts = (await getPublishedPosts()).map((post) => ({
    slug: post.id,
    title: post.data.title,
    url: postUrl(post),
  }));
  const slugs = posts.map((post) => post.slug);
  const today = utcDay();
  const { from, to } = queryRange(today);

  try {
    const [totals, mostRead, daily] = await Promise.all([
      getBlogTotals(slugs),
      getMostRead(slugs),
      getDailyViews(slugs, from, to),
    ]);
    return Response.json(buildSummary({ posts, totals, mostRead, daily, today }), { headers: CACHED });
  } catch (error) {
    if (error instanceof DbNotConfiguredError) {
      return Response.json(unavailableSummary(posts.length), { status: 503, headers: UNCACHED });
    }
    console.error('[api/stats/summary] query failed', error);
    return Response.json(unavailableSummary(posts.length), { status: 500, headers: UNCACHED });
  }
};

const methodNotAllowed: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
