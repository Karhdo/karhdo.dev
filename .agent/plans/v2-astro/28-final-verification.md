# 28 — Final verification: parity, URLs, Lighthouse, preview deploy

## Endpoint

All endpoints re-verified: `GET/POST /api/stats`, `GET /api/stats/summary`, `GET /api/token-burn`, `GET /api/spotify`, `GET /api/github`, `GET /api/github/activity`, `POST /api/newsletter`.

## Summary

Prove v2 is a complete, safe replacement for v1 before merging `v2` into `main`: configure the Vercel project, deploy a preview, compare every v1 route and feature, check that every v1 URL still resolves (200 or intended 301), confirm production stats data is intact, run Lighthouse, and check security headers.

## Files to Create/Modify/Delete

- **Create** `scripts/verify-urls.ts` — Bun script: `bun scripts/verify-urls.ts <baseUrl>` requests every v1 URL (list below) and asserts the expected status/redirect target; exits non-zero on failure. Kept in the repo for future regressions.
- **Create** `.agent/plans/v2-astro/verification-report.md` — filled-in checklist, Lighthouse scores, header dump, data-integrity numbers.
- **Modify** nothing else unless a check fails (fixes go back to the owning task and are noted in the report).

## Implementation Steps

1. **Vercel project settings** (manual, record in report): Framework Preset = Astro; Install = `bun install --frozen-lockfile`; Build = `bun run build`; Node.js 24.x. **No env var changes**: v2 keeps the v1 names (`POSTGRES_URL`, `GITHUB_API_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BUTTONDOWN_API_KEY`, `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`, `UMAMI_WEBSITE_ID`); just confirm each exists for Preview and Production. **One new variable to add**: `ANTHROPIC_ADMIN_API_KEY` (org Admin key `sk-ant-admin…`, **Production only, never Preview or Development**, marked Sensitive; ideally from a dedicated Anthropic org; m4). The preview therefore shows the Token burn empty state, which is expected; verify the live numbers on Production after the merge for the Token burn card, task 31. Vercel's system env vars (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_URL`, `VERCEL_BRANCH_URL`) must stay exposed (the project setting "Automatically expose System Environment Variables" on). `UMAMI_SHARE_URL` is unused and can be deleted later.
2. Push `v2`, open a draft PR `v2 → main`, wait for the preview deployment.
3. **URL parity** — run `bun scripts/verify-urls.ts https://<preview>.vercel.app` with:
   - 200: `/`, `/blog`, `/blog/exploring-module-in-nestjs`, `/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods`, `/blog/problems-when-the-application-develops`, `/tags`, `/tags/application`, `/tags/database`, `/tags/design-patterns`, `/tags/javascript`, `/tags/nestjs`, `/tags/typescript`, `/tags/{each}/feed.xml`, `/feed.xml`, `/projects`, `/about`, `/robots.txt`, `/sitemap-index.xml`, `/static/resume.pdf`, `/static/images/avatar.jpg`, `/static/images/projects/karhdo-blog.png`, `/static/favicons/tennis-racquet.png`, `/og/exploring-module-in-nestjs.png`, `/pagefind/pagefind.js`, `/api/spotify`, `/api/github?repo=Karhdo/karhdo.dev`, `/api/github/activity`, `/api/stats?type=blog&slug=exploring-module-in-nestjs`, `/api/stats/summary`, `/api/token-burn` (on the preview: 200 with `available:false`, because the key is Production-only; on Production after the merge: `available:true`; never 5xx).
   - 404: `/dev/tokens` (dev-only pages must not exist in production).
   - 400: `/api/stats?type=snippet&slug=x`; 403: `POST /api/stats` with `Origin: https://evil.vercel.app`.
   - 301/308: `/sitemap.xml` → `/sitemap-index.xml`, `/blog/page/1` → `/blog`.
   - 404: `/blog/does-not-exist`, `/tags/does-not-exist` (custom 404 body).
   - Trailing slash: `/blog/` and `/about/` redirect to the no-slash URL (or 200 with canonical no-slash — record which).
   - Umami: `/stats/script.js` returns JavaScript (rewrite works).
   - Also extract every internal link from the v1 production sitemap (`curl https://karhdo.dev/sitemap.xml`) and assert each path returns 200 on the preview.
4. **Feature parity checklist** (tick in report, v1 → v2):
   - [ ] Home: intro, typed bios, Spotify now playing (with progress bar), recent posts, popular tags (+ new bento cards matching the mockup: **Token burn** (tokens today + cost, 14 UTC-day bars with today highlighted, cache/input/output split, "N this month", "API usage · UTC" label, quiet empty state without the key), Latest post, Daily stack, GitHub 46-week heatmap with contributions/day streak/public repos, Blog stats with posts/views/reactions, Selected projects row). The Local time / GMT+7 bento card is intentionally gone; the HCMC time lives in the footer statusline.
   - [ ] Blog stats card: total views + 30-day delta, area chart (or the "collecting since" note when there are < 2 points), reaction split + legend, and a Most read link, all matching SQL on `stats` / `stats_daily`.
   - [ ] Daily stack: 14-tool two-row `simple-icons` marquee, "14 tools", "Now learning Astro & Bun"; static rows under reduced motion.
   - [ ] Selected projects: featured EcomHeat (fact tiles, Visit product, framed screenshot) + karhdo.dev (★ N) + Simulate Basic Geometry; `/projects` uses the same cards; screenshots served as AVIF/WebP.
   - [ ] Motion system (task 26 inventory): hero words, Ocean name gradient (blue → cyan) shine/colour flow + blue dot pulse, card stagger, scroll reveals, heatmap ripple, token bars/split, count-ups, tilt + spotlight, button sheen, chip pop, row underline, reactions burst, page + nav-pill view transitions, circular theme reveal; all off under reduced motion; content complete with JS off.
   - [ ] Snowfall on homepage (v1, slightly larger and slower flakes): 119 round flakes, radius [0.8, 2.6], speed [0.25, 1.2], wind [-0.2, 0.4], opacity [0.15, 0.4]; stops when navigating away; absent under reduced motion.
   - [ ] Blog list ("Writing", tag filter chips, dated rows), pagination.
   - [ ] Post: title/tags/date/reading time, views, reactions (4, at the end of the article), TOC aside with tags + updated date, callouts / `> [!TIP]` alerts, code blocks (title tab, language label, copy button, highlighted/inserted lines, Tokyonight Day in light mode), code titles + line numbers, images + zoom, Twemoji, heading anchors, prev/next, scroll-top/comment buttons, Giscus, JSON-LD (+ new: reading progress, sticky TOC scrollspy, newsletter card).
   - [ ] Tags index + tag pages + tag RSS.
   - [ ] Projects: work + side, GitHub stars/languages.
   - [ ] About: author MDX, profile, career timeline, resume link.
   - [ ] Header: text-only `karhdo.dev` wordmark (no avatar, no dot; decode once per session, hover wave, 75 % underline on hover/focus only), nav is exactly **Blog · Projects · About** (v1 order), theme switch (no flash, `data-theme`), search (⌘K replaces kbar, React/cmdk lazy-loaded on first open), analytics link, mobile nav.
   - [ ] **Footer statusline**: top row (brand + description, Site / Personal / Elsewhere columns with Blog, Projects, Tags, RSS feed / About, Resume, Analytics / GitHub, LinkedIn, Twitter); statusline segments `karhdo.dev ★ N` (N = live GitHub stargazers at deploy time), version switcher (`main` → menu with main (current, check) and v1 → `https://v1.karhdo.dev`; keyboard-operable; v1 link visible with JS off), `Ho Chi Minh, Viet Nam`, live HCMC time + same/ahead/behind (test 3 timezones incl. a half-hour one), `#<sha> · committed <relative>` matching the deployed commit (`VERCEL_GIT_COMMIT_SHA`), "Made in Vietnam" badge; one row at ≥1024 px, stacked at ≤600 px; no React.
   - [ ] Version switcher note: `v1.karhdo.dev` is **not live yet** (the user points it at the v1 branch after v2 ships), so the link failing to resolve is expected and not a blocker. Follow-up outside this plan: a matching switcher on the v1 branch pointing back to karhdo.dev.
   - [ ] RSS, sitemap, robots, SEO meta, OG images, Umami tracking (pageview visible in Umami dashboard after navigating 3 pages incl. view-transition navigations), security headers, 404.
   - [ ] Buttondown subscribe works end-to-end.
5. **`stats_daily` migration** — confirm `db/manual-migrations/0001_create_stats_daily.sql` was reviewed, run on a Neon branch, then on production (date recorded). Check that `\d stats_daily` matches the Drizzle schema, that viewing a post on the preview increments today's UTC row, and that `stats` is untouched by the migration (count/sum identical before and after).
6. **Data integrity** — on the preview (production DB): compare `SELECT count(*), sum(views), sum(loves+applauses+ideas+bullseye) FROM stats` with the numbers recorded in task 05 (only increases allowed); confirm `\d stats` unchanged and `_prisma_migrations` untouched.
7. **Security headers** — `curl -sI https://<preview>/ https://<preview>/blog/exploring-module-in-nestjs https://<preview>/api/spotify` shows all 7 headers; browse every page with DevTools console open → 0 CSP violations (Giscus, Umami, Pagefind WASM, Spotify images).
8. **Lighthouse** (mobile, preview URL, 3 runs, median) for `/`, `/blog`, `/blog/exploring-module-in-nestjs`, `/projects`, `/about`. Targets: Performance ≥ 95 (≥ 90 for `/projects` since it is on-demand), Accessibility = 100, Best Practices = 100, SEO = 100; LCP < 2.0 s, CLS < 0.05, TBT < 100 ms. Record scores.
9. **Theme / motion** — no theme flash on hard reload in both OS modes; with JS disabled, the OS dark scheme renders dark tokens and dark code frames; reduced-motion walk-through; CLS < 0.05 on `/` with all live cards (Spotify, Token burn, GitHub, Blog stats) loaded — moved here from task 26.
10. **Build checks** — fresh clone → `bun install --frozen-lockfile && bun run build && bunx biome ci && bunx astro check && bun test`; the GitHub Actions CI run for the PR is green; the build log has no markdown-processor deprecation warnings.
11. After approval: merge PR into `main` (user action) and verify production.

## Acceptance Criteria

- [ ] `bun run build` succeeds from a fresh clone with `--frozen-lockfile`.
- [ ] `bunx biome check` passes (and `bunx biome ci`).
- [ ] `bunx astro check` passes with 0 errors, 0 warnings.
- [ ] `bun test` passes and the CI workflow on the PR is green.
- [ ] **Tokyonight-only palette**: the `lint:palette` grep (task 06) finds no colour literals in `src/` outside `src/styles/theme.css`, `src/styles/palette.ts`, the MIV badge SVG and the EC theme JSON; spot-check the Spotify card (green token), Daily stack badges, hero names, browser-frame dots and button sheen in both themes.
- [ ] Header nav is Blog · Projects · About (the mockup's "Latest post" link is intentionally not in the real nav).
- [ ] `stats_daily` exists in production via the reviewed manual migration; existing `stats` data is unchanged; daily rows accumulate.
- [ ] Motion: every effect works when allowed, everything is off under reduced motion, no animation loop runs off-screen (Performance panel), and CLS < 0.05 on `/` with all live cards.
- [ ] Footer statusline: star count equals GitHub's `stargazers_count` at deploy time, sha equals the deployed commit, time diff correct for 3 timezones, badge present, version-switcher keyboard + axe clean.
- [ ] Token burn (checked on **Production** after the merge, since the key is Production-only): numbers match the Anthropic Console Usage/Cost pages for the same UTC days; the admin key does not appear in any static asset (`grep -r sk-ant-admin .vercel/output/static` empty).
- [ ] `scripts/verify-urls.ts` passes against the preview, including every path from the v1 production sitemap.
- [ ] Feature parity checklist fully ticked; any intentional differences (kbar → Pagefind, react-snowfall → vanilla canvas, snowfall: v1 count, larger and slower flakes, KaTeX/citations not ported, tag sidebar → tag chips, v1 footer Signature + BuiltWith row replaced by the statusline, v1 avatar logo in header → text wordmark, v1 footer last-commit API call replaced by build-time commit info, homepage clock card replaced by Token burn) listed in the report.
- [ ] Stats data intact (counts only increased; schema unchanged).
- [ ] 7 security headers present on pages and API responses; 0 CSP violations.
- [ ] Lighthouse targets met on all 5 pages, including CLS < 0.05 on `/` with all homepage islands.
- [ ] `verification-report.md` committed.

## Dependencies

- v2-astro-stats-views-reactions
- v2-astro-spotify-now-playing
- v2-astro-github-integration
- v2-astro-giscus-comments
- v2-astro-newsletter-buttondown
- v2-astro-search-command-palette
- v2-astro-feeds-sitemap-robots
- v2-astro-og-images
- v2-astro-motion-polish
- v2-astro-docs-and-hygiene
- v2-astro-snowfall
- v2-astro-blog-stats-summary
- v2-astro-token-burn
- v2-astro-vercel-config

## Patterns to Follow

- v1 production site `https://karhdo.dev` and its `sitemap.xml` as the source of truth for URLs.
- v1 `next.config.mjs` headers for the expected header values.
