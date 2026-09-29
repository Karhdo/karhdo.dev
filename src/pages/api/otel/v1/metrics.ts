/**
 * `POST /api/otel/v1/metrics`: Claude Code's OpenTelemetry metrics export (OTLP/HTTP JSON) for the
 * Token burn card. Thin adapter over `src/lib/token-burn-ingest.ts`.
 */
import { TOKEN_BURN_INGEST_KEY } from 'astro:env/server';
import type { APIRoute } from 'astro';
import { addTokenBurnUsage } from '~/lib/db/token-burn';
import { handleOtlpIngest } from '~/lib/token-burn-ingest';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const { status, body } = await handleOtlpIngest(
    {
      authorization: request.headers.get('authorization'),
      contentType: request.headers.get('content-type'),
      body: await request.text(),
    },
    { key: TOKEN_BURN_INGEST_KEY, save: addTokenBurnUsage }
  );
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
};

/** Any other method → 405. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
