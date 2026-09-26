/**
 * Anthropic Usage & Cost Admin API → Token burn card payload (task 31).
 *
 * Pure apart from the injected `fetch`; never imports `astro:*`, so `bun test` covers it with fixtures.
 * Days are UTC buckets (`bucket_width=1d` snaps to UTC midnight), and the card labels them UTC.
 * Only API-key usage of the organization is reported (no Pro/Max subscription or claude.ai usage).
 *
 * Docs (checked 2026-09-26): `GET /v1/organizations/usage_report/messages` and
 * `GET /v1/organizations/cost_report`; headers `x-api-key` (Admin key) + `anthropic-version: 2023-06-01`;
 * `limit` ≤ 31 for `1d`; `has_more` / `next_page` → `page`; cost `amount` is a decimal string in cents.
 */

export { barHeights, countParts, formatTokens, formatUsd } from './anthropic-usage-format';

export const ANTHROPIC_API_BASE = 'https://api.anthropic.com';
export const ANTHROPIC_VERSION = '2023-06-01';
export const USAGE_PATH = '/v1/organizations/usage_report/messages';
export const COST_PATH = '/v1/organizations/cost_report';
export const UPSTREAM_TIMEOUT_MS = 6000;
export const MAX_PAGES = 5;
export const DAYS = 14;
export const USER_AGENT = 'karhdo.dev/2 (+https://karhdo.dev)';

const DAY_MS = 86_400_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Upstream failure. Carries only a kind and HTTP status, never the response body or the key. */
export class UsageApiError extends Error {
  readonly kind: 'http' | 'network' | 'parse';
  readonly status?: number;

  constructor(kind: 'http' | 'network' | 'parse', message: string, status?: number) {
    super(message);
    this.name = 'UsageApiError';
    this.kind = kind;
    this.status = status;
  }
}

// ---------- Upstream shapes (only the fields we read) ----------

export type UsageResult = {
  uncached_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null;
  cache_read_input_tokens?: number | null;
  output_tokens?: number | null;
};

export type CostResult = { amount?: string | number | null; currency?: string | null };

export type Bucket<R> = { starting_at: string; ending_at?: string; results?: R[] | null };

type Page<R> = { data?: Bucket<R>[]; has_more?: boolean; next_page?: string | null };

// ---------- Payload ----------

export type Split = { cache: number; input: number; output: number };
export type DayTokens = { cache: number; input: number; output: number; total: number };

export type TokenBurnData = {
  available: true;
  timezone: 'UTC';
  generatedAt: string;
  today: { date: string; tokens: number; costUsd: number };
  days: { date: string; tokens: number }[];
  month: { tokens: number; costUsd: number };
  split: Split;
};

export type TokenBurnUnavailable = { available: false; reason: 'not-configured' | 'upstream' };
export type TokenBurnResponse = TokenBurnData | TokenBurnUnavailable;

// ---------- Dates ----------

const startOfUtcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const dateKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** The query window: month-to-date or the last 14 days, whichever starts earlier (≤ 31 daily buckets). */
export function usageWindow(now: Date) {
  const today = startOfUtcDay(now);
  const month = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const start = Math.min(month, today - (DAYS - 1) * DAY_MS);
  return {
    startingAt: new Date(start).toISOString(),
    endingAt: new Date(today + DAY_MS).toISOString(),
    todayKey: dateKey(today),
    monthKey: dateKey(month),
  };
}

// ---------- Fetch ----------

export type Logger = { error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };

type FetchOptions = { apiKey: string; fetch: FetchLike; signal?: AbortSignal; maxPages?: number; log?: Logger };

/** GETs every page (`has_more` → `next_page`), capped at `maxPages`, and returns the merged buckets. */
export async function fetchAllPages<R>(
  url: string,
  params: Record<string, string>,
  { apiKey, fetch, signal, maxPages = MAX_PAGES, log = console }: FetchOptions
): Promise<Bucket<R>[]> {
  const buckets: Bucket<R>[] = [];
  let page: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const query = new URLSearchParams({ ...params, bucket_width: '1d', limit: '31' });
    if (page) query.set('page', page);
    let response: Response;
    try {
      response = await fetch(`${url}?${query}`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          accept: 'application/json',
          'user-agent': USER_AGENT,
        },
        signal,
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : 'Error';
      throw new UsageApiError('network', `request failed (${name})`);
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new UsageApiError('http', `upstream responded ${response.status}`, response.status);
    }
    let body: Page<R>;
    try {
      body = (await response.json()) as Page<R>;
    } catch {
      throw new UsageApiError('parse', 'invalid JSON');
    }
    if (!body || !Array.isArray(body.data)) throw new UsageApiError('parse', 'missing data array');
    buckets.push(...body.data);
    if (!body.has_more || !body.next_page) return buckets;
    page = body.next_page;
  }
  log.warn(`[token-burn] page cap (${maxPages}) reached with has_more still true; results truncated`);
  return buckets;
}

// ---------- Aggregation ----------

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

function bucketKey(startingAt: string): string | undefined {
  const ms = Date.parse(startingAt);
  return Number.isNaN(ms) ? undefined : dateKey(ms);
}

/** Per UTC day: cache = 5m + 1h cache writes + cache reads, input = uncached input, output = output. */
export function aggregateUsage(buckets: readonly Bucket<UsageResult>[]): Map<string, DayTokens> {
  const days = new Map<string, DayTokens>();
  for (const bucket of buckets) {
    const key = bucketKey(bucket.starting_at);
    if (!key) continue;
    const day = days.get(key) ?? { cache: 0, input: 0, output: 0, total: 0 };
    for (const r of bucket.results ?? []) {
      const cache =
        num(r.cache_creation?.ephemeral_5m_input_tokens) +
        num(r.cache_creation?.ephemeral_1h_input_tokens) +
        num(r.cache_read_input_tokens);
      const input = num(r.uncached_input_tokens);
      const output = num(r.output_tokens);
      day.cache += cache;
      day.input += input;
      day.output += output;
      day.total += cache + input + output;
    }
    days.set(key, day);
  }
  return days;
}

/** Per UTC day: USD cost (`amount` is a decimal string in cents: `"412.00"` → 4.12). Non-USD rows are skipped. */
export function aggregateCost(buckets: readonly Bucket<CostResult>[]): Map<string, number> {
  const days = new Map<string, number>();
  for (const bucket of buckets) {
    const key = bucketKey(bucket.starting_at);
    if (!key) continue;
    let usd = days.get(key) ?? 0;
    for (const r of bucket.results ?? []) {
      if ((r.currency ?? 'USD') !== 'USD') continue;
      const cents = Number(r.amount);
      if (Number.isFinite(cents)) usd += cents / 100;
    }
    days.set(key, usd);
  }
  return days;
}

const cents = (usd: number) => Math.round(usd * 100) / 100;

/** Integer percentages summing to exactly 100 (largest remainder); all 0 when the total is 0. */
export function splitPercent({ cache, input, output }: Omit<DayTokens, 'total'>): Split {
  const values = [cache, input, output];
  const total = cache + input + output;
  if (total <= 0) return { cache: 0, input: 0, output: 0 };
  const exact = values.map((v) => (v / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    left--;
  }
  const [c = 0, n = 0, o = 0] = floors;
  return { cache: c, input: n, output: o };
}

/** Builds the endpoint payload: 14 zero-filled UTC days ending today, today, month-to-date and its split. */
export function buildTokenBurn({
  usage,
  cost,
  now,
}: {
  usage: Map<string, DayTokens>;
  cost: Map<string, number>;
  now: Date;
}): TokenBurnData {
  const { todayKey, monthKey } = usageWindow(now);
  const today = startOfUtcDay(now);
  const days = Array.from({ length: DAYS }, (_, i) => {
    const date = dateKey(today - (DAYS - 1 - i) * DAY_MS);
    return { date, tokens: usage.get(date)?.total ?? 0 };
  });

  const month = { cache: 0, input: 0, output: 0, total: 0 };
  for (const [key, day] of usage) {
    if (key < monthKey || key > todayKey) continue;
    month.cache += day.cache;
    month.input += day.input;
    month.output += day.output;
    month.total += day.total;
  }
  let monthUsd = 0;
  for (const [key, usd] of cost) if (key >= monthKey && key <= todayKey) monthUsd += usd;

  return {
    available: true,
    timezone: 'UTC',
    generatedAt: now.toISOString(),
    today: { date: todayKey, tokens: usage.get(todayKey)?.total ?? 0, costUsd: cents(cost.get(todayKey) ?? 0) },
    days,
    month: { tokens: month.total, costUsd: cents(monthUsd) },
    split: splitPercent(month),
  };
}

/** Fetches usage and cost in parallel (each capped at 6 s) and builds the payload. Throws `UsageApiError`. */
export async function getTokenBurn({
  apiKey,
  now = new Date(),
  fetch,
  baseUrl = ANTHROPIC_API_BASE,
  timeoutMs = UPSTREAM_TIMEOUT_MS,
  log = console,
}: {
  apiKey: string;
  now?: Date;
  fetch: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  log?: Logger;
}): Promise<TokenBurnData> {
  const { startingAt, endingAt } = usageWindow(now);
  const params = { starting_at: startingAt, ending_at: endingAt };
  const [usage, cost] = await Promise.all([
    fetchAllPages<UsageResult>(`${baseUrl}${USAGE_PATH}`, params, {
      apiKey,
      fetch,
      log,
      signal: AbortSignal.timeout(timeoutMs),
    }),
    fetchAllPages<CostResult>(`${baseUrl}${COST_PATH}`, params, {
      apiKey,
      fetch,
      log,
      signal: AbortSignal.timeout(timeoutMs),
    }),
  ]);
  return buildTokenBurn({ usage: aggregateUsage(usage), cost: aggregateCost(cost), now });
}

// ---------- Endpoint mapping ----------

/**
 * Browsers always revalidate (never show stale numbers from their own cache); only Vercel's CDN caches,
 * via `Vercel-CDN-Cache-Control` (which Vercel strips before the response reaches the browser).
 */
const BROWSER_CACHE = 'public, max-age=0, must-revalidate';
export const HEADERS_OK: Readonly<Record<string, string>> = {
  'Cache-Control': BROWSER_CACHE,
  'Vercel-CDN-Cache-Control': 'max-age=900, stale-while-revalidate=3600',
};
export const HEADERS_UNAVAILABLE: Readonly<Record<string, string>> = {
  'Cache-Control': BROWSER_CACHE,
  'Vercel-CDN-Cache-Control': 'max-age=120, stale-while-revalidate=120',
};

/**
 * `GET /api/token-burn` body + cache headers. Never throws: a missing key → `not-configured`, any upstream,
 * timeout or parse failure → `upstream` (logged server-side without the key or the upstream body).
 */
export async function tokenBurnResponse({
  apiKey,
  fetch,
  now,
  baseUrl,
  log = console,
}: {
  apiKey: string | undefined;
  fetch: FetchLike;
  now?: Date;
  baseUrl?: string;
  log?: Logger;
}): Promise<{ body: TokenBurnResponse; headers: Record<string, string> }> {
  if (!apiKey) return { body: { available: false, reason: 'not-configured' }, headers: { ...HEADERS_UNAVAILABLE } };
  try {
    return { body: await getTokenBurn({ apiKey, fetch, now, baseUrl, log }), headers: { ...HEADERS_OK } };
  } catch (error) {
    const detail =
      error instanceof UsageApiError
        ? `${error.kind}${error.status ? ` ${error.status}` : ''}: ${error.message}`
        : error instanceof Error
          ? error.name
          : 'unknown';
    log.error(`[token-burn] upstream unavailable (${detail})`);
    return { body: { available: false, reason: 'upstream' }, headers: { ...HEADERS_UNAVAILABLE } };
  }
}
