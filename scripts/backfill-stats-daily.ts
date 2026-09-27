/**
 * One-off backfill of `stats_daily` from Umami (the only source with per-day history; `stats` has
 * totals only). Daily page views per blog post, UTC days, from `--since` (default 2023-12-01) up to
 * yesterday; today's live row is never touched. Dry run by default; `--apply` inserts with
 * `ON CONFLICT DO NOTHING` (existing days are never overwritten, `stats` is never touched).
 *
 *   bun scripts/backfill-stats-daily.ts [--since=2023-12-01] [--apply]
 *
 * Undo: DELETE FROM stats_daily WHERE date < '<first live day>';
 */
import postgres from 'postgres';
import { SITE } from '../src/config/site';

const UMAMI = new URL(SITE.analyticsURL).origin;
const SHARE_ID = new URL(SITE.analyticsURL).pathname.split('/')[2] ?? '';
const DAY_MS = 86_400_000;
const CHUNK_DAYS = 90;

const args = new Map<string, string | undefined>(
  process.argv.slice(2).map((a) => {
    const [key = '', value] = a.replace(/^--/, '').split('=');
    return [key, value];
  })
);
const apply = args.has('apply');
const since = args.get('since') ?? '2023-12-01';
const today = new Date().toISOString().slice(0, 10);
const dbUrl = process.env.POSTGRES_URL_DIRECT || process.env.POSTGRES_URL;
if (!dbUrl) throw new Error('Set POSTGRES_URL_DIRECT (or POSTGRES_URL).');

const share = (await (await fetch(`${UMAMI}/api/share/${SHARE_ID}`)).json()) as { websiteId: string; token: string };
const umami = async <T>(path: string, params: Record<string, string | number>): Promise<T> => {
  const url = `${UMAMI}/api/websites/${share.websiteId}/${path}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`;
  const res = await fetch(url, { headers: { 'x-umami-share-token': share.token } });
  if (!res.ok) throw new Error(`Umami ${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
};

/** Daily page views for one path, UTC days in [from, to), fetched in chunks. */
async function daily(path: string, from: string, to: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  for (
    let start = Date.parse(`${from}T00:00:00Z`);
    start < Date.parse(`${to}T00:00:00Z`);
    start += CHUNK_DAYS * DAY_MS
  ) {
    const end = Math.min(start + CHUNK_DAYS * DAY_MS, Date.parse(`${to}T00:00:00Z`)) - 1;
    const { pageviews } = await umami<{ pageviews: { x: string; y: number }[] }>('pageviews', {
      startAt: start,
      endAt: end,
      unit: 'day',
      timezone: 'UTC',
      path,
    });
    for (const { x, y } of pageviews) if (y > 0) out.set(x.slice(0, 10), (out.get(x.slice(0, 10)) ?? 0) + y);
  }
  return out;
}

const sql = postgres(dbUrl, { max: 1, prepare: false });
try {
  const posts = (await sql`SELECT slug, views FROM stats WHERE type = 'blog' ORDER BY slug`) as unknown as {
    slug: string;
    views: number;
  }[];
  const rows: { slug: string; date: string; views: number }[] = [];
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: Umami ${UMAMI}, UTC days ${since} → ${today} (exclusive)\n`);
  for (const { slug, views } of posts) {
    const days = new Map<string, number>();
    for (const path of [`/blog/${slug}`, `/blog/${slug}/`]) {
      for (const [date, n] of await daily(path, since, today)) days.set(date, (days.get(date) ?? 0) + n);
    }
    const dates = [...days.keys()].sort();
    const total = [...days.values()].reduce((a, b) => a + b, 0);
    console.log(
      `${slug}\n  ${days.size} days with views, ${total} views (stats counter: ${views}), ${dates[0] ?? '-'} → ${dates.at(-1) ?? '-'}`
    );
    for (const date of dates) rows.push({ slug, date, views: days.get(date) ?? 0 });
  }
  const [row] = await sql`SELECT count(*)::int AS existing FROM stats_daily WHERE date < ${today}`;
  const existing = Number(row?.existing ?? 0);
  console.log(
    `\n${rows.length} rows, ${rows.reduce((a, r) => a + r.views, 0)} views; stats_daily rows before today: ${existing}`
  );

  if (apply && rows.length) {
    const inserted = await sql`
      INSERT INTO stats_daily ${sql(rows.map((r) => ({ type: 'blog', slug: r.slug, date: r.date, views: r.views })))}
      ON CONFLICT (type, slug, date) DO NOTHING`;
    console.log(`inserted ${inserted.count} rows (existing days left untouched)`);
  } else if (!apply) {
    console.log('Nothing written. Re-run with --apply to insert.');
  }
} finally {
  await sql.end();
}
