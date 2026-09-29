/**
 * `GET /api/token-burn`: personal Claude Code usage from `token_burn_daily`. On demand, CDN-cached;
 * no database or any failure is a 200 `{ available: false }`.
 */
import { POSTGRES_URL } from 'astro:env/server';
import type { APIRoute } from 'astro';
import { readTokenBurnSummary } from '~/lib/db/token-burn';
import { tokenBurnResponse } from '~/lib/token-burn';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { body, headers } = await tokenBurnResponse({
    load: async () => (POSTGRES_URL ? readTokenBurnSummary() : null),
  });
  return Response.json(body, { headers });
};

export const HEAD: APIRoute = GET;

/** Any other method → 405. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
