/**
 * URL parity check for a deployed (or locally served) v2 build.
 *
 *   bun scripts/verify-urls.ts <baseUrl> [--no-env] [--no-v1-sitemap]
 *
 * Requests every v1 URL plus the v2 endpoints and asserts the expected status or
 * redirect target. Also pulls the live v1 sitemap (https://karhdo.dev/sitemap.xml)
 * and asserts each of its paths returns 200. Exits 1 on any failure.
 *
 * `--no-env`: the target runs without env vars, so the DB- and GitHub-backed routes
 * are expected to answer with their designed 503 empty state instead of 200.
 */

export {};

type Check = {
  path: string;
  status: number | number[];
  location?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  contentType?: RegExp;
  bodyIncludes?: string;
};

const TAGS = ['application', 'database', 'design-patterns', 'javascript', 'nestjs', 'typescript'];
const POSTS = [
  'exploring-module-in-nestjs',
  'how-to-prevent-overbooking-in-sql-with-multiple-methods',
  'problems-when-the-application-develops',
];
const REDIRECT = [301, 308];
const noEnv = process.argv.includes('--no-env');
/** 200 with env vars; the designed 503 empty state without them. */
const LIVE = noEnv ? 503 : 200;

const CHECKS: Check[] = [
  // pages
  ...['/', '/blog', '/tags', '/projects', '/about'].map((path) => ({ path, status: 200, contentType: /text\/html/ })),
  ...POSTS.map((slug) => ({ path: `/blog/${slug}`, status: 200, contentType: /text\/html/ })),
  ...TAGS.map((tag) => ({ path: `/tags/${tag}`, status: 200, contentType: /text\/html/ })),
  // feeds, sitemap, robots
  { path: '/feed.xml', status: 200, contentType: /xml/ },
  ...TAGS.map((tag) => ({ path: `/tags/${tag}/feed.xml`, status: 200, contentType: /xml/ })),
  { path: '/robots.txt', status: 200, contentType: /text\/plain/ },
  { path: '/sitemap-index.xml', status: 200, contentType: /xml/ },
  { path: '/sitemap.xml', status: REDIRECT, location: '/sitemap-index.xml' },
  { path: '/blog/page/1', status: REDIRECT, location: '/blog' },
  // static assets referenced by v1 pages and posts
  ...[
    '/static/resume.pdf',
    '/static/favicons/tennis-racquet.png',
    '/static/images/avatar.jpg',
    '/static/images/blogs/global-module.png',
    '/static/images/blogs/module-in-nestjs.png',
    '/static/images/blogs/shared-module.png',
    '/static/images/experiences/qkit-logo.png',
    '/static/images/experiences/spartan-logo.jpeg',
    '/static/images/experiences/uit-logo.png',
    '/static/images/experiences/younetmedia-logo.png',
    '/static/images/projects/karhdo-blog.png',
  ].map((path) => ({ path, status: 200 })),
  // build artefacts
  ...POSTS.map((slug) => ({ path: `/og/${slug}.png`, status: 200, contentType: /image\/png/ })),
  { path: '/og/default.png', status: 200, contentType: /image\/png/ },
  { path: '/pagefind/pagefind.js', status: 200, contentType: /javascript/ },
  { path: '/static/giscus/tokyonight-day.css', status: 200, contentType: /text\/css/ },
  { path: '/static/giscus/tokyonight-night.css', status: 200, contentType: /text\/css/ },
  // on-demand API routes: 200, never 5xx
  { path: '/api/spotify', status: 200, contentType: /json/ },
  { path: '/api/github?repo=Karhdo/karhdo.dev', status: 200, contentType: /json/ },
  { path: '/api/github/activity', status: LIVE, contentType: /json/ },
  { path: '/api/stats?type=blog&slug=exploring-module-in-nestjs', status: LIVE, contentType: /json/ },
  { path: '/api/stats/summary', status: LIVE, contentType: /json/ },
  { path: '/api/token-burn', status: 200, contentType: /json/ },
  { path: '/api/stats?type=snippet&slug=x', status: 400 },
  {
    path: '/api/stats',
    method: 'POST',
    status: 403,
    headers: { Origin: 'https://evil.vercel.app', 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'blog', slug: 'exploring-module-in-nestjs', views: 1 }),
  },
  // 404s
  { path: '/dev/tokens', status: 404 },
  { path: '/blog/does-not-exist', status: 404, bodyIncludes: '<html' },
  { path: '/tags/does-not-exist', status: 404, bodyIncludes: '<html' },
  // trailing slash -> no-slash
  { path: '/blog/', status: REDIRECT, location: '/blog' },
  { path: '/about/', status: REDIRECT, location: '/about' },
  // Umami proxy rewrite
  { path: '/stats/script.js', status: 200, contentType: /javascript/ },
];

const base = process.argv[2]?.startsWith('http') ? process.argv[2].replace(/\/$/, '') : undefined;
const skipV1 = process.argv.includes('--no-v1-sitemap');
if (!base) {
  console.error('usage: bun scripts/verify-urls.ts <baseUrl> [--no-env] [--no-v1-sitemap]');
  process.exit(2);
}

async function v1SitemapPaths(): Promise<string[]> {
  const res = await fetch('https://karhdo.dev/sitemap.xml');
  if (!res.ok) throw new Error(`v1 sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? '/').pathname);
}

async function run(check: Check): Promise<string | null> {
  const res = await fetch(base + check.path, {
    method: check.method ?? 'GET',
    headers: check.headers,
    body: check.body,
    redirect: 'manual',
  });
  const expected = Array.isArray(check.status) ? check.status : [check.status];
  if (!expected.includes(res.status)) return `status ${res.status}, expected ${expected.join('|')}`;
  if (check.location) {
    const loc = res.headers.get('location') ?? '';
    const locPath = loc ? new URL(loc, base).pathname : '';
    if (locPath !== check.location) return `location "${loc}", expected ${check.location}`;
  }
  const type = res.headers.get('content-type') ?? '';
  if (check.contentType && !check.contentType.test(type)) return `content-type "${type}"`;
  if (check.bodyIncludes && !(await res.text()).includes(check.bodyIncludes)) return 'body mismatch';
  return null;
}

const checks = [...CHECKS];
if (!skipV1) {
  const seen = new Set(checks.map((c) => c.path));
  for (const path of await v1SitemapPaths()) {
    if (!seen.has(path)) checks.push({ path, status: 200 });
  }
}

let failed = 0;
for (const check of checks) {
  const label = `${check.method ?? 'GET'} ${check.path}`;
  let err: string | null;
  try {
    err = await run(check);
  } catch (e) {
    err = (e as Error).message;
  }
  if (err) failed++;
  console.log(`${err ? 'FAIL' : 'ok  '}  ${label}${err ? `  (${err})` : ''}`);
}
console.log(`\n${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
