import { describe, expect, test } from 'bun:test';
import { formatRelative } from './relative-time';

const NOW = Date.parse('2026-09-26T12:00:00Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatRelative', () => {
  test('30 s → just now', () => expect(formatRelative(ago(30_000), NOW)).toBe('just now'));
  test('5 min', () => expect(formatRelative(ago(5 * MIN), NOW)).toBe('5 minutes ago'));
  test('3 h', () => expect(formatRelative(ago(3 * HOUR), NOW)).toBe('3 hours ago'));
  test('1 day → yesterday', () => expect(formatRelative(ago(DAY), NOW)).toBe('yesterday'));
  test('2 weeks', () => expect(formatRelative(ago(14 * DAY), NOW)).toBe('2 weeks ago'));
  test('8 months', () => expect(formatRelative(ago(8 * 30.44 * DAY), NOW)).toBe('8 months ago'));
  test('2 years', () => expect(formatRelative(ago(2 * 365.25 * DAY), NOW)).toBe('2 years ago'));
  test('accepts a Date for now', () => expect(formatRelative(ago(5 * MIN), new Date(NOW))).toBe('5 minutes ago'));
  test('invalid ISO → null', () => expect(formatRelative('not-a-date', NOW)).toBeNull());
});
