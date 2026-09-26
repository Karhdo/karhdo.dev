import { describe, expect, test } from 'bun:test';
import cost from './__fixtures__/cost-report.json';
import page1 from './__fixtures__/usage-report.page1.json';
import page2 from './__fixtures__/usage-report.page2.json';
import {
  aggregateCost,
  aggregateUsage,
  barHeights,
  buildTokenBurn,
  COST_PATH,
  countParts,
  fetchAllPages,
  formatTokens,
  formatUsd,
  getTokenBurn,
  HEADERS_OK,
  HEADERS_UNAVAILABLE,
  splitPercent,
  tokenBurnResponse,
  USAGE_PATH,
  UsageApiError,
  usageWindow,
} from './anthropic-usage';

const NOW = new Date('2026-10-05T09:30:00Z');
const KEY = 'test-admin-key';
const silent = { error: () => {}, warn: () => {} };

type Call = { url: URL; headers: Headers };

/** Fake upstream serving the fixtures; records every request. */
function fixtureFetch(calls: Call[] = []) {
  return async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    calls.push({ url, headers: new Headers(init?.headers) });
    if (url.pathname === USAGE_PATH) return Response.json(url.searchParams.get('page') ? page2 : page1);
    if (url.pathname === COST_PATH) return Response.json(cost);
    return new Response('not found', { status: 404 });
  };
}

describe('usageWindow', () => {
  test('on the 1st: last 14 days (crosses into the previous month)', () => {
    const w = usageWindow(new Date('2026-10-01T23:59:59Z'));
    expect(w).toEqual({
      startingAt: '2026-09-18T00:00:00.000Z',
      endingAt: '2026-10-02T00:00:00.000Z',
      todayKey: '2026-10-01',
      monthKey: '2026-10-01',
    });
  });

  test('on the 15th: month start is later than 13 days back', () => {
    const w = usageWindow(new Date('2026-09-15T00:00:00Z'));
    expect(w.startingAt).toBe('2026-09-01T00:00:00.000Z');
    expect(w.endingAt).toBe('2026-09-16T00:00:00.000Z');
  });

  test('on the 31st: month-to-date is exactly 31 buckets', () => {
    const w = usageWindow(new Date('2026-12-31T12:00:00Z'));
    expect(w.startingAt).toBe('2026-12-01T00:00:00.000Z');
    const buckets = (Date.parse(w.endingAt) - Date.parse(w.startingAt)) / 86_400_000;
    expect(buckets).toBe(31);
  });

  test('never more than 31 buckets across a year', () => {
    for (let d = Date.UTC(2026, 0, 1); d < Date.UTC(2027, 0, 1); d += 86_400_000) {
      const w = usageWindow(new Date(d + 3_600_000));
      const buckets = (Date.parse(w.endingAt) - Date.parse(w.startingAt)) / 86_400_000;
      expect(buckets).toBeGreaterThanOrEqual(14);
      expect(buckets).toBeLessThanOrEqual(31);
    }
  });
});

describe('fetchAllPages', () => {
  test('sends the Admin headers and query, then follows next_page', async () => {
    const calls: Call[] = [];
    const buckets = await fetchAllPages(
      `https://api.test${USAGE_PATH}`,
      { starting_at: 'x' },
      {
        apiKey: KEY,
        fetch: fixtureFetch(calls),
        log: { error: () => {}, warn: () => expect.unreachable('no cap warning for 2 pages') },
      }
    );
    expect(buckets).toHaveLength(page1.data.length + page2.data.length);
    expect(calls).toHaveLength(2);
    const [first, second] = calls;
    expect(first?.headers.get('x-api-key')).toBe(KEY);
    expect(first?.headers.get('anthropic-version')).toBe('2023-06-01');
    expect(first?.headers.get('user-agent')).toBe('karhdo.dev/2 (+https://karhdo.dev)');
    expect(first?.url.searchParams.get('bucket_width')).toBe('1d');
    expect(first?.url.searchParams.get('limit')).toBe('31');
    expect(first?.url.searchParams.get('starting_at')).toBe('x');
    expect(first?.url.searchParams.has('page')).toBe(false);
    expect(second?.url.searchParams.get('page')).toBe(page1.next_page);
  });

  test('stops at the page cap when has_more never ends', async () => {
    let n = 0;
    const endless = async () => {
      n++;
      return Response.json({
        data: [{ starting_at: '2026-10-05T00:00:00Z', results: [] }],
        has_more: true,
        next_page: `p${n}`,
      });
    };
    const warned: unknown[] = [];
    const log = { error: () => {}, warn: (...args: unknown[]) => warned.push(...args) };
    const buckets = await fetchAllPages('https://api.test/x', {}, { apiKey: KEY, fetch: endless, log });
    expect(n).toBe(5);
    expect(buckets).toHaveLength(5);
    expect(warned.join(' ')).toContain('page cap');
  });

  test('non-2xx → UsageApiError with the status, no body echoed', async () => {
    const denied = async () => new Response('{"error":{"message":"secret detail"}}', { status: 401 });
    const error = await fetchAllPages('https://api.test/x', {}, { apiKey: KEY, fetch: denied }).catch((e) => e);
    expect(error).toBeInstanceOf(UsageApiError);
    expect(error.status).toBe(401);
    expect(error.message).not.toContain('secret detail');
  });

  test('a body without a data array is a parse error', async () => {
    const odd = async () => Response.json({ nope: true });
    const error = await fetchAllPages('https://api.test/x', {}, { apiKey: KEY, fetch: odd }).catch((e) => e);
    expect(error).toBeInstanceOf(UsageApiError);
    expect(error.kind).toBe('parse');
  });
});

describe('aggregation', () => {
  const usage = aggregateUsage([...page1.data, ...page2.data]);

  test('cache = both ephemeral cache writes + cache reads', () => {
    expect(usage.get('2026-09-22')).toEqual({ cache: 3300, input: 1000, output: 500, total: 4800 });
    expect(usage.get('2026-10-05')).toEqual({ cache: 1_600_000, input: 300_000, output: 200_000, total: 2_100_000 });
  });

  test('missing fields count as 0 and results in one bucket are summed', () => {
    expect(usage.get('2026-09-26')).toEqual({ cache: 10_000, input: 0, output: 0, total: 10_000 });
    expect(usage.get('2026-09-23')).toEqual({ cache: 400, input: 500, output: 100, total: 1000 });
    expect(usage.get('2026-09-24')?.total).toBe(0);
  });

  test('cost cents → USD, non-USD skipped', () => {
    const usd = aggregateCost(cost.data);
    expect(usd.get('2026-10-05')).toBeCloseTo(4.12, 10);
    expect(usd.get('2026-10-01')).toBeCloseTo(4.12, 10);
    expect(
      aggregateCost([{ starting_at: '2026-10-05T00:00:00Z', results: [{ amount: '412.00', currency: 'USD' }] }]).get(
        '2026-10-05'
      )
    ).toBe(4.12);
  });
});

describe('buildTokenBurn', () => {
  const data = buildTokenBurn({
    usage: aggregateUsage([...page1.data, ...page2.data]),
    cost: aggregateCost(cost.data),
    now: NOW,
  });

  test('14 zero-filled UTC days ending today', () => {
    expect(data.days).toHaveLength(14);
    expect(data.days[0]?.date).toBe('2026-09-22');
    expect(data.days.at(-1)).toEqual({ date: '2026-10-05', tokens: 2_100_000 });
    expect(data.days.find((d) => d.date === '2026-09-27')?.tokens).toBe(0); // missing bucket
    expect(data.days.find((d) => d.date === '2026-10-02')?.tokens).toBe(0); // missing bucket
    expect(data.days.find((d) => d.date === '2026-10-03')?.tokens).toBe(0); // empty results
  });

  test('today and month-to-date exclude the previous month', () => {
    expect(data.today).toEqual({ date: '2026-10-05', tokens: 2_100_000, costUsd: 4.12 });
    expect(data.month).toEqual({ tokens: 3_100_000, costUsd: 9.74 });
    expect(data.timezone).toBe('UTC');
  });

  test('month split sums to 100 (largest remainder)', () => {
    expect(data.split).toEqual({ cache: 76, input: 15, output: 9 });
  });

  test('empty month: zeros everywhere, split all 0', () => {
    const empty = buildTokenBurn({ usage: new Map(), cost: new Map(), now: NOW });
    expect(empty.days.every((d) => d.tokens === 0)).toBe(true);
    expect(empty.split).toEqual({ cache: 0, input: 0, output: 0 });
    expect(empty.month).toEqual({ tokens: 0, costUsd: 0 });
  });
});

describe('splitPercent', () => {
  test.each([
    [1, 1, 1],
    [2, 1, 0],
    [999, 1, 0],
    [123_456, 7_890, 1_234],
    [1, 0, 0],
  ])('%p/%p/%p sums to 100', (cache, input, output) => {
    const s = splitPercent({ cache, input, output });
    expect(s.cache + s.input + s.output).toBe(100);
  });

  test('all zero stays 0/0/0', () => {
    expect(splitPercent({ cache: 0, input: 0, output: 0 })).toEqual({ cache: 0, input: 0, output: 0 });
  });
});

describe('formatting', () => {
  test('formatTokens', () => {
    expect(formatTokens(2_840_000)).toBe('2.84M');
    expect(formatTokens(48_600_000)).toBe('48.6M');
    expect(formatTokens(912_000)).toBe('912k');
    expect(formatTokens(1_234)).toBe('1.23k');
    expect(formatTokens(512)).toBe('512');
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(Number.NaN)).toBe('0');
  });

  test('formatUsd', () => {
    expect(formatUsd(4.12)).toBe('$4.12');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(1234.5)).toBe('$1,234.50');
  });

  test('countParts round-trips the formatted text', () => {
    expect(countParts('2.84M')).toEqual({ value: 2.84, decimals: 2, suffix: 'M' });
    expect(countParts('912k')).toEqual({ value: 912, decimals: 0, suffix: 'k' });
    expect(countParts('0')).toEqual({ value: 0, decimals: 0, suffix: '' });
    expect(countParts('$4.12')).toBeUndefined();
  });

  test('barHeights: relative to the max, non-zero days at least 6 %', () => {
    expect(barHeights([0, 1, 50, 100])).toEqual([0, 6, 50, 100]);
    expect(barHeights([0, 0])).toEqual([0, 0]);
  });
});

describe('getTokenBurn / tokenBurnResponse', () => {
  test('happy path over the fixtures', async () => {
    const data = await getTokenBurn({ apiKey: KEY, now: NOW, fetch: fixtureFetch(), baseUrl: 'https://api.test' });
    expect(data.today.tokens).toBe(2_100_000);
    expect(data.month.costUsd).toBe(9.74);
  });

  test.each([
    ['rejects', async () => Promise.reject(new TypeError('fetch failed'))],
    ['401', async () => new Response('denied', { status: 401 })],
    ['500', async () => new Response('boom', { status: 500 })],
    ['bad JSON', async () => new Response('<html>', { status: 200 })],
  ])('fetch %s → UsageApiError → available:false', async (_, failing) => {
    const error = await getTokenBurn({ apiKey: KEY, now: NOW, fetch: failing }).catch((e) => e);
    expect(error).toBeInstanceOf(UsageApiError);
    const res = await tokenBurnResponse({ apiKey: KEY, fetch: failing, now: NOW, log: silent });
    expect(res).toEqual({ body: { available: false, reason: 'upstream' }, headers: HEADERS_UNAVAILABLE });
  });

  test('a hung upstream times out', async () => {
    const hang = (_: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)));
    const started = performance.now();
    const error = await getTokenBurn({ apiKey: KEY, now: NOW, fetch: hang, timeoutMs: 50 }).catch((e) => e);
    expect(error).toBeInstanceOf(UsageApiError);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  test('no key → not-configured, and fetch is never called', async () => {
    let called = false;
    const res = await tokenBurnResponse({
      apiKey: undefined,
      fetch: async () => {
        called = true;
        return Response.json({});
      },
    });
    expect(res).toEqual({ body: { available: false, reason: 'not-configured' }, headers: HEADERS_UNAVAILABLE });
    expect(called).toBe(false);
  });

  test('success → long CDN cache; the log never contains the key', async () => {
    const logged: unknown[] = [];
    const ok = await tokenBurnResponse({ apiKey: KEY, fetch: fixtureFetch(), now: NOW, baseUrl: 'https://api.test' });
    expect(ok.headers).toEqual(HEADERS_OK);
    expect(ok.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    expect(ok.headers['Vercel-CDN-Cache-Control']).toBe('max-age=900, stale-while-revalidate=3600');
    expect(HEADERS_UNAVAILABLE['Vercel-CDN-Cache-Control']).toBe('max-age=120, stale-while-revalidate=120');
    expect(ok.body.available).toBe(true);
    await tokenBurnResponse({
      apiKey: KEY,
      fetch: async () => new Response(KEY, { status: 403 }),
      log: { error: (...args) => logged.push(...args), warn: () => {} },
    });
    expect(logged.join(' ')).not.toContain(KEY);
    expect(logged.join(' ')).toContain('403');
  });
});
