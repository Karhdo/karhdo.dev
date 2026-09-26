# 18 — Stats API, view counter and reactions

## Endpoint

- `GET /api/stats?type=blog&slug={slug}`
- `POST /api/stats`

## Summary

Port the views + reactions feature onto the existing `stats` table via Drizzle (task 05). The endpoint becomes atomic (increments instead of v1's read-then-write of absolute values) and validated. Two React islands on the post page: `ViewCounter` (counts one view per session per post) and `Reactions` (4 emoji, max 5 per emoji per visitor, persisted in `localStorage` exactly as v1 so returning readers keep their counts).

## Files to Create/Modify/Delete

- **Create** `src/pages/api/stats.ts` — `export const prerender = false;`
  - `GET`: validate `type === 'blog'` (**`snippet` is rejected with 400**: the enum value exists in the DB but v2 has no snippets, so accepting it would let anyone create junk rows) and `slug` (`/^[a-z0-9-]{1,255}$/`, and for `type=blog` must be an existing post id via `getCollection('blog')` — prevents junk rows); returns `{ type, slug, views, loves, applauses, ideas, bullseye }` (zeros if no row). `Cache-Control: no-store`. 400 on bad input (`{ message }`, v1 wording), 503 when `POSTGRES_URL` missing, 500 on DB error (logged).
  - `POST`: JSON body `{ type: 'blog', slug, views?: 1, loves?: 1..5, applauses?: 1..5, ideas?: 1..5, bullseye?: 1..5 }`, validated with `statsPostSchema` (strict object; at least one counter; `views` must be exactly `1`, reactions integers 1–5; **any other value → 400**, so v1-style absolute payloads such as `{ views: 1235 }` or `{ loves: 42 }` from a stale cached v1 bundle are rejected instead of being added as deltas). Calls `incrementStats`. Returns the updated row.
  - Both methods run `assertAllowedOrigin(request)` first (403 on failure).
- **Create** `src/lib/security/origin.ts` — `isAllowedOrigin(origin, env)` (pure, unit-tested) + `assertAllowedOrigin(request)`: allowed = `https://karhdo.dev`, `https://www.karhdo.dev`, `http://localhost:4321`, `http://127.0.0.1:4321`, and — only when running on Vercel — `https://${process.env.VERCEL_URL}` and `https://${process.env.VERCEL_BRANCH_URL}` (Vercel system env vars for this deployment; **no `*.vercel.app` wildcard**). A missing `Origin` header is allowed for `GET` only. Reused by tasks 22 and 30.
- **Create** `src/lib/stats/schema.ts` (pure) — `statsQuerySchema`, `statsPostSchema`, built with the `zod` package imported directly (add `zod` as a dependency `^4.5.4`, the range `astro@7.3.5` itself depends on) so that `bun test` can load it without Astro's virtual modules.
- **Modify** `src/lib/db/stats.ts` (task 05): add `recordDailyView(type, slug)`, which is `INSERT INTO stats_daily (type, slug, date, views) VALUES ($1, $2, (now() AT TIME ZONE 'utc')::date, 1) ON CONFLICT (type, slug, date) DO UPDATE SET views = stats_daily.views + 1` via Drizzle `onConflictDoUpdate`. The POST handler calls it **after** the main `stats` upsert succeeds, and only for `views` deltas. It is **best-effort**: errors are caught and logged, never affect the response, and never roll back the cumulative counter. On Postgres error `42P01` (undefined_table, i.e. the manual migration hasn't run yet), it logs once per instance and skips. So v2 can deploy before or after `0001_create_stats_daily.sql`, and the cumulative `stats.views` stays the source of truth for totals.
- **Create** `src/lib/stats/handler.ts` (pure) — `handleStatsGet(query, deps)` / `handleStatsPost(body, deps)` returning `{ status, body }`, with `deps = { getStats, incrementStats, recordDailyView, isKnownSlug }` injected; `src/pages/api/stats.ts` is a thin adapter.
- **Create** `src/lib/stats/schema.test.ts`, `src/lib/stats/handler.test.ts`, `src/lib/security/origin.test.ts` — cases: valid view `{views:1}` → 200, `incrementStats` called with `{views:1}` and `recordDailyView` called once; reaction-only POST → `recordDailyView` not called; `recordDailyView` throwing (incl. a `42P01` error) → still 200 with the updated row; `{loves:3}` → +3; **`{views:1235}` → 400**, `{loves:42}` → 400, `{loves:0}` → 400, `{}` → 400, `type:'snippet'` → 400, unknown slug → 400, bad slug chars → 400, extra keys → 400; DB throws → 500; origin: prod/localhost/VERCEL_URL allowed, `https://evil.vercel.app` and `https://karhdo.dev.evil.com` rejected.
- **Create** `src/lib/utils/fetch-json.ts` — typed `fetchJson<T>(url, init?)` with timeout via `AbortSignal.timeout(8000)`.
- **Create** `src/components/islands/ViewCounter.tsx` — props `{ type, slug }`; on mount: `sessionStorage` key `viewed:{type}/{slug}` — if absent, `POST {views:1}` and set key, else `GET`; renders `1,234 views` (v1 format: `---` while loading). `client:idle`.
- **Create** `src/components/islands/Reactions.tsx` — port v1 `Reactions.tsx` UI/logic (REACTIONS list, `MAX_REACTIONS = 5`, localStorage key `${type}/${slug}` with the same JSON shape `{loves, ideas, applauses, bullseye}` for backward compatibility, the "+N" slide animation, `animate-scale-up` at max, `data-umami-event="post-reaction"`). Replace SWR with `fetchJson`. On save (1 s after pointer leave **or** on blur/`visibilitychange`, fixing v1's mouse-only save that never fired on touch devices) send `POST { [key]: localDelta }` where `localDelta = reactions[key] - initial[key]`, then set `initial = reactions`. Buttons have `aria-label` ("Love this post (3)") and `aria-pressed` when the visitor has reacted. Uses the React Twemoji twin. `client:visible`. **Motion (item 5, mockup `.react`):** on each click the emoji plays `burst` (scale 1 → 1.5 with a −10° twist → 1, `--ease-spring`, .45 s, via an `on` class toggled per click), and a `<span class="plus" aria-hidden="true">+1</span>` floats up and fades (`floatUp`, .7 s) and is removed on `animationend`. Both run only under `prefers-reduced-motion: no-preference`; with reduced motion the count simply updates. The +1 is absolutely positioned inside the button, so there is no layout shift.
- **Modify** only the stubs from task 12 (m2): `src/components/blog/PostViewCount.astro` → `<ViewCounter client:idle type="blog" slug={id} />` in the byline, and `src/components/blog/PostReactions.astro` → `<Reactions client:visible …/>` **at the end of the article** (mockup `.reactions`, a centred row of 4 emoji buttons with counts, before comments) on all screen sizes. **Do not edit `PostLayout.astro` or `PostHeader.astro`.**
- **Delete** nothing.

## Implementation Steps

1. Port logic from `git show main:app/api/stats/route.ts main:components/blog/Reactions.tsx main:components/blog/ViewCounter.tsx main:hooks/use-blog-stats.ts`.
2. Implement endpoint; test with `curl` against local Postgres (docker compose): GET unknown slug → 400; GET `type=snippet` → 400; POST with `Origin: https://evil.vercel.app` → 403; GET valid → zeros; POST `{views:1}` twice → 2; POST `{loves: 9}` → 400; POST `{loves: 3}` → +3.
3. Implement islands; test reload behaviour (view counted once per session; reactions persisted across reloads; counts continue from localStorage values created by v1 — seed `localStorage['blog/exploring-module-in-nestjs'] = '{"loves":2,"ideas":0,"applauses":1,"bullseye":0}'` and confirm UI shows +2/+1 state).
4. Verify on a Vercel preview with the production DB that existing view counts are shown unchanged (compare with the numbers recorded in task 05).

## Acceptance Criteria

- [ ] `bun run build` succeeds; `api/stats` is a function, not prerendered.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (schema, handler incl. `{views:1235}` → 400, daily-view best-effort cases, origin).
- [ ] After the manual `stats_daily` migration: 3 view POSTs for one slug create/increment exactly one `stats_daily` row for today's UTC date to 3; before the migration the same POSTs still succeed and the logs show a single `42P01` skip message.
- [ ] Reaction click shows the burst and a floating +1 (motion allowed), nothing animates under reduced motion, and there's no layout shift.
- [ ] curl matrix in step 2 returns the expected status codes and values.
- [ ] 50 concurrent `POST {views:1}` (e.g. `bunx autocannon -c 50 -a 50 …`) increase `views` by exactly 50.
- [ ] Post page shows the v1 view count for existing posts (preview deploy against production DB), increments once per session.
- [ ] Reactions: max 5 per emoji per visitor, persisted in `localStorage` with the v1 key format, saved on touch devices (Chrome device emulation).
- [ ] No DB access happens during `bun run build` (build succeeds with `POSTGRES_URL` unset).

## Dependencies

- v2-astro-db-drizzle
- v2-astro-blog-post-page

## Patterns to Follow

- v1 `app/api/stats/route.ts`, `components/blog/Reactions.tsx`, `components/blog/ViewCounter.tsx`, `hooks/use-blog-stats.ts`.
- Reference `src/pages/api/stats.ts`, `src/components/widgets/Reactions.tsx`, `src/components/widgets/ViewsCounter.tsx` (hta218/leohuynh.dev).


> **Note from task 05 review:** `StatsType` is defined twice (`src/lib/db/schema.ts` derives it from the pgEnum; `src/types/stats.ts` declares it by hand). Make `src/types/stats.ts` re-export the schema-derived type so there is one source of truth. `getDb()` now disables SSL for `localhost`/`127.0.0.1`, so the docker-compose Postgres works for local testing.
