/**
 * `GET /api/token-burn`: personal Claude Code usage from the private `Karhdo/token-burn` summary.
 * On demand, CDN-cached; missing config or any upstream failure is a 200 `{ available: false }`.
 */
import { GITHUB_API_TOKEN, TOKEN_BURN_SUMMARY_URL } from 'astro:env/server';
import type { APIRoute } from 'astro';
import { tokenBurnResponse } from '~/lib/token-burn';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { body, headers } = await tokenBurnResponse({
    url: TOKEN_BURN_SUMMARY_URL,
    token: GITHUB_API_TOKEN,
    fetch: (input, init) => fetch(input, init),
  });
  return Response.json(body, { headers });
};

export const HEAD: APIRoute = GET;

/** Any other method → 405. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
