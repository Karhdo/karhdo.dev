/**
 * Client-safe formatting for the Token burn card (task 31). Kept apart from `anthropic-usage.ts` so the
 * card's bundled script imports only these few functions, never the fetch/aggregation code.
 */

const compact = new Map<number, Intl.NumberFormat>();

/** `2840000` → `2.84M`, `48600000` → `48.6M`, `912000` → `912k`, `0` → `0` (lower-case `k`). */
export function formatTokens(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  const digits = n < 1e7 ? 2 : 1;
  let format = compact.get(digits);
  if (!format) {
    format = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: digits });
    compact.set(digits, format);
  }
  return format.format(n).replace('K', 'k');
}

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `4.1234` → `$4.12`. */
export function formatUsd(n: number): string {
  return usd.format(Number.isFinite(n) && n > 0 ? n : 0);
}

/** Splits a formatted token string (`2.84M`) into count-up options: value `2.84`, 2 decimals, suffix `M`. */
export function countParts(text: string): { value: number; decimals: number; suffix: string } | undefined {
  const match = /^(\d+)(?:\.(\d+))?([a-zA-Z]?)$/.exec(text);
  if (!match) return undefined;
  const [, int = '0', frac = '', suffix = ''] = match;
  return { value: Number(`${int}.${frac || '0'}`), decimals: frac.length, suffix };
}

/** Bar heights in % of the busiest day; non-zero days get at least 6 % so they stay visible, zero days 0. */
export function barHeights(values: readonly number[]): number[] {
  const max = Math.max(0, ...values);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => (v > 0 ? Math.max(6, Math.round((v / max) * 1000) / 10) : 0));
}
