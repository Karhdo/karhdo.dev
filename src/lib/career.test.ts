import { describe, expect, test } from 'bun:test';
import { commitHash, graphRows, roleDuration, rulerBars, stackDiff } from './career';

const now = new Date(2026, 8, 27);

// Mirrors src/config/experiences.ts (newest first).
const spartan = { org: 'Spartan', start: 'Mar 2025', end: 'Present', kind: 'work' as const };
const younet = { org: 'Younet', start: 'Mar 2022', end: 'Mar 2025', kind: 'work' as const };
const qkit = { org: 'QKIT', start: 'Jan 2021', end: 'Dec 2022', kind: 'work' as const };
const uit = { org: 'UIT', start: 'Aug 2019', end: 'Jun 2023', kind: 'education' as const };
const all = [spartan, younet, qkit, uit];

describe('roleDuration', () => {
  test('is inclusive of the end month', () => {
    expect(roleDuration(qkit, now)).toBe('2y');
    expect(roleDuration(younet, now)).toBe('3y 1m');
  });
  test('Present runs to now', () => {
    expect(roleDuration(spartan, now)).toBe('1y 7m');
  });
});

describe('commitHash', () => {
  test('is stable, 7 hex chars, and differs per seed', () => {
    expect(commitHash('Spartan')).toMatch(/^[0-9a-f]{7}$/);
    expect(commitHash('Spartan')).toBe(commitHash('Spartan'));
    expect(commitHash('Spartan')).not.toBe(commitHash('QKIT'));
  });
});

describe('stackDiff', () => {
  test('marks a tool added only in the oldest role that uses it', () => {
    const diff = stackDiff([
      { start: 'Mar 2022', stack: [{ name: 'NestJS' }, { name: 'Redis' }] },
      { start: 'Jan 2021', stack: [{ name: 'NestJS' }, { name: 'Prisma' }] },
    ]);
    expect(diff[0]).toEqual([
      { name: 'NestJS', added: false },
      { name: 'Redis', added: true },
    ]);
    expect(diff[1]).toEqual([
      { name: 'NestJS', added: true },
      { name: 'Prisma', added: true },
    ]);
  });
});

describe('rulerBars', () => {
  const { years, bars, tracks } = rulerBars(all, now);
  test('spans January of the first year to the end of this year', () => {
    expect(years).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
  });
  test('overlapping roles get separate tracks, oldest first', () => {
    const track = Object.fromEntries(bars.map((bar) => [bar.entry.org, bar.track]));
    expect(track).toEqual({ UIT: 0, QKIT: 1, Younet: 2, Spartan: 0 });
    expect(tracks).toBe(3);
  });
  test('bars are percentages inside the ruler', () => {
    for (const bar of bars) {
      expect(bar.left).toBeGreaterThanOrEqual(0);
      expect(bar.left + bar.width).toBeLessThanOrEqual(100.0001);
    }
  });
  test('an empty list is empty', () => {
    expect(rulerBars([], now)).toEqual({ years: [], bars: [], tracks: 0 });
  });
});

describe('graphRows', () => {
  const rows = graphRows(all);
  const summary = rows.map((row) => `${row.type}:${row.entry.org}`);
  const cell = (i: number, lane: 0 | 1) => {
    const c = rows[i]?.lanes[lane];
    return c ? `${c.up ? 'u' : '-'}${c.dot ? 'o' : '-'}${c.down ? 'd' : '-'}` : '';
  };

  test('orders commits and the education merge newest first', () => {
    expect(summary).toEqual(['commit:Spartan', 'merge:UIT', 'commit:Younet', 'commit:QKIT', 'commit:UIT']);
  });
  test('main starts at the first job and ends at HEAD', () => {
    expect(cell(0, 0)).toBe('-od'); // HEAD: nothing above
    expect(cell(1, 0)).toBe('u-d'); // passes the merge row
    expect(cell(3, 0)).toBe('uo-'); // first job: nothing below
    expect(cell(4, 0)).toBe('---');
  });
  test('the education branch runs from enrolment to its merge', () => {
    expect(cell(0, 1)).toBe('---');
    expect(cell(1, 1)).toBe('-od'); // merge point: line only below
    expect(cell(2, 1)).toBe('u-d');
    expect(cell(4, 1)).toBe('uo-'); // enrolment: nothing below
  });
});
