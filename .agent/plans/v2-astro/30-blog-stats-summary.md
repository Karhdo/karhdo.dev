# 30 — Blog stats summary (endpoint + rich bento card)

## Endpoint

- `GET /api/stats/summary`

## Summary

Fill the homepage **Blog stats** card to match the mockup (`.c-stats`, eyebrow "Blog stats · 30 days"):

- **Total views**, counting up once when visible, with a **30-day delta pill** (`▲ 18%` / `▼ 4%`) comparing the last 30 days with the previous 30 days.
- A **30-day daily-views area chart**: inline SVG with a gradient fill, a faint grid, a line that draws in, and an endpoint dot.
- A **reaction split bar** (❤️ loves `--red`, 👏 applauses `--orange`, 💡 ideas `--cyan`, 🎯 bullseye `--green`) with a legend of counts.
- A **"Most read"** row linking to the post with the most views.

Totals and reactions come from the cumulative `stats` table. The daily series and the delta come from the **new additive `stats_daily` table** (task 05's manual migration, written by task 18 from the day it's deployed). v1 has no history to backfill, so the chart shows whatever days exist. It **hides the chart when there are fewer than 2 data points**, and **hides the delta when the previous 30-day window has no views**. The endpoint is on demand, CDN-cached for 5 minutes, and **never queried at build time**.

## Files to Create/Modify/Delete

- **Modify** `src/lib/db/stats.ts` (task 05). Add these queries:
  - `getBlogTotals(slugs)`: one query over `stats` where `type = 'blog' AND slug IN (slugs)`, returning `{ views, loves, applauses, ideas, bullseye }` (sums, `null` → 0). Only published slugs are counted, so junk rows never inflate the numbers.
  - `getMostRead(slugs)`: `ORDER BY views DESC LIMIT 1` → `{ slug, views } | null`.
  - `getDailyViews(slugs, fromDate, toDate)`: `SELECT date, sum(views) FROM stats_daily WHERE type='blog' AND slug IN (…) AND date BETWEEN … GROUP BY date ORDER BY date`, covering the last **60** UTC days (current window plus previous window). If the table doesn't exist yet (`42P01`), it returns `[]`.
- **Create** `src/lib/stats/summary.ts` (pure, no `astro:*`):
  - `buildSummary({ posts, totals, mostRead, daily, today })` returns `{ posts, views, reactions: { loves, applauses, ideas, bullseye, total }, series: [{ date, views }] /* ≤ 30, zero-filled from the first recorded day to today */, delta: { pct, direction } | null, mostRead: { slug, title, url, views } | null, points }`.
  - `delta` is `null` when the previous-window sum is 0 or `points < 2`.
  - `reactionShares(reactions)`: integer percentages summing to 100 (largest remainder), all 0 when there are no reactions.
  - `formatCompact(n)` → `12.4k` (`Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })`, lower-case `k`).
  - `buildAreaPath(series, width = 300, height = 70, pad = 4)` → `{ line: 'M…', fill: 'M…Z', end: { x, y }, length }`. The path is a smoothed polyline (monotone cubic, so no overshoot below 0). `length` is the approximate path length, used for `stroke-dasharray`. With fewer than 2 points it returns `null`.
- **Create** `src/lib/stats/summary.test.ts`. The cases:
  - `formatCompact` (12 400 → `12.4k`, 286 → `286`, 0 → `0`);
  - delta: 120 vs 100 → `+20%` up, 80 vs 100 → `20%` down, previous 0 → `null`;
  - series zero-fill and the ≤ 30 cap;
  - `points < 2` → `delta` null and `buildAreaPath` null;
  - reaction shares sum to 100;
  - `buildAreaPath` endpoint equals the last point, and every y is within `[pad, height − pad]`.
- **Create** `src/pages/api/stats/summary.ts`: `export const prerender = false;`, `GET` only (`POST` → 405). It does **not** run the Origin check (m3): it's a public, CDN-cached, read-only aggregate, and the Origin check stays only on the write endpoints (`POST /api/stats`, `POST /api/newsletter`).
  - It calls `getPublishedPosts()`, then runs `getBlogTotals`, `getMostRead` and `getDailyViews` in parallel.
  - It maps `mostRead.slug` to the post title and URL, and returns `buildSummary(...)` with `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
  - With no `POSTGRES_URL` it returns 503 `{ posts, views: null, … }`, so the card can still show the post count. A DB error returns 500 (logged).
  - Astro routes the file `src/pages/api/stats.ts` and the folder `src/pages/api/stats/` independently, so the two endpoints don't collide.
- **Create** `src/components/islands/BlogStats.tsx` (`client:visible`; React is already on the homepage for the Spotify and GitHub islands). It fetches the summary once and renders the mockup markup:
  - `.views-head`: `<b>` total views via `formatCompact`, animated with the shared count-up helper from task 15, plus "total views" and the delta pill (`--green` up / `--red` down), which is hidden when `delta` is null.
  - `<svg class="area" viewBox="0 0 300 70" preserveAspectRatio="none" role="img" aria-label="Daily views over the last N days: min … max …">`. It contains a `<linearGradient>` defs (`--blue` 35% → 0%), three faint grid lines, the `.fill` path, the `.line` path (`style="--len:{length}"`) and the `.dot` endpoint circle. The chart is not rendered when `buildAreaPath` returns null; a "Collecting daily stats since {first date}" note shows in its place at the **same height**.
  - The `.react-bar` (four spans with `--w` shares) has an `aria-label` listing the counts, plus a `.react-legend` of four emoji + counts.
  - `.most-read`: a link to the post with the title and `formatCompact(views)`.
  - A skeleton of identical height shows while loading; `—` shows for null values.
  - Motion (item 5; the CSS lives in `animations.css`, all under `prefers-reduced-motion: no-preference`): the line draws in (`draw` via `stroke-dashoffset`), the fill fades in, the dot pops in (`dotPop`, spring) and the reaction bar wipes in (`splitIn`). Under reduced motion the final state renders directly.
- **Modify** `src/components/home/BlogStatsCard.astro` (the stub from task 15): set the eyebrow to "Blog stats · 30 days"; the body is `<BlogStats client:visible />` with a server-rendered skeleton fallback. **Do not edit `src/pages/index.astro`.**

## Implementation Steps

1. Add the DB queries and pure helpers with their tests.
2. Implement the endpoint. Test locally against docker-compose Postgres with `stats` rows and seeded `stats_daily` rows covering: none, 1 day, 10 days, and 60 days (so the delta shows), plus unknown-slug rows that must be excluded.
3. Implement the island. Check each of these states at the same card height: no DB, no daily data, 1 point, 10 points, and 60 days.
4. On a preview deploy (task 28), compare the totals with SQL on `stats`, and the series with SQL on `stats_daily`.

## Acceptance Criteria

- [ ] `bun run build` succeeds with `POSTGRES_URL` unset; no DB query happens during the build, and `index.html` stays prerendered.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (summary helpers, delta, area path).
- [ ] `GET /api/stats/summary` returns `posts: 3`, totals equal to the SQL check on `stats` (published slugs only), a `series` equal to the `stats_daily` SQL for the last ≤ 30 UTC days, a `delta` computed against the previous 30 days (null when unavailable), and `mostRead` with the correct title and URL. The header is `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`.
- [ ] Before the `stats_daily` migration exists, the endpoint still returns 200 with `series: []`, `delta: null` and correct totals.
- [ ] Rows for unknown slugs or `type='snippet'` don't affect any number.
- [ ] The card matches the mockup `.c-stats`: total views + delta pill, area chart (gradient, grid, line, endpoint dot), reaction split + legend, and the Most read link.
- [ ] With fewer than 2 points, the chart and delta are hidden and the note is shown, with no height change.
- [ ] No CLS between the skeleton and data states; with reduced motion, no draw-in, pop or wipe.

## Dependencies

- v2-astro-db-drizzle
- v2-astro-homepage-bento
- v2-astro-stats-views-reactions

## Patterns to Follow

- Mockup "Blog stats" CSS section (`.views-head`, `.delta`, `.area`, `.react-bar`, `.react-legend`, `.most-read`) and its area-chart sample script (path building only).
- Task 18 (`src/lib/stats/*`, `src/lib/security/origin.ts`, the thin endpoint adapter pattern).


> **Implementation note (task 30):** the Blog stats card is a vanilla module script (`src/components/home/blog-stats.ts`), not a React island, so the homepage ships no React. `/api/stats/summary` sends `Cache-Control: public, max-age=0, must-revalidate` plus `Vercel-CDN-Cache-Control: max-age=300, stale-while-revalidate=600` (per the 00-overview cache-header rule), replacing the `s-maxage` header in the acceptance criteria above. Measure layout with `clientWidth`/`offsetWidth`, not `getBoundingClientRect`, inside cards that can be transformed (rise/tilt).
