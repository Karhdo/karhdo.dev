/** `Mon YYYY` dates and `5y 8m` durations (shared by /about and /career). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Mon YYYY` → first day of that month, or `null`. */
export function parseMonthYear(value: string): Date | null {
  const match = /^([A-Z][a-z]{2}) (\d{4})$/.exec(value.trim());
  const month = match ? MONTHS.indexOf(match[1] ?? '') : -1;
  if (!match || month < 0) return null;
  return new Date(Number(match[2]), month, 1);
}

/** Whole years and months from `start` to `now`, never negative. */
export function formatUptime(start: Date, now: Date): string {
  const total = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
  const years = Math.floor(total / 12);
  const months = total % 12;
  if (!years) return `${months}m`;
  return months ? `${years}y ${months}m` : `${years}y`;
}
