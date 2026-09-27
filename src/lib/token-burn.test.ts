import { describe, expect, test } from 'bun:test';
import fixture from './__fixtures__/token-burn-summary.json';
import {
  barHeights,
  buildTokenBurn,
  formatTokens,
  formatUsd,
  modelLabel,
  type Summary,
  tokenBurnResponse,
} from './token-burn';

const summary = fixture as unknown as Summary;

// 2026-09-27 12:00 in Ho Chi Minh (UTC+7).
const now = new Date('2026-09-27T05:00:00Z');
const silent = { error: () => {} };
const ok = (body: unknown) => async () => new Response(JSON.stringify(body), { status: 200 });

describe('modelLabel', () => {
  test('drops the claude- prefix and a date suffix', () => {
    expect(modelLabel('claude-haiku-4-5-20251001')).toBe('haiku-4-5');
    expect(modelLabel('claude-opus-5-5')).toBe('opus-5-5');
  });
});

describe('buildTokenBurn', () => {
  const data = buildTokenBurn(summary, now);

  test('today, month and all-time use Ho Chi Minh days', () => {
    expect(data.today).toEqual({ date: '2026-09-27', tokens: 600, costUsd: 6.25 });
    expect(data.month).toEqual({ tokens: 1100, costUsd: 11.5 });
    expect(data.allTime).toEqual({ tokens: 1600, costUsd: 16.5 });
  });

  test('14 days ending today, missing days as zero', () => {
    expect(data.days).toHaveLength(14);
    expect(data.days.at(0)?.date).toBe('2026-09-14');
    expect(data.days.at(-1)).toEqual({ date: '2026-09-27', tokens: 600 });
    expect(data.days.find((d) => d.date === '2026-09-20')?.tokens).toBe(200);
    expect(data.days.find((d) => d.date === '2026-09-21')?.tokens).toBe(0);
  });

  test('month model split: top 3 + other, adding up to 100', () => {
    expect(data.models.map((m) => m.model)).toEqual(['opus-5-5', 'sonnet-5', 'haiku-4-5', 'other']);
    expect(data.models.reduce((sum, m) => sum + m.share, 0)).toBe(100);
  });

  test('an empty summary is all zeros', () => {
    const empty = buildTokenBurn({ daily: [] }, now);
    expect(empty.today.tokens).toBe(0);
    expect(empty.models).toEqual([]);
    expect(empty.days.every((d) => d.tokens === 0)).toBe(true);
  });
});

describe('tokenBurnResponse', () => {
  test('missing url or token → not-configured, no fetch', async () => {
    let called = false;
    const fetch = async () => {
      called = true;
      return new Response('{}');
    };
    const res = await tokenBurnResponse({ url: undefined, token: 't', fetch, log: silent });
    expect(res.body).toEqual({ available: false, reason: 'not-configured' });
    expect(called).toBe(false);
  });

  test('success → data with CDN cache headers', async () => {
    const res = await tokenBurnResponse({ url: 'https://x', token: 't', fetch: ok(summary), now, log: silent });
    expect(res.body.available).toBe(true);
    expect(res.headers['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    expect(res.headers['Vercel-CDN-Cache-Control']).toContain('max-age=600');
  });

  test('sends the token and asks for the raw file', async () => {
    let seen: RequestInit | undefined;
    const fetch = async (_: string, init?: RequestInit) => {
      seen = init;
      return new Response(JSON.stringify(summary));
    };
    await tokenBurnResponse({ url: 'https://x', token: 'secret', fetch, now, log: silent });
    const headers = seen?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer secret');
    expect(headers.Accept).toBe('application/vnd.github.raw+json');
  });

  test('HTTP error, bad JSON or a network failure → upstream, never throws', async () => {
    for (const fetch of [
      async () => new Response('nope', { status: 404 }),
      ok({ nope: true }),
      async () => {
        throw new TypeError('fetch failed');
      },
    ]) {
      const res = await tokenBurnResponse({ url: 'https://x', token: 't', fetch, now, log: silent });
      expect(res.body).toEqual({ available: false, reason: 'upstream' });
    }
  });
});

describe('format', () => {
  test('formatTokens', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(912_000)).toBe('912k');
    expect(formatTokens(2_840_000)).toBe('2.84M');
    expect(formatTokens(7_009_148_527)).toBe('7B');
  });
  test('formatUsd', () => {
    expect(formatUsd(4.1234)).toBe('$4.12');
    expect(formatUsd(-1)).toBe('$0.00');
  });
  test('barHeights keeps non-zero days visible', () => {
    expect(barHeights([0, 1, 100])).toEqual([0, 6, 100]);
    expect(barHeights([0, 0])).toEqual([0, 0]);
  });
});
