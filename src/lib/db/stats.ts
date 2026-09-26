import { and, eq, sql } from 'drizzle-orm';
import { getDb } from './client';
import { type StatsRow, type StatsType, stats } from './schema';

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
