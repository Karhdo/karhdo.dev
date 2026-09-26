import { describe, expect, test } from 'bun:test';
import { formatCount } from '~/lib/motion/count-up';
import {
  addDays,
  buildAreaPath,
  buildSeries,
  buildSummary,
  compactParts,
  computeDelta,
  formatCompact,
  queryRange,
  reactionShares,
  unavailableSummary,
} from './summary';

const TODAY = '2026-09-27';
const POSTS = [
  { slug: 'a', title: 'Post A', url: '/blog/a' },
  { slug: 'b', title: 'Post B', url: '/blog/b' },
  { slug: 'c', title: 'Post C', url: '/blog/c' },
];
const TOTALS = { views: 12_400, loves: 124, applauses: 78, ideas: 52, bullseye: 32 };

/** `count` consecutive days ending `end`, each with `views`. */
const days = (end: string, count: number, views: number | ((i: number) => number)) =>
  Array.from({ length: count }, (_, i) => ({
    date: addDays(end, i - count + 1),
    views: typeof views === 'number' ? views : views(i),
  }));

describe('formatCompact', () => {
  test('compact, lower-case suffix', () => {
    expect(formatCompact(12_400)).toBe('12.4k');
    expect(formatCompact(286)).toBe('286');
    expect(formatCompact(0)).toBe('0');
    expect(formatCompact(12_000)).toBe('12k');
    expect(formatCompact(1_250_000)).toBe('1.3m');
  });

  test('compactParts reproduces the text through formatCount (count-up end frame)', () => {
    for (const n of [0, 7, 286, 999, 1_000, 1_234, 12_400, 12_000, 999_999, 1_250_000]) {
      const { value, decimals, suffix } = compactParts(n);
      expect(formatCount(value, { decimals, suffix })).toBe(formatCompact(n));
    }
  });
});

describe('computeDelta', () => {
  test('120 vs 100 → 20% up; 80 vs 100 → 20% down; equal → flat', () => {
    expect(computeDelta(120, 100)).toEqual({ pct: 20, direction: 'up' });
    expect(computeDelta(80, 100)).toEqual({ pct: 20, direction: 'down' });
    expect(computeDelta(100, 100)).toEqual({ pct: 0, direction: 'flat' });
  });

  test('no previous window → null', () => {
    expect(computeDelta(50, 0)).toBeNull();
  });
});

describe('buildSeries', () => {
  test('empty → []', () => {
    expect(buildSeries([], TODAY)).toEqual([]);
  });

  test('zero-fills from the first recorded day to today', () => {
    const series = buildSeries(
      [
        { date: addDays(TODAY, -4), views: 3 },
        { date: addDays(TODAY, -1), views: 5 },
      ],
      TODAY
    );
    expect(series.map((p) => p.views)).toEqual([3, 0, 0, 5, 0]);
    expect(series.at(0)?.date).toBe(addDays(TODAY, -4));
    expect(series.at(-1)?.date).toBe(TODAY);
  });

  test('caps at the last 30 days', () => {
    const series = buildSeries(
      days(TODAY, 60, (i) => i),
      TODAY
    );
    expect(series).toHaveLength(30);
    expect(series.at(0)).toEqual({ date: addDays(TODAY, -29), views: 30 });
    expect(series.at(-1)).toEqual({ date: TODAY, views: 59 });
  });

  test('history only in the previous window → 30 zero days', () => {
    const series = buildSeries(days(addDays(TODAY, -40), 5, 10), TODAY);
    expect(series).toHaveLength(30);
    expect(series.every((p) => p.views === 0)).toBe(true);
  });

  test('queryRange covers 60 days', () => {
    expect(queryRange(TODAY)).toEqual({ from: addDays(TODAY, -59), to: TODAY });
  });
});

describe('buildSummary', () => {
  const base = { posts: POSTS, totals: TOTALS, mostRead: { slug: 'b', views: 5_100 }, today: TODAY };

  test('60 days: 30-point series, delta vs. the previous 30 days, most read mapped', () => {
    const daily = [...days(addDays(TODAY, -30), 30, 10), ...days(TODAY, 30, 12)];
    const summary = buildSummary({ ...base, daily });
    expect(summary.posts).toBe(3);
    expect(summary.views).toBe(12_400);
    expect(summary.reactions).toEqual({ loves: 124, applauses: 78, ideas: 52, bullseye: 32, total: 286 });
    expect(summary.points).toBe(30);
    expect(summary.series.reduce((s, p) => s + p.views, 0)).toBe(360);
    expect(summary.delta).toEqual({ pct: 20, direction: 'up' });
    expect(summary.mostRead).toEqual({ slug: 'b', title: 'Post B', url: '/blog/b', views: 5_100 });
    expect(summary.since).toBe(addDays(TODAY, -59));
  });

  test('10 days, no previous window → delta null', () => {
    const summary = buildSummary({ ...base, daily: days(TODAY, 10, 4) });
    expect(summary.points).toBe(10);
    expect(summary.delta).toBeNull();
  });

  test('points < 2 → delta null and no area path', () => {
    const one = buildSummary({ ...base, daily: [{ date: TODAY, views: 9 }] });
    expect(one.points).toBe(1);
    expect(one.delta).toBeNull();
    expect(buildAreaPath(one.series)).toBeNull();
    expect(one.since).toBe(TODAY);
  });

  test('no daily data → empty series, null delta and since', () => {
    const summary = buildSummary({ ...base, daily: [] });
    expect(summary).toMatchObject({ series: [], points: 0, delta: null, since: null });
  });

  test('most read with 0 views or an unknown slug → null', () => {
    expect(buildSummary({ ...base, daily: [], mostRead: { slug: 'b', views: 0 } }).mostRead).toBeNull();
    expect(buildSummary({ ...base, daily: [], mostRead: { slug: 'zzz', views: 9 } }).mostRead).toBeNull();
    expect(buildSummary({ ...base, daily: [], mostRead: null }).mostRead).toBeNull();
  });

  test('unavailable summary keeps the post count', () => {
    expect(unavailableSummary(3)).toMatchObject({ posts: 3, views: null, reactions: null, delta: null });
  });
});

describe('reactionShares', () => {
  const sum = (s: Record<string, number>) => Object.values(s).reduce((a, b) => a + b, 0);

  test('sums to 100 (largest remainder)', () => {
    for (const r of [
      { loves: 124, applauses: 78, ideas: 52, bullseye: 32 },
      { loves: 1, applauses: 1, ideas: 1, bullseye: 0 },
      { loves: 1, applauses: 1, ideas: 1, bullseye: 1 },
      { loves: 7, applauses: 0, ideas: 0, bullseye: 0 },
      { loves: 333, applauses: 333, ideas: 333, bullseye: 1 },
    ]) {
      expect(sum(reactionShares(r))).toBe(100);
    }
    expect(reactionShares({ loves: 1, applauses: 1, ideas: 1, bullseye: 0 })).toEqual({
      loves: 34,
      applauses: 33,
      ideas: 33,
      bullseye: 0,
    });
  });

  test('no reactions → all 0', () => {
    expect(reactionShares({ loves: 0, applauses: 0, ideas: 0, bullseye: 0 })).toEqual({
      loves: 0,
      applauses: 0,
      ideas: 0,
      bullseye: 0,
    });
  });
});

describe('buildAreaPath', () => {
  /** Every (x, y) pair in a path string (M/C/L commands, absolute). */
  const pairs = (d: string) => {
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    return Array.from({ length: nums.length / 2 }, (_, i) => [nums[2 * i] as number, nums[2 * i + 1] as number]);
  };

  test('fewer than 2 points → null', () => {
    expect(buildAreaPath([])).toBeNull();
    expect(buildAreaPath([{ views: 3 }])).toBeNull();
  });

  test('endpoint is the last point; every y stays within [pad, height − pad]', () => {
    const series = [0, 40, 3, 300, 0, 0, 120, 118, 500, 2].map((views) => ({ views }));
    const path = buildAreaPath(series, 300, 70, 4);
    expect(path).not.toBeNull();
    if (!path) return;
    const linePairs = pairs(path.line);
    expect(linePairs.at(-1)).toEqual([path.end.x, path.end.y]);
    expect(path.end.x).toBe(300);
    expect(path.end.y).toBeCloseTo(70 - 4 - (2 / 500) * 62, 1);
    for (const [, y] of linePairs) {
      expect(y).toBeGreaterThanOrEqual(4);
      expect(y).toBeLessThanOrEqual(66);
    }
    expect(path.line.startsWith('M0 66')).toBe(true);
    expect(path.fill.startsWith(path.line)).toBe(true);
    expect(path.fill.endsWith('L300 70 L0 70 Z')).toBe(true);
    expect(path.length).toBeGreaterThan(300);
  });

  test('flat zero series sits on the baseline; length ≈ width', () => {
    const path = buildAreaPath([{ views: 0 }, { views: 0 }, { views: 0 }]);
    expect(path?.end).toEqual({ x: 300, y: 66 });
    expect(path?.length).toBe(300);
  });

  test('the maximum reaches the top padding', () => {
    const path = buildAreaPath([{ views: 1 }, { views: 10 }]);
    expect(path?.end).toEqual({ x: 300, y: 4 });
  });
});
