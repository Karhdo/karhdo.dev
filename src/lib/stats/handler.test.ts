import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { Stats, StatsDeltas, StatsType } from '~/types/stats';
import { handleStatsGet, handleStatsPost, resetDailyViewWarning, type StatsDeps } from './handler';

const SLUG = 'exploring-module-in-nestjs';
const KNOWN = new Set([SLUG]);

/** In-memory fake of the `stats` table with the same additive semantics as `incrementStats`. */
function fakeDeps(overrides: Partial<StatsDeps> = {}) {
  const rows = new Map<string, Stats>();
  const zero = (type: StatsType, slug: string): Stats => ({
    type,
    slug,
    views: 0,
    loves: 0,
    applauses: 0,
    ideas: 0,
    bullseye: 0,
  });
  const log = { error: mock(() => {}), warn: mock(() => {}) };
  const deps = {
    getStats: mock(async (type: StatsType, slug: string) => rows.get(`${type}/${slug}`) ?? zero(type, slug)),
    incrementStats: mock(async (type: StatsType, slug: string, deltas: StatsDeltas) => {
      const row = { ...(rows.get(`${type}/${slug}`) ?? zero(type, slug)) };
      for (const [key, delta] of Object.entries(deltas)) row[key as keyof StatsDeltas] += delta ?? 0;
      rows.set(`${type}/${slug}`, row);
      return row;
    }),
    recordDailyView: mock(async () => {}),
    isKnownSlug: mock((_type: StatsType, slug: string) => KNOWN.has(slug)),
    log,
    ...overrides,
  };
  return { deps, rows, log };
}

const post = (body: Record<string, unknown>) => ({ type: 'blog', slug: SLUG, ...body });

beforeEach(() => resetDailyViewWarning());

describe('handleStatsGet', () => {
  test('valid query → zeros when no row, and never inserts', async () => {
    const { deps } = fakeDeps();
    const res = await handleStatsGet({ type: 'blog', slug: SLUG }, deps);
    expect(res).toEqual({
      status: 200,
      body: { type: 'blog', slug: SLUG, views: 0, loves: 0, applauses: 0, ideas: 0, bullseye: 0 },
    });
    expect(deps.incrementStats).not.toHaveBeenCalled();
  });

  test.each([
    [{ type: 'snippet', slug: SLUG }],
    [{ type: 'blog', slug: 'Not OK' }],
    [{ type: 'blog' }],
    [{ type: 'blog', slug: 'no-such-post' }],
  ])('400 for %j', async (query) => {
    const { deps } = fakeDeps();
    expect((await handleStatsGet(query, deps)).status).toBe(400);
    expect(deps.getStats).not.toHaveBeenCalled();
  });

  test('DB error → 500 (logged)', async () => {
    const { deps, log } = fakeDeps({ getStats: async () => Promise.reject(new Error('boom')) });
    expect(await handleStatsGet({ type: 'blog', slug: SLUG }, deps)).toEqual({
      status: 500,
      body: { message: 'Internal Server Error!' },
    });
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  test('POSTGRES_URL missing → 503', async () => {
    const notConfigured = Object.assign(new Error('POSTGRES_URL is not set'), { name: 'DbNotConfiguredError' });
    const { deps } = fakeDeps({ getStats: async () => Promise.reject(notConfigured) });
    expect((await handleStatsGet({ type: 'blog', slug: SLUG }, deps)).status).toBe(503);
  });
});

describe('handleStatsPost', () => {
  test('{views:1} → 200, increments by 1 and records one daily view', async () => {
    const { deps } = fakeDeps();
    const res = await handleStatsPost(post({ views: 1 }), deps);
    expect(res.status).toBe(200);
    expect(deps.incrementStats).toHaveBeenCalledWith('blog', SLUG, { views: 1 });
    expect(deps.recordDailyView).toHaveBeenCalledTimes(1);
    expect(deps.recordDailyView).toHaveBeenCalledWith('blog', SLUG);
    expect((res.body as Stats).views).toBe(1);
  });

  test('{views:1} twice → 2', async () => {
    const { deps } = fakeDeps();
    await handleStatsPost(post({ views: 1 }), deps);
    expect(((await handleStatsPost(post({ views: 1 }), deps)).body as Stats).views).toBe(2);
  });

  test('reaction-only POST does not record a daily view', async () => {
    const { deps } = fakeDeps();
    const res = await handleStatsPost(post({ loves: 3 }), deps);
    expect(res.status).toBe(200);
    expect((res.body as Stats).loves).toBe(3);
    expect(deps.recordDailyView).not.toHaveBeenCalled();
  });

  test('{loves:3} adds 3 to the existing count', async () => {
    const { deps } = fakeDeps();
    await handleStatsPost(post({ loves: 2 }), deps);
    expect(((await handleStatsPost(post({ loves: 3 }), deps)).body as Stats).loves).toBe(5);
  });

  test('recordDailyView failing with 42P01 → still 200 with the updated row, warned once', async () => {
    const pgError = Object.assign(new Error('relation "stats_daily" does not exist'), { code: '42P01' });
    const wrapped = Object.assign(new Error('Failed query'), { cause: pgError }); // DrizzleQueryError shape
    const { deps, log } = fakeDeps({ recordDailyView: mock(async () => Promise.reject(wrapped)) });
    for (let i = 1; i <= 3; i++) {
      const res = await handleStatsPost(post({ views: 1 }), deps);
      expect(res).toMatchObject({ status: 200, body: { views: i } });
    }
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.error).not.toHaveBeenCalled();
  });

  test('recordDailyView failing otherwise → still 200, error logged', async () => {
    const { deps, log } = fakeDeps({ recordDailyView: mock(async () => Promise.reject(new Error('timeout'))) });
    expect(await handleStatsPost(post({ views: 1 }), deps)).toMatchObject({ status: 200, body: { views: 1 } });
    expect(log.error).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['v1 absolute views', post({ views: 1235 })],
    ['loves 42', post({ loves: 42 })],
    ['loves 9', post({ loves: 9 })],
    ['loves 0', post({ loves: 0 })],
    ['no counters', post({})],
    ['snippet', { type: 'snippet', slug: SLUG, views: 1 }],
    ['unknown slug', { type: 'blog', slug: 'no-such-post', views: 1 }],
    ['bad slug chars', { type: 'blog', slug: 'bad/slug', views: 1 }],
    ['extra keys', post({ views: 1, extra: true })],
    ['not an object', 'views=1'],
    ['null body', null],
  ])('400 for %s', async (_, body) => {
    const { deps } = fakeDeps();
    expect((await handleStatsPost(body, deps)).status).toBe(400);
    expect(deps.incrementStats).not.toHaveBeenCalled();
    expect(deps.recordDailyView).not.toHaveBeenCalled();
  });

  test('DB throws → 500', async () => {
    const { deps } = fakeDeps({ incrementStats: async () => Promise.reject(new Error('connection refused')) });
    expect((await handleStatsPost(post({ views: 1 }), deps)).status).toBe(500);
    expect(deps.recordDailyView).not.toHaveBeenCalled();
  });
});
