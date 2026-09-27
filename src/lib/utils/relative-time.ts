/**
 * "8 months ago" / "yesterday" / "just now" via `Intl.RelativeTimeFormat` (supersedes v1
 * `getTimeAgo`). Pure, no build-time globals: used at build time and in the browser (statusline).
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Largest unit first; a month is 30.44 days and a year 365.25 days. */
const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365.25 * DAY],
  ['month', 30.44 * DAY],
  ['week', 7 * DAY],
  ['day', DAY],
  ['hour', HOUR],
  ['minute', MINUTE],
];

/** Relative time from `now` to `iso`, or `null` when `iso` is not a valid date. */
export function formatRelative(iso: string, now: number | Date = Date.now(), locale = 'en'): string | null {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const diff = then - (typeof now === 'number' ? now : now.getTime());
  if (Math.abs(diff) < MINUTE) return 'just now';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}
