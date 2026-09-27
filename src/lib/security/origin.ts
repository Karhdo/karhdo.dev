/**
 * Origin allow-list for state-changing API routes (tasks 18, 22, 30).
 *
 * Allowed: the production site (± www), local dev on :4321, and — only when running on Vercel —
 * this deployment's own `VERCEL_URL` / `VERCEL_BRANCH_URL`. There is deliberately no `*.vercel.app`
 * wildcard: any Vercel customer can host `https://evil.vercel.app`.
 */

export type OriginEnv = {
  /** `'1'` on Vercel (system env var). The VERCEL_* hosts are trusted only when this is set. */
  VERCEL?: string;
  /** Host of this deployment, e.g. `karhdo-dev-abc123-karhdo.vercel.app` (no scheme). */
  VERCEL_URL?: string;
  /** Host of this branch's stable preview URL (no scheme). */
  VERCEL_BRANCH_URL?: string;
  /** `astro dev`: any localhost port is accepted (4321 may be taken by another dev server). */
  DEV?: boolean;
};

const STATIC_ORIGINS = [
  'https://karhdo.dev',
  'https://www.karhdo.dev',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/** Canonical `scheme://host[:port]`, or `undefined` for `null`, opaque or malformed origins. */
function normalise(origin: string): string | undefined {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;
    // An Origin header never has a path; reject anything that isn't a bare origin.
    if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function vercelOrigin(host: string | undefined): string | undefined {
  const trimmed = host?.trim();
  return trimmed ? normalise(`https://${trimmed}`) : undefined;
}

/** Pure: is `origin` (an `Origin` header value) allowed under `env`? */
export function isAllowedOrigin(origin: string, env: OriginEnv = {}): boolean {
  const candidate = normalise(origin);
  if (!candidate) return false;
  if (STATIC_ORIGINS.includes(candidate)) return true;

  if (env.DEV) {
    const { protocol, hostname } = new URL(candidate);
    if (protocol === 'http:' && LOCAL_HOSTS.has(hostname)) return true;
  }

  if (env.VERCEL === '1') {
    for (const host of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) {
      if (vercelOrigin(host) === candidate) return true;
    }
  }
  return false;
}

/** Pure: request-level rule. A missing `Origin` header is tolerated for `GET`/`HEAD` only. */
export function isAllowedRequest(method: string, origin: string | null, env: OriginEnv = {}): boolean {
  if (origin === null) return method === 'GET' || method === 'HEAD';
  return isAllowedOrigin(origin, env);
}

function runtimeEnv(): OriginEnv {
  return {
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    DEV: import.meta.env?.DEV === true,
  };
}

/**
 * Returns a `403` JSON response when the request's origin is not allowed, otherwise `undefined`.
 * Usage: `const forbidden = assertAllowedOrigin(request); if (forbidden) return forbidden;`
 */
export function assertAllowedOrigin(request: Request, env: OriginEnv = runtimeEnv()): Response | undefined {
  if (isAllowedRequest(request.method, request.headers.get('origin'), env)) return undefined;
  return Response.json({ message: 'Forbidden origin!' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
}
