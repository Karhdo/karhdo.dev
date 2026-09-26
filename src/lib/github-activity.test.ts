import { describe, expect, test } from 'bun:test';
import {
  addDays,
  buildActivity,
  type CalendarWeek,
  computeStreak,
  describeActivity,
  sumContributions,
  todayIn,
  toLevels,
} from './github-activity';

/** `n` consecutive days starting at `start`, with counts from `counts` (cycled). */
function days(start: string, counts: number[]) {
  return counts.map((count, i) => ({ date: addDays(start, i), count }));
}

/** GitHub-shaped calendar of `weeks` full weeks starting at `start`, every day `count(i)`. */
function calendar(start: string, weeks: number, count: (i: number) => number): CalendarWeek[] {
  return Array.from({ length: weeks }, (_, w) => ({
    contributionDays: Array.from({ length: 7 }, (_, d) => ({
      date: addDays(start, w * 7 + d),
      contributionCount: count(w * 7 + d),
      weekday: d,
    })),
  }));
}

describe('addDays', () => {
  test('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('computeStreak', () => {
  test('counts consecutive days ending today', () => {
    expect(computeStreak(days('2026-09-20', [1, 0, 2, 3, 1, 4, 5, 1]), '2026-09-27')).toBe(6);
  });

  test('stops at a gap', () => {
    expect(computeStreak(days('2026-09-20', [5, 5, 5, 0, 1, 1, 0, 2]), '2026-09-27')).toBe(1);
  });

  test('today at zero keeps the streak ending yesterday', () => {
    expect(computeStreak(days('2026-09-20', [0, 1, 1, 1, 1, 1, 1, 0]), '2026-09-27')).toBe(6);
  });

  test('today at zero and yesterday at zero → 0', () => {
    expect(computeStreak(days('2026-09-20', [1, 1, 1, 1, 1, 1, 0, 0]), '2026-09-27')).toBe(0);
  });

  test('today missing from the calendar (time-zone lag) counts as zero', () => {
    expect(computeStreak(days('2026-09-20', [1, 1, 1, 1, 1, 1, 1]), '2026-09-27')).toBe(7);
  });

  test('an all-zero year → 0', () => {
    expect(computeStreak(days('2025-09-28', new Array(365).fill(0)), '2026-09-27')).toBe(0);
  });

  test('an empty calendar → 0', () => {
    expect(computeStreak([], '2026-09-27')).toBe(0);
  });

  test('crosses a month boundary', () => {
    expect(computeStreak(days('2026-08-29', [1, 1, 1, 1, 1]), '2026-09-02')).toBe(5);
  });
});

describe('toLevels', () => {
  test('zero days are level 0 and non-zero days bucket by quartile', () => {
    const levels = toLevels(days('2026-01-01', [0, 1, 2, 3, 4, 5, 6, 7, 8]));
    expect(levels).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  test('one outlier does not flatten the rest', () => {
    const levels = toLevels(days('2026-01-01', [1, 2, 3, 100]));
    expect(levels).toEqual([1, 2, 3, 4]);
  });

  test('equal non-zero counts share level 1', () => {
    expect(toLevels(days('2026-01-01', [0, 3, 3, 3]))).toEqual([0, 1, 1, 1]);
  });

  test('an all-zero calendar is all level 0', () => {
    expect(toLevels(days('2026-01-01', [0, 0, 0]))).toEqual([0, 0, 0]);
  });

  test('every level is within 0..4', () => {
    const levels = toLevels(
      days(
        '2026-01-01',
        Array.from({ length: 300 }, (_, i) => (i * 37) % 23)
      )
    );
    for (const level of levels) expect(level >= 0 && level <= 4).toBe(true);
    expect(new Set(levels)).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});

describe('sumContributions', () => {
  test('adds counts', () => {
    expect(sumContributions(days('2026-01-01', [1, 0, 4]))).toBe(5);
    expect(sumContributions([])).toBe(0);
  });
});

describe('buildActivity', () => {
  test('trims to the last 46 weeks; streak uses the whole calendar', () => {
    // 53 weeks, every day has 1 contribution → the streak spans all 371 days.
    const cal = calendar('2025-09-21', 53, () => 1);
    const today = addDays('2025-09-21', 53 * 7 - 1);
    const activity = buildActivity(cal, 27, today);
    expect(activity.weeks).toHaveLength(46);
    expect(activity.weeks[0]?.days[0]?.date).toBe(addDays('2025-09-21', 7 * 7));
    expect(activity.total).toBe(46 * 7);
    expect(activity.streak).toBe(53 * 7);
    expect(activity.publicRepos).toBe(27);
  });

  test('a zero-contribution year → zeros everywhere', () => {
    const activity = buildActivity(
      calendar('2025-09-21', 53, () => 0),
      3,
      '2026-09-26'
    );
    expect(activity.total).toBe(0);
    expect(activity.streak).toBe(0);
    expect(activity.weeks.flatMap((w) => w.days).every((d) => d.level === 0)).toBe(true);
  });

  test('keeps a partial current week and fewer weeks than the window', () => {
    const cal = calendar('2026-09-06', 3, (i) => i % 3);
    cal.push({ contributionDays: [{ date: '2026-09-27', contributionCount: 0 }] });
    const activity = buildActivity(cal, 0, '2026-09-27');
    expect(activity.weeks).toHaveLength(4);
    expect(activity.weeks[3]?.days).toEqual([{ date: '2026-09-27', count: 0, level: 0 }]);
  });
});

describe('todayIn', () => {
  test('uses the time zone, not UTC', () => {
    const now = new Date('2026-09-27T20:00:00Z');
    expect(todayIn('Asia/Ho_Chi_Minh', now)).toBe('2026-09-28');
    expect(todayIn('UTC', now)).toBe('2026-09-27');
  });
});

describe('describeActivity', () => {
  test('summarises with grouped numbers and plurals', () => {
    expect(describeActivity({ total: 1234, streak: 1 })).toBe(
      'Contribution heatmap for the last 46 weeks: 1,234 contributions, current streak 1 day'
    );
  });
});
