/**
 * Token burn card data: personal Claude Code usage (days in Asia/Ho_Chi_Minh), stored per day and
 * model in `token_burn_daily` from Claude Code's OpenTelemetry export. Pure apart from the injected
 * loader, so `bun test` covers it with a fixture.
 */
import { addDays, todayIn } from '~/lib/github-activity';

export { barHeights, countParts, formatTokens, formatUsd } from './token-burn-format';

export const DAYS = 14;
export const MAX_MODELS = 3;
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';

export type Logger = { error: (...args: unknown[]) => void };

type Totals = { tokens?: number; cost?: number };
type SummaryDay = Totals & { date: string; byModel?: Record<string, Totals> };
export type Summary = { lastActivity?: string | null; allTime?: Totals; daily?: SummaryDay[] };

export type TokenBurnData = {
  available: true;
  source: 'claude-code';
  timezone: typeof TIME_ZONE;
  lastActivity: string | null;
  today: { date: string; tokens: number; costUsd: number };
  days: { date: string; tokens: number }[];
  month: { tokens: number; costUsd: number };
  allTime: { tokens: number; costUsd: number };
  /** Month-to-date share per model (%), biggest first; the rest folded into `other`. */
  models: { model: string; share: number }[];
};
export type TokenBurnUnavailable = { available: false; reason: 'not-configured' | 'upstream' };
export type TokenBurnResponse = TokenBurnData | TokenBurnUnavailable;

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : 0);
const money = (n: number) => Math.round(n * 100) / 100;

/** `claude-haiku-4-5-20251001` → `haiku-4-5`. */
export function modelLabel(model: string): string {
  return model.replace(/^claude-/, '').replace(/-\d{8}$/, '');
}

/** Largest-remainder rounding, so shares always add up to 100. */
function percentages(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => 0);
  const raw = values.map((v) => (v / total) * 100);
  const floored = raw.map(Math.floor);
  let left = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (left-- <= 0) break;
    floored[i] = (floored[i] ?? 0) + 1;
  }
  return floored;
}

export function buildTokenBurn(summary: Summary, now: Date = new Date()): TokenBurnData {
  const daily = new Map((summary.daily ?? []).map((d) => [d.date, d]));
  const today = todayIn(TIME_ZONE, now);
  const monthPrefix = today.slice(0, 7);
  const monthDays = [...daily.values()].filter((d) => d.date.startsWith(monthPrefix) && d.date <= today);

  const byModel = new Map<string, number>();
  for (const d of monthDays) {
    for (const [model, t] of Object.entries(d.byModel ?? {})) {
      const label = modelLabel(model);
      byModel.set(label, (byModel.get(label) ?? 0) + num(t.tokens));
    }
  }
  const ranked = [...byModel.entries()].filter(([, t]) => t > 0).sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, MAX_MODELS);
  const rest = ranked.slice(MAX_MODELS).reduce((sum, [, t]) => sum + t, 0);
  const entries = rest > 0 ? [...top, ['other', rest] as [string, number]] : top;
  const shares = percentages(entries.map(([, t]) => t));

  const todayRow = daily.get(today);
  return {
    available: true,
    source: 'claude-code',
    timezone: TIME_ZONE,
    lastActivity: summary.lastActivity ?? null,
    today: { date: today, tokens: num(todayRow?.tokens), costUsd: money(num(todayRow?.cost)) },
    days: Array.from({ length: DAYS }, (_, i) => {
      const date = addDays(today, i - (DAYS - 1));
      return { date, tokens: num(daily.get(date)?.tokens) };
    }),
    month: {
      tokens: monthDays.reduce((sum, d) => sum + num(d.tokens), 0),
      costUsd: money(monthDays.reduce((sum, d) => sum + num(d.cost), 0)),
    },
    allTime: { tokens: num(summary.allTime?.tokens), costUsd: money(num(summary.allTime?.cost)) },
    models: entries.map(([model], i) => ({ model, share: shares[i] ?? 0 })),
  };
}

/** Browsers always revalidate; only Vercel's CDN caches (usage arrives about once a minute). */
const BROWSER_CACHE = 'public, max-age=0, must-revalidate';
export const HEADERS_OK: Readonly<Record<string, string>> = {
  'Cache-Control': BROWSER_CACHE,
  'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=300',
};
export const HEADERS_UNAVAILABLE: Readonly<Record<string, string>> = {
  'Cache-Control': BROWSER_CACHE,
  'Vercel-CDN-Cache-Control': 'max-age=60, stale-while-revalidate=120',
};

/**
 * `GET /api/token-burn` body + headers. `load` returns `null` when storage is not configured.
 * Never throws; failures are logged without details from the store.
 */
export async function tokenBurnResponse({
  load,
  now,
  log = console,
}: {
  load: () => Promise<Summary | null>;
  now?: Date;
  log?: Logger;
}): Promise<{ body: TokenBurnResponse; headers: Record<string, string> }> {
  try {
    const summary = await load();
    if (!summary) return { body: { available: false, reason: 'not-configured' }, headers: { ...HEADERS_UNAVAILABLE } };
    return { body: buildTokenBurn(summary, now), headers: { ...HEADERS_OK } };
  } catch (error) {
    log.error(`[token-burn] unavailable (${error instanceof Error ? error.name : 'unknown'})`);
    return { body: { available: false, reason: 'upstream' }, headers: { ...HEADERS_UNAVAILABLE } };
  }
}
