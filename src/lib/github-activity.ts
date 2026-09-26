/**
 * Pure helpers for the bento "GitHub · @Karhdo" card (task 20): heat levels, day streak, totals and
 * the 46-week window. No I/O, no `astro:*` imports, so `bun test` covers it.
 */

export const ACTIVITY_WEEKS = 46;

export type Level = 0 | 1 | 2 | 3 | 4;

/** One calendar day as GitHub's GraphQL `contributionCalendar` returns it. */
export type CalendarDay = { date: string; contributionCount: number; weekday?: number };
export type CalendarWeek = { contributionDays: CalendarDay[] };

export type ActivityDay = { date: string; count: number; level: Level };
export type ActivityWeek = { days: ActivityDay[] };

/** `GET /api/github/activity` body. */
export type GithubActivity = {
  total: number;
  streak: number;
  publicRepos: number;
  weeks: ActivityWeek[];
};

type DayCount = { date: string; count: number };

/** Value at quantile `q` (0..1) of an ascending list (nearest-rank). */
function quantile(sorted: number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))] ?? 0;
}

/**
 * Heat level 0–4 per day: 0 for no contributions, otherwise the quartile of the count among the
 * non-zero days (GitHub-style), so one very busy day doesn't flatten the rest of the map.
 */
export function toLevels(days: readonly DayCount[]): Level[] {
  const nonZero = days
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);
  if (nonZero.length === 0) return days.map(() => 0);
  const [q1, q2, q3] = [0.25, 0.5, 0.75].map((q) => quantile(nonZero, q)) as [number, number, number];
  return days.map(({ count }) => {
    if (count <= 0) return 0;
    if (count <= q1) return 1;
    if (count <= q2) return 2;
    if (count <= q3) return 3;
    return 4;
  });
}

/** `YYYY-MM-DD` shifted by `delta` days (UTC arithmetic, so DST never skips a day). */
export function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Consecutive days with at least one contribution, ending `today` (`YYYY-MM-DD`), or ending
 * yesterday when today has none yet (GitHub-style: the streak isn't broken until the day is over).
 * Days missing from the calendar count as zero.
 */
export function computeStreak(days: readonly DayCount[], today: string): number {
  const counts = new Map(days.map((day) => [day.date, day.count]));
  let cursor = (counts.get(today) ?? 0) > 0 ? today : addDays(today, -1);
  let streak = 0;
  while ((counts.get(cursor) ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function sumContributions(days: readonly DayCount[]): number {
  return days.reduce((sum, day) => sum + Math.max(0, day.count), 0);
}

/** Today's `YYYY-MM-DD` in an IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Builds the card payload from GitHub's calendar: the streak uses the whole calendar (it can be
 * longer than the window), while levels and the total cover only the last `weeks` weeks.
 */
export function buildActivity(
  calendar: readonly CalendarWeek[],
  publicRepos: number,
  today: string,
  weeks: number = ACTIVITY_WEEKS
): GithubActivity {
  const allDays = calendar.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))
  );
  const window = calendar.slice(-weeks);
  const windowDays = window.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount }))
  );
  const levels = toLevels(windowDays);
  let index = 0;
  return {
    total: sumContributions(windowDays),
    streak: computeStreak(allDays, today),
    publicRepos,
    weeks: window.map((week) => ({
      days: week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levels[index++] ?? 0,
      })),
    })),
  };
}

/** Accessible summary of the heatmap (the cells themselves are decorative). */
export function describeActivity({ total, streak }: Pick<GithubActivity, 'total' | 'streak'>, weeks = ACTIVITY_WEEKS) {
  const plural = (n: number, word: string) => `${n.toLocaleString('en-US')} ${word}${n === 1 ? '' : 's'}`;
  return `Contribution heatmap for the last ${weeks} weeks: ${plural(total, 'contribution')}, current streak ${plural(streak, 'day')}`;
}
