/**
 * Stats types, re-exported from their single sources: the Drizzle schema (`"StatsType"` enum, the
 * `stats` row) and the counter keys in `src/lib/db/stats.ts`. Type-only, so importing this never
 * loads the DB client.
 */

/** A row of the existing `stats` table (v1 Prisma `Stats` model). */
export type { StatsRow as Stats, StatsType } from '~/lib/db/schema';
export type { CounterKey, ReactionKey, StatsDeltas } from '~/lib/db/stats';
