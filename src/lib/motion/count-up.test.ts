import { describe, expect, test } from 'bun:test';
import { countFrames, countValue, easeOutCubic, formatCount } from './count-up';

describe('formatCount', () => {
  test('groups thousands', () => {
    expect(formatCount(1234)).toBe('1,234');
    expect(formatCount(1234567)).toBe('1,234,567');
    expect(formatCount(612)).toBe('612');
  });
  test('fixed decimals and suffix', () => {
    expect(formatCount(12.4, { decimals: 1, suffix: 'k' })).toBe('12.4k');
    expect(formatCount(12, { decimals: 1 })).toBe('12.0');
    expect(formatCount(1234.5, { decimals: 2, suffix: 'M' })).toBe('1,234.50M');
  });
});

describe('easeOutCubic', () => {
  test('endpoints', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  test('clamps outside [0, 1] and eases out', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe('countFrames', () => {
  for (const [to, decimals] of [
    [612, 0],
    [34, 0],
    [12.4, 1],
    [2.84, 2],
    [0, 0],
  ] as const) {
    test(`monotonic and ends exactly at ${to}`, () => {
      const frames = countFrames(to, { decimals });
      expect(frames[0]).toBe(0);
      expect(frames.at(-1)).toBe(to);
      frames.forEach((value, i) => {
        expect(value).toBeGreaterThanOrEqual(frames[i - 1] ?? 0);
      });
    });
  }

  test('about 1.1 s at 60 fps', () => {
    expect(countFrames(100).length).toBeGreaterThanOrEqual(66);
    expect(countFrames(100).length).toBeLessThanOrEqual(68);
  });

  test('respects decimals (12.4 stays 1 dp)', () => {
    for (const value of countFrames(12.4, { decimals: 1 })) {
      expect(formatCount(value, { decimals: 1 })).toMatch(/^\d+\.\d$/);
      expect(Math.round(value * 10) / 10).toBe(value);
    }
    expect(formatCount(12.4, { decimals: 1, suffix: 'k' })).toBe('12.4k');
  });

  test('integers never show a fraction', () => {
    for (const value of countFrames(612)) expect(Number.isInteger(value)).toBe(true);
  });
});

test('countValue is the final value at or after the duration', () => {
  expect(countValue(34, 1100)).toBe(34);
  expect(countValue(34, 5000)).toBe(34);
  expect(countValue(34, 0)).toBe(0);
});
