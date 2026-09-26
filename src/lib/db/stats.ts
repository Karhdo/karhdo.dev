import { and, between, desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb } from './client';
import { type StatsRow, type StatsType, stats, statsDaily } from './schema';

export const REACTION_KEYS = ['loves', 'applauses', 'ideas', 'bullseye'] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export const COUNTER_KEYS = ['views', ...REACTION_KEYS] as const;
export type CounterKey = (typeof COUNTER_KEYS)[number];
export type StatsDeltas = Partial<Record<CounterKey, number>>;

function emptyStats(type: StatsType, slug: string): StatsRow {
  return { type, slug, views: 0, loves: 0, applauses: 0, ideas: 0, bullseye: 0 };
}

/** Reads one row. Returns a zero-filled object when the row does not exist (never inserts). */
export async function getStats(type: StatsType, slug: string): Promise<StatsRow> {
  const rows = await getDb()
    .select()
    .from(stats)
    .where(and(eq(stats.type, type), eq(stats.slug, slug)))
    .limit(1);
  return rows[0] ?? emptyStats(type, slug);
}

/**
 * Atomically adds `deltas` to the row (creating it when missing) in a single
 * `INSERT … ON CONFLICT (type, slug) DO UPDATE SET col = stats.col + delta`.
 * Only the columns present in `deltas` are updated.
 */
export async function incrementStats(type: StatsType, slug: string, deltas: StatsDeltas): Promise<StatsRow> {
  const keys = COUNTER_KEYS.filter((key) => deltas[key] !== undefined);
  if (keys.length === 0) return getStats(type, slug);

  const values: Partial<Record<CounterKey, number>> = {};
  const set: Partial<Record<CounterKey, ReturnType<typeof sql>>> = {};
  for (const key of keys) {
    const delta = deltas[key] as number;
    values[key] = delta;
    set[key] = sql`${stats[key]} + ${delta}`;
  }

  const rows = await getDb()
    .insert(stats)
    .values({ type, slug, ...values })
    .onConflictDoUpdate({ target: [stats.type, stats.slug], set })
    .returning();
  return rows[0] ?? emptyStats(type, slug);
}

/**
 * Adds one view to today's (UTC) `stats_daily` row, creating it when missing, in a single
 * `INSERT … ON CONFLICT (type, slug, date) DO UPDATE SET views = stats_daily.views + 1`.
 * Callers treat it as best-effort: it throws `42P01` until `0001_create_stats_daily.sql` has run.
 */
export async function recordDailyView(type: StatsType, slug: string): Promise<void> {
  await getDb()
    .insert(statsDaily)
    .values({ type, slug, date: sql`(now() AT TIME ZONE 'utc')::date`, views: 1 })
    .onConflictDoUpdate({
      target: [statsDaily.type, statsDaily.slug, statsDaily.date],
      set: { views: sql`${statsDaily.views} + 1` },
    });
}

// ---------- Blog stats summary (task 30) ----------

export type BlogTotals = Record<CounterKey, number>;

/** Sums the counters of the given blog slugs (published posts only, so junk rows never count). `null` → 0. */
export async function getBlogTotals(slugs: readonly string[]): Promise<BlogTotals> {
  const zero: BlogTotals = { views: 0, loves: 0, applauses: 0, ideas: 0, bullseye: 0 };
  if (slugs.length === 0) return zero;
  const sum = (column: (typeof stats)[CounterKey]) => sql<number>`coalesce(sum(${column}), 0)::int`;
  const rows = await getDb()
    .select({
      views: sum(stats.views),
      loves: sum(stats.loves),
      applauses: sum(stats.applauses),
      ideas: sum(stats.ideas),
      bullseye: sum(stats.bullseye),
    })
    .from(stats)
    .where(and(eq(stats.type, 'blog'), inArray(stats.slug, [...slugs])));
  const row = rows[0];
  if (!row) return zero;
  return {
    views: Number(row.views),
    loves: Number(row.loves),
    applauses: Number(row.applauses),
    ideas: Number(row.ideas),
    bullseye: Number(row.bullseye),
  };
}

/** The most-viewed of the given blog slugs, or `null` when none has a row. */
export async function getMostRead(slugs: readonly string[]): Promise<{ slug: string; views: number } | null> {
  if (slugs.length === 0) return null;
  const rows = await getDb()
    .select({ slug: stats.slug, views: stats.views })
    .from(stats)
    .where(and(eq(stats.type, 'blog'), inArray(stats.slug, [...slugs])))
    .orderBy(desc(stats.views), stats.slug)
    .limit(1);
  return rows[0] ?? null;
}

export type DailyViews = { date: string; views: number };

/** Postgres `undefined_table`; drizzle wraps driver errors, so the code may sit on `cause`. */
function isUndefinedTable(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 3; e = (e as { cause?: unknown }).cause, depth++) {
    if ((e as { code?: unknown }).code === '42P01') return true;
  }
  return false;
}

/**
 * Daily blog views (summed over the given slugs) for the UTC days `fromDate`..`toDate` (`YYYY-MM-DD`,
 * inclusive), ordered by date; days without rows are absent. Returns `[]` while `stats_daily` doesn't
 * exist yet (`42P01`, before `0001_create_stats_daily.sql` has run).
 */
export async function getDailyViews(slugs: readonly string[], fromDate: string, toDate: string): Promise<DailyViews[]> {
  if (slugs.length === 0) return [];
  try {
    const rows = await getDb()
      .select({ date: statsDaily.date, views: sql<number>`sum(${statsDaily.views})::int` })
      .from(statsDaily)
      .where(
        and(
          eq(statsDaily.type, 'blog'),
          inArray(statsDaily.slug, [...slugs]),
          between(statsDaily.date, fromDate, toDate)
        )
      )
      .groupBy(statsDaily.date)
      .orderBy(statsDaily.date);
    return rows.map((row) => ({ date: row.date, views: Number(row.views) }));
  } catch (error) {
    if (isUndefinedTable(error)) return [];
    throw error;
  }
}
