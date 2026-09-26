/**
 * `GET /api/stats?type=blog&slug=…` and `POST /api/stats` (task 18). Thin adapter: validation and
 * behaviour live in `src/lib/stats/handler.ts`; the DB functions are injected here.
 */
import type { APIRoute } from 'astro';
import { getPublishedPosts } from '~/lib/content';
import { getStats, incrementStats, recordDailyView } from '~/lib/db/stats';
import { assertAllowedOrigin } from '~/lib/security/origin';
import { type HandlerResult, handleStatsGet, handleStatsPost, type StatsDeps } from '~/lib/stats/handler';

export const prerender = false;

let knownSlugs: Promise<Set<string>> | undefined;

const deps: StatsDeps = {
  getStats,
  incrementStats,
  recordDailyView,
  // Only real posts get rows, so nobody can create junk `stats` rows.
  isKnownSlug: async (type, slug) => {
    knownSlugs ??= getPublishedPosts()
      .then((posts) => new Set(posts.map((post) => post.id)))
      .catch((error) => {
        knownSlugs = undefined; // don't cache a failure; retry on the next request
        throw error;
      });
    return type === 'blog' && (await knownSlugs).has(slug);
  },
  log: console,
};

function respond({ status, body }: HandlerResult): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export const GET: APIRoute = async ({ request, url }) => {
  const forbidden = assertAllowedOrigin(request);
  if (forbidden) return forbidden;
  return respond(await handleStatsGet(Object.fromEntries(url.searchParams), deps));
};

export const POST: APIRoute = async ({ request }) => {
  const forbidden = assertAllowedOrigin(request);
  if (forbidden) return forbidden;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined; // malformed JSON → 400 from the schema
  }
  return respond(await handleStatsPost(body, deps));
};
