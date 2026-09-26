import { describe, expect, test } from 'bun:test';
import { describeOffset, formatHcmTime, getZoneOffsetMinutes } from './local-time';

const HCM = 'Asia/Ho_Chi_Minh';
const HCM_OFFSET = 420;

describe('describeOffset (HCMC relative to the visitor)', () => {
  test('visitor UTC+7 → same time', () => expect(describeOffset(420, HCM_OFFSET)).toBe('same time'));
  test('visitor UTC → 7h ahead', () => expect(describeOffset(0, HCM_OFFSET)).toBe('7h ahead'));
  test('visitor UTC+9:30 → 2h30m behind', () => expect(describeOffset(570, HCM_OFFSET)).toBe('2h30m behind'));
  test('visitor UTC+5:45 → 1h15m ahead', () => expect(describeOffset(345, HCM_OFFSET)).toBe('1h15m ahead'));
  test('visitor UTC−8 → 15h ahead', () => expect(describeOffset(-480, HCM_OFFSET)).toBe('15h ahead'));
  test('minutes only → 45m ahead', () => expect(describeOffset(375, HCM_OFFSET)).toBe('45m ahead'));
});

describe('getZoneOffsetMinutes', () => {
  const winter = new Date('2026-01-15T12:00:00Z');
  const summer = new Date('2026-07-15T12:00:00Z');
  test('HCMC is UTC+7 all year', () => {
    expect(getZoneOffsetMinutes(winter, HCM)).toBe(420);
    expect(getZoneOffsetMinutes(summer, HCM)).toBe(420);
  });
  test('London follows DST', () => {
    expect(getZoneOffsetMinutes(winter, 'Europe/London')).toBe(0);
    expect(getZoneOffsetMinutes(summer, 'Europe/London')).toBe(60);
  });
  test('half-hour and 45-minute zones', () => {
    expect(getZoneOffsetMinutes(summer, 'Asia/Kolkata')).toBe(330);
    expect(getZoneOffsetMinutes(summer, 'Asia/Kathmandu')).toBe(345);
    expect(getZoneOffsetMinutes(winter, 'Australia/Adelaide')).toBe(630);
  });
  test('negative offsets', () => expect(getZoneOffsetMinutes(winter, 'America/Los_Angeles')).toBe(-480));
});

describe('formatHcmTime', () => {
  test('midnight in HCMC → 00:00', () => expect(formatHcmTime(new Date('2026-03-01T17:00:00Z'), HCM)).toBe('00:00'));
  test('afternoon → 24 h clock', () => expect(formatHcmTime(new Date('2026-03-01T08:05:00Z'), HCM)).toBe('15:05'));
});
