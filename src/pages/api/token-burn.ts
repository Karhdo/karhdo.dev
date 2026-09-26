/**
 * `GET /api/token-burn` (task 31): Anthropic Usage & Cost Admin API → Token burn card. On demand only
 * (never at build), CDN-cached; a missing key or any upstream failure is a 200 `{ available: false }`.
 * The Admin key stays on the server: only the aggregated numbers are returned.
 */

import { ANTHROPIC_ADMIN_API_KEY } from 'astro:env/server';
import type { APIRoute } from 'astro';
import { tokenBurnResponse } from '~/lib/anthropic-usage';

export const prerender = false;

/**
 * Dev-only upstream override for local verification against a stub server (never in a build:
 * `import.meta.env.DEV` is statically `false` there, so the branch is dropped).
 */
const devUpstream = import.meta.env.DEV ? process.env.TOKEN_BURN_DEV_UPSTREAM : undefined;

export const GET: APIRoute = async () => {
  const { body, headers } = await tokenBurnResponse({
    apiKey: ANTHROPIC_ADMIN_API_KEY,
    fetch: (input, init) => fetch(input, init),
    baseUrl: devUpstream || undefined,
  });
  return Response.json(body, { headers });
};

export const HEAD: APIRoute = GET;

/** Any other method → 405. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
