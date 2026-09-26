# 20 — GitHub integration: projects data, repo API, activity card

## Endpoint

- `GET /api/github?repo={owner/name}`
- `GET /api/github/activity`

## Summary

Port the GitHub GraphQL service and use it in three places: (1) server-side on the on-demand `/projects` page to enrich side projects with stars, forks, languages, topics and description; (2) `GET /api/github` kept for v1 API parity (repo data + last commit). The footer no longer calls it: the statusline's stars, sha and commit date are resolved at build time in task 09; (3) the bento "GitHub · @Karhdo" card (mockup `.c-github`) showing a **46-week** contribution heatmap and three stats — **contributions** (total in the window), **day streak** (computed from the calendar) and **public repos** — via `GET /api/github/activity`.

## Files to Create/Modify/Delete

- **Create** `src/lib/services/github.ts` — port v1 `fetchRepoData({ repo, includeLastCommit })` verbatim (same GraphQL query and post-processing) with token from `astro:env/server`; add `fetchGithubActivity(login = SITE.socialAccounts.github, weeks = 46)` using `user(login){ repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount } contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount weekday } } } } }`, trimmed to the last 46 weeks.
- **Create** `src/lib/github-activity.ts` (pure, unit-tested) — `toLevels(days)` (0–4 by quantiles of non-zero counts), `computeStreak(days, today)` (consecutive days with `count > 0` ending today, or ending yesterday if today is still 0 — GitHub-style), `sumContributions(days)`.
- **Create** `src/lib/github-activity.test.ts` — streak across a gap, streak when today is 0, all-zero calendar → 0, level buckets. Both return `null` on missing token/errors (logged). Dependency `@octokit/graphql@^9.0.5`.
- **Create** `src/pages/api/github.ts` — `prerender = false`; port of v1 route (400 when `repo` missing, `null` for `'undefined'|'null'`); additionally restrict `repo` (case-insensitive) to `/^[\w.-]+\/[\w.-]+$/` and to repos listed in `PROJECTS` or `SITE.siteRepo` (prevents using the token as an open proxy). `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600`.
- **Create** `src/pages/api/github/activity.ts` — `prerender = false`; returns `{ total, streak, publicRepos, weeks: [{ days: [{ date, count, level }] }] }` (46 weeks). `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- **Modify** `src/pages/projects.astro` — `await Promise.all(PROJECTS.map(...fetchRepoData({ repo, includeLastCommit: false })))` (v1 logic, parallel); on `null` keep the static card.
- **Modify** `src/components/projects/GithubRepoMeta.astro` — stars, forks, top 3 languages with colour dots, topics (port v1 `components/project/GithubRepo.tsx`).
- **Create** `src/components/islands/GithubActivity.tsx` — mockup heatmap (`.heat`: CSS grid `grid-template-rows: repeat(7, 11px)`, `grid-auto-flow: column`, 11 px cells, 3 px gap, 46 columns, horizontally scrollable on narrow cards) coloured with the `--heat-0..4` tokens (task 06), `role="img"` with `aria-label="Contribution heatmap for the last 46 weeks"`, and a **column ripple** on first render: each cell `<i style="--c:{columnIndex}">` plays `cellIn` (scale .2 → 1, .5 s `--ease-out`, delay `--c × 14 ms`), motion-safe only, with cells rendered at full size at rest. The three stats use the shared `countUp` from task 15 after the data arrives, per-cell `title` "N contributions on date"; stats row (`.gh-stats`): **contributions**, **day streak**, **public repos**; eyebrow "GitHub · @Karhdo" linking to the profile; skeleton while loading. `client:visible`.
- **Modify** `src/components/home/GithubActivityCard.astro` (stub from task 15): replace the skeleton body with `<GithubActivity client:visible />` plus a server-rendered skeleton fallback. **Do not edit `src/pages/index.astro`**; it already renders this card.

## Implementation Steps

1. `git show main:lib/services/github.ts main:app/api/github/route.ts main:components/project/GithubRepo.tsx `.
2. Implement service; test in a scratch Bun script with a real token (repo data for `Karhdo/karhdo.dev`, contributions for `Karhdo`).
3. Implement endpoints, projects enrichment, islands.
4. Confirm the token scope needed for `contributionsCollection` (public data works with a classic token without scopes / fine-grained read-only); document in `.env.example`.

## Acceptance Criteria

- [ ] `bun run build` succeeds without `GITHUB_API_TOKEN`.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/projects` shows stars/forks/languages for the 3 side projects when the token is set, and still renders when it is not.
- [ ] `/api/github?repo=Karhdo/karhdo.dev` returns repo data with `lastCommit`; `/api/github?repo=torvalds/linux` returns 400/403; missing `repo` → 400.
- [ ] Homepage GitHub card renders 46 weeks of contributions with `--heat-*` colours in both themes, plus contributions / day streak / public repos; no layout shift when data arrives (fixed-size skeleton).
- [ ] `bun test` passes (streak and level tests).
- [ ] The heatmap ripples in column by column and the numbers count up once (motion allowed); with reduced motion both show their final state immediately.

## Dependencies

- v2-astro-site-config-env
- v2-astro-homepage-bento
- v2-astro-projects-page

## Patterns to Follow

- v1 `lib/services/github.ts`, `app/api/github/route.ts`, `app/projects/page.tsx`, `components/project/GithubRepo.tsx`.
- Reference `src/lib/github.ts`, `src/pages/api/projects-github.json.ts`, `src/components/studio/runtime-rail/GitGrassCard.astro` (hta218/leohuynh.dev).


> **Note from task 17 review:** v1 showed the GitHub repo description (`repository?.description || description`). Use the repo description as the fallback when a project has no `description` (e.g. Website Selling Food).
