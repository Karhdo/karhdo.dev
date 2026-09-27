/**
 * `/api/stats` logic (pure: every side effect is injected), so `src/pages/api/stats.ts` stays a thin
 * adapter and `bun test` covers the behaviour with fakes.
 */
import type { Stats, StatsDeltas, StatsType } from '~/types/stats';
import { statsPostSchema, statsQuerySchema } from './schema';

export type StatsDeps = {
  getStats: (type: StatsType, slug: string) => Promise<Stats>;
  incrementStats: (type: StatsType, slug: string, deltas: StatsDeltas) => Promise<Stats>;
  recordDailyView: (type: StatsType, slug: string) => Promise<void>;
  isKnownSlug: (type: StatsType, slug: string) => boolean | Promise<boolean>;
  log?: Pick<Console, 'error' | 'warn'>;
};

export type HandlerResult = { status: number; body: Stats | { message: string } };

// v1 wording
const INVALID_QUERY = 'Missing or invalid `type` or `slug` parameter!';
const INVALID_BODY = 'Missing `type` or `slug` parameter!';
const INVALID_COUNTERS = 'Invalid counters: `views` must be 1 and reactions 1-5!';
const UNKNOWN_SLUG = 'Unknown `slug`!';
const INTERNAL = 'Internal Server Error!';
const UNAVAILABLE = 'Stats are unavailable: the database is not configured.';

/** Postgres `undefined_table`: `stats_daily` hasn't been created by the manual migration yet. */
const UNDEFINED_TABLE = '42P01';

/** Walks the `cause` chain (Drizzle wraps the postgres.js error in `DrizzleQueryError`). */
export function hasPgCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (typeof current === 'object' && (current as { code?: unknown }).code === code) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function isDbNotConfigured(error: unknown): boolean {
  return error instanceof Error && error.name === 'DbNotConfiguredError';
}

function failure(error: unknown, log: StatsDeps['log']): HandlerResult {
  if (isDbNotConfigured(error)) return { status: 503, body: { message: UNAVAILABLE } };
  log?.error('[api/stats]', error);
  return { status: 500, body: { message: INTERNAL } };
}

let warnedMissingDailyTable = false;

/** Test hook: the "missing stats_daily" warning is logged once per server instance. */
export function resetDailyViewWarning(): void {
  warnedMissingDailyTable = false;
}

/** Best-effort: never throws, never changes the response, never undoes the cumulative counter. */
async function recordDailyViewSafely(deps: StatsDeps, type: StatsType, slug: string): Promise<void> {
  try {
    await deps.recordDailyView(type, slug);
  } catch (error) {
    if (hasPgCode(error, UNDEFINED_TABLE)) {
      if (!warnedMissingDailyTable) {
        warnedMissingDailyTable = true;
        deps.log?.warn(
          '[api/stats] stats_daily does not exist (42P01); skipping daily views until 0001_create_stats_daily.sql runs.'
        );
      }
      return;
    }
    deps.log?.error('[api/stats] daily view upsert failed', error);
  }
}

export async function handleStatsGet(query: Record<string, unknown>, deps: StatsDeps): Promise<HandlerResult> {
  const parsed = statsQuerySchema.safeParse(query);
  if (!parsed.success) return { status: 400, body: { message: INVALID_QUERY } };
  const { type, slug } = parsed.data;

  try {
    if (!(await deps.isKnownSlug(type, slug))) return { status: 400, body: { message: UNKNOWN_SLUG } };
    return { status: 200, body: await deps.getStats(type, slug) };
  } catch (error) {
    return failure(error, deps.log);
  }
}

export async function handleStatsPost(body: unknown, deps: StatsDeps): Promise<HandlerResult> {
  const parsed = statsPostSchema.safeParse(body);
  if (!parsed.success) {
    const idOk =
      typeof body === 'object' &&
      body !== null &&
      !parsed.error.issues.some((i) => ['type', 'slug'].includes(String(i.path[0])));
    return { status: 400, body: { message: idOk ? INVALID_COUNTERS : INVALID_BODY } };
  }
  const { type, slug, ...deltas } = parsed.data;

  try {
    if (!(await deps.isKnownSlug(type, slug))) return { status: 400, body: { message: UNKNOWN_SLUG } };
    const row = await deps.incrementStats(type, slug, deltas);
    if (deltas.views) await recordDailyViewSafely(deps, type, slug);
    return { status: 200, body: row };
  } catch (error) {
    return failure(error, deps.log);
  }
}
