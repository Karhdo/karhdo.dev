/**
 * `POST /api/newsletter` (task 22): subscribe an email to the Buttondown newsletter. Thin adapter:
 * behaviour lives in `src/lib/newsletter/handler.ts`, the Buttondown client in `~/lib/services/buttondown`.
 *
 * - JSON `{ email, hp_url }` (the enhanced form) → JSON `{ status, message | error }` with 201/200/400/
 *   429/502/503 (503 when `BUTTONDOWN_API_KEY` is missing).
 * - A plain form post (no JS) → `303` to the on-demand `/newsletter?status=…&from=…` result page.
 * - `hp_url` is a honeypot: when filled, the answer looks like success and nothing is subscribed.
 * - Origin-checked like every state-changing route; GET (which v1 exported) → 405.
 */
import type { APIRoute } from 'astro';
import { handleNewsletterPost, redirectLocation } from '~/lib/newsletter/handler';
import { assertAllowedOrigin } from '~/lib/security/origin';
import { buttondown } from '~/lib/services/buttondown';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

function isFormPost(request: Request): boolean {
  const type = request.headers.get('content-type') ?? '';
  return type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
}

function clientIp(get: () => string): string | undefined {
  try {
    return get();
  } catch {
    return undefined; // not every adapter/runtime can tell
  }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const forbidden = assertAllowedOrigin(request);
  if (forbidden) return forbidden;

  const form = isFormPost(request);
  let input: unknown;
  try {
    input = form ? Object.fromEntries(await request.formData()) : await request.json();
  } catch {
    input = undefined; // malformed body → 400 from the schema
  }

  const result = await handleNewsletterPost(input, {
    client: buttondown,
    ipAddress: clientIp(() => clientAddress),
  });

  if (form) {
    const from = typeof input === 'object' && input !== null ? (input as Record<string, unknown>).from : undefined;
    return new Response(null, {
      status: 303,
      headers: { ...NO_STORE, Location: redirectLocation(result.status, from) },
    });
  }
  return Response.json(result.body, { status: result.http, headers: NO_STORE });
};

export const ALL: APIRoute = () =>
  Response.json({ error: 'Method Not Allowed' }, { status: 405, headers: { ...NO_STORE, Allow: 'POST' } });
