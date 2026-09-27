/**
 * Blog stats summary (task 30): pure aggregation, delta, formatting and SVG path helpers shared by
 * `GET /api/stats/summary` and the `BlogStats` island. No `astro:*` imports, so it runs anywhere.
 */

export const WINDOW_DAYS = 30;

export type ReactionTotals = { loves: number; applauses: number; ideas: number; bullseye: number };
export type Totals = ReactionTotals & { views: number };
export type DailyPoint = { date: string; views: number };
export type SummaryPost = { slug: string; title: string; url: string };
export type Delta = { pct: number; direction: 'up' | 'down' | 'flat' };

export type BlogStatsSummary = {
  /** Published posts. */
  posts: number;
  /** Cumulative views of the published posts; `null` when the DB is unavailable. */
  views: number | null;
  reactions: (ReactionTotals & { total: number }) | null;
  /** ≤ 30 UTC days, zero-filled from the first recorded day (or 30 days ago) to today. */
  series: DailyPoint[];
  /** Last 30 days vs. the 30 before; `null` when the previous window has no views or `points < 2`. */
  delta: Delta | null;
  mostRead: { slug: string; title: string; url: string; views: number } | null;
  /** `series.length`: the chart needs at least 2. */
  points: number;
  /** First recorded day of `stats_daily` in the 60-day query, for the "collecting since" note. */
  since: string | null;
};

const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` (UTC) shifted by `days`. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Today as a UTC `YYYY-MM-DD`. */
export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The inclusive UTC day range the endpoint queries: the current window plus the previous one. */
export function queryRange(today: string): { from: string; to: string } {
  return { from: addDays(today, -(2 * WINDOW_DAYS - 1)), to: today };
}

/** Percentage change of `current` vs. `previous`, or `null` when there is no previous window. */
export function computeDelta(current: number, previous: number): Delta | null {
  if (!(previous > 0)) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' };
}

/**
 * Zero-filled daily series for the last `WINDOW_DAYS` UTC days ending `today`, starting at the first
 * recorded day when that is later (so a young table doesn't draw a month of leading zeros).
 */
export function buildSeries(daily: readonly DailyPoint[], today: string): DailyPoint[] {
  if (daily.length === 0) return [];
  const windowStart = addDays(today, -(WINDOW_DAYS - 1));
  const first = daily.reduce((min, point) => (point.date < min ? point.date : min), daily[0]?.date ?? today);
  if (first > today) return [];
  const byDate = new Map<string, number>();
  for (const point of daily) byDate.set(point.date, (byDate.get(point.date) ?? 0) + point.views);
  const series: DailyPoint[] = [];
  for (let date = first > windowStart ? first : windowStart; date <= today; date = addDays(date, 1)) {
    series.push({ date, views: byDate.get(date) ?? 0 });
  }
  return series;
}

export function buildSummary({
  posts,
  totals,
  mostRead,
  daily,
  today,
}: {
  posts: readonly SummaryPost[];
  totals: Totals;
  mostRead: { slug: string; views: number } | null;
  daily: readonly DailyPoint[];
  today: string;
}): BlogStatsSummary {
  const series = buildSeries(daily, today);
  const points = series.length;
  const windowStart = addDays(today, -(WINDOW_DAYS - 1));
  const previousStart = addDays(today, -(2 * WINDOW_DAYS - 1));
  const current = series.reduce((sum, point) => sum + point.views, 0);
  const previous = daily
    .filter((point) => point.date >= previousStart && point.date < windowStart)
    .reduce((sum, point) => sum + point.views, 0);
  const post = mostRead && mostRead.views > 0 ? posts.find((p) => p.slug === mostRead.slug) : undefined;
  const since = daily.length > 0 ? daily.reduce((min, p) => (p.date < min ? p.date : min), today) : null;
  const { loves, applauses, ideas, bullseye } = totals;

  return {
    posts: posts.length,
    views: totals.views,
    reactions: { loves, applauses, ideas, bullseye, total: loves + applauses + ideas + bullseye },
    series,
    delta: points < 2 ? null : computeDelta(current, previous),
    mostRead: post && mostRead ? { slug: post.slug, title: post.title, url: post.url, views: mostRead.views } : null,
    points,
    since,
  };
}

/** The body served when the DB is unavailable: the post count survives, every number is `null`. */
export function unavailableSummary(posts: number): BlogStatsSummary {
  return { posts, views: null, reactions: null, series: [], delta: null, mostRead: null, points: 0, since: null };
}

export const REACTION_ORDER = ['loves', 'applauses', 'ideas', 'bullseye'] as const;

/** Integer percentages (largest remainder) that sum to 100; all 0 when there are no reactions. */
export function reactionShares(reactions: ReactionTotals): ReactionTotals {
  const total = REACTION_ORDER.reduce((sum, key) => sum + Math.max(0, reactions[key]), 0);
  const shares: ReactionTotals = { loves: 0, applauses: 0, ideas: 0, bullseye: 0 };
  if (total <= 0) return shares;
  const parts = REACTION_ORDER.map((key) => {
    const exact = (Math.max(0, reactions[key]) / total) * 100;
    shares[key] = Math.floor(exact);
    return { key, remainder: exact - Math.floor(exact) };
  });
  let left = 100 - REACTION_ORDER.reduce((sum, key) => sum + shares[key], 0);
  for (const { key } of parts.sort((a, b) => b.remainder - a.remainder)) {
    if (left <= 0) break;
    shares[key] += 1;
    left -= 1;
  }
  return shares;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** `12400` → `12.4k`, `286` → `286`, `1_200_000` → `1.2m`. */
export function formatCompact(n: number): string {
  return compact.format(n).toLowerCase();
}

/**
 * `formatCompact` split for the count-up helper: `formatCount(value, { decimals, suffix })` reproduces
 * the same text (`12.4k` → `{ value: 12.4, decimals: 1, suffix: 'k' }`).
 */
export function compactParts(n: number): { value: number; decimals: number; suffix: string } {
  const text = formatCompact(n);
  const match = /^([\d.]+)(\D*)$/.exec(text);
  if (!match) return { value: n, decimals: 0, suffix: '' };
  const digits = match[1] ?? '0';
  return { value: Number(digits), decimals: digits.split('.')[1]?.length ?? 0, suffix: match[2] ?? '' };
}

export type AreaPath = { line: string; fill: string; end: { x: number; y: number }; length: number };

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Smoothed area chart for `series` in a `width`×`height` viewBox: x spans the full width, y keeps
 * `pad` from the top and bottom (the 0 line sits on `height − pad`). Monotone cubic interpolation
 * (Fritsch–Carlson), so the curve never overshoots its neighbours (no dip below 0). `length`
 * approximates the line length (for `stroke-dasharray`). `null` with fewer than 2 points.
 */
export function buildAreaPath(
  series: readonly { views: number }[],
  width = 300,
  height = 70,
  pad = 4
): AreaPath | null {
  const n = series.length;
  if (n < 2) return null;
  const max = Math.max(0, ...series.map((p) => p.views));
  const span = height - 2 * pad;
  const step = width / (n - 1);
  const xs = series.map((_, i) => i * step);
  const ys = series.map((p) => height - pad - (max > 0 ? (Math.max(0, p.views) / max) * span : 0));

  // Fritsch–Carlson tangents (dy/dx).
  const slopes = xs.slice(1).map((_, i) => ((ys[i + 1] as number) - (ys[i] as number)) / step);
  const tangents = ys.map((_, i) => {
    if (i === 0) return slopes[0] as number;
    if (i === n - 1) return slopes[n - 2] as number;
    const a = slopes[i - 1] as number;
    const b = slopes[i] as number;
    return a * b <= 0 ? 0 : (a + b) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    const d = slopes[i] as number;
    if (d === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const alpha = (tangents[i] as number) / d;
    const beta = (tangents[i + 1] as number) / d;
    const h = alpha * alpha + beta * beta;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangents[i] = t * alpha * d;
      tangents[i + 1] = t * beta * d;
    }
  }

  const clampY = (y: number) => Math.min(height - pad, Math.max(pad, round(y)));
  const pt = (x: number, y: number) => `${round(x)} ${clampY(y)}`;
  let line = `M${pt(xs[0] as number, ys[0] as number)}`;
  let length = 0;
  for (let i = 0; i < n - 1; i++) {
    const x0 = xs[i] as number;
    const y0 = ys[i] as number;
    const x1 = xs[i + 1] as number;
    const y1 = ys[i + 1] as number;
    const c1 = [x0 + step / 3, y0 + ((tangents[i] as number) * step) / 3] as const;
    const c2 = [x1 - step / 3, y1 - ((tangents[i + 1] as number) * step) / 3] as const;
    line += ` C${pt(c1[0], c1[1])} ${pt(c2[0], c2[1])} ${pt(x1, y1)}`;
    // Approximate the segment length by sampling the cubic.
    let px = x0;
    let py = y0;
    for (let s = 1; s <= 8; s++) {
      const t = s / 8;
      const u = 1 - t;
      const x = u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1;
      const y = u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1;
      length += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
  }
  const end = { x: round(xs[n - 1] as number), y: clampY(ys[n - 1] as number) };
  return {
    line,
    fill: `${line} L${round(width)} ${height} L0 ${height} Z`,
    end,
    length: Math.ceil(length),
  };
}
