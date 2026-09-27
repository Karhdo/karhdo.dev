import { describe, expect, test } from 'bun:test';
import { formatUptime, parseMonthYear } from './month-year';

describe('parseMonthYear', () => {
  test('parses the Experience.start format', () => {
    expect(parseMonthYear('Jan 2021')).toEqual(new Date(2021, 0, 1));
    expect(parseMonthYear(' Dec 2022 ')).toEqual(new Date(2022, 11, 1));
  });
  test('rejects anything else', () => {
    expect(parseMonthYear('Present')).toBeNull();
    expect(parseMonthYear('Foo 2021')).toBeNull();
    expect(parseMonthYear('2021-01')).toBeNull();
  });
});

describe('formatUptime', () => {
  const start = new Date(2021, 0, 1);
  test('years and months', () => {
    expect(formatUptime(start, new Date(2026, 8, 27))).toBe('5y 8m');
  });
  test('whole years drop the months', () => {
    expect(formatUptime(start, new Date(2023, 0, 15))).toBe('2y');
  });
  test('under a year', () => {
    expect(formatUptime(start, new Date(2021, 4, 2))).toBe('4m');
  });
  test('never negative', () => {
    expect(formatUptime(start, new Date(2020, 5, 1))).toBe('0m');
  });
});
