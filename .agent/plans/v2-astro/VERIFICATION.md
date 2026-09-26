# v2-astro: final verification (task 28)

Run on 2026-09-27 against commit `29e19d3` (branch `v2`), from a fresh local `git clone` into a scratch directory. Nothing was pushed or deployed, and no third-party account or the production database was touched. The only repo change is the new `scripts/verify-urls.ts` (the URL checker listed in the spec).

## Verdict

**Ready for a Vercel preview.** 3 real but small bugs are worth fixing before the merge (Spotify anchor → SEO 92 on `/`, the 349 KB avatar on posts and `/about`, `/newsletter` in the sitemap). Every local check passes: URL parity with v1, the build and test suite, security headers, 0 CSP violations, the no-env build, and axe outside Expressive Code. Lighthouse meets the targets on `/`, `/blog` and `/projects` except SEO 92 on `/` (bug 1); the post and `/about` miss mobile Perf (84/86, mostly bug 2). Everything that needs a preview deploy, real keys or the production database is **deferred to you**; see the [pre-launch checklist](#pre-launch-checklist-for-the-user).

How the local checks were run:

- **Build:** `git clone --branch v2` → `bun install --frozen-lockfile` → `bun run build` with **no env vars at all** (the local `.env` was not copied, because its `POSTGRES_URL` may point at production). A second build added only the four public `NEXT_PUBLIC_GISCUS_*` values, so the Giscus iframe could be tested for CSP.
- **Server:** `.vercel/output` was served on `127.0.0.1:4728` by a scratch Node 24 server (`vserve.mjs`, not in the repo) that imitates Vercel. It applies the `vercel.json` redirects, the `/stats/*` rewrite and the headers, then the `config.json` routes (trailing-slash 308, filesystem, the 404 fallback). It sends the on-demand routes to the **built** Vercel function (`functions/_render.func/.../entry.mjs`, `fetch` export), stands in for `/_vercel/image` with sharp (AVIF/WebP, `w`, `q`) and compresses text with brotli. It is not the Vercel edge: there is no HTTP/2, no CDN cache and no real image optimizer, so every number below is an approximation.
- **Browser:** a fresh headless Chrome 154 profile on debugging port 9728, driven by puppeteer-core. axe-core 4.13.0 and Lighthouse 13.5.0 ran from a scratch folder; nothing was added to `package.json`.

## Results

| # | Check | Result | Evidence |
| - | ----- | ------ | -------- |
| 1 | URL parity: every v1 URL (live sitemap, tags, tag feeds, feed, assets, redirects) | **PASS** | `bun scripts/verify-urls.ts http://127.0.0.1:4728 --no-env`: **57/57**, including all 7 paths from the live v1 sitemap. Table below. |
| 2 | Feature parity v1 → v2 | **PASS locally** (live-data items DEFERRED) | Table below. |
| 3a | 7 security headers on pages, posts, API, static files, `/_astro/*`, 404 | **PASS** | All 7 on `/`, `/blog/exploring-module-in-nestjs`, `/api/spotify`, `/projects`, `/static/resume.pdf`, `/_astro/`, 404. Values byte-identical to v1 `next.config.mjs` except the 2 documented CSP additions (`'wasm-unsafe-eval'`, `analytics.karhdo.dev`) and `font-src data:`. |
| 3b | CSP console errors across a navigation tour | **PASS: 0 violations** | Hard load of `/`, then ClientRouter navigations `/blog` → post (scroll to Giscus) → `/tags` → `/tags/nestjs` → `/projects` → `/about` → `/blog` → ⌘K palette (Pagefind WASM, 2 results for "nestjs module") → theme toggle → `/`, then hard loads of the 2 other posts and a 404. The task-23 `data:` script error is gone (task 26 fix confirmed). The only console errors are the designed 503s of the no-env build and the local-only items below. |
| 3c | Giscus theme CSS with CORS | **PASS locally**, DEFERRED on preview | `curl -H "Origin: https://giscus.app" /static/giscus/tokyonight-day.css`: one `Access-Control-Allow-Origin: *`, `content-type: text/css`. In the browser, giscus.app (https) can't fetch the theme from `http://127.0.0.1` (`ERR_FAILED`, a local mixed-content/private-network limit), so the themed iframe must be checked on the preview. |
| 4 | Lighthouse, mobile + desktop, 3 runs, median | **PARTIAL** | See [Lighthouse](#lighthouse). A local approximation of Vercel. |
| 5 | axe (scrolled to the bottom), 9 pages × light/dark × 1280/390 px | **PASS** outside Expressive Code; 2 minor findings | 0 violations on `/`, `/blog`, `/tags`, `/tags/nestjs`, `/projects`, `/about`. Posts: only EC `color-contrast` (accepted), plus EC `landmark-unique` and the `.ec-lang` badge (bug 4). 404 page at 1280 px: glass header over the blue button (bug 6). |
| 6 | `bun install --frozen-lockfile && bun run build` (fresh clone) | **PASS** | Built in ~9 s: 14 HTML pages, 4 OG PNGs, 7 feeds, sitemap, Pagefind (14 pages). No markdown-processor deprecation warning. The only warnings are Vite `MODULE_LEVEL_DIRECTIVE` notes about Astro's internal `"use astro:head-inject"` in MDX modules (harmless, upstream). `[build-info] branch=v2 sha=29e19d3 stars=78` (no token needed). |
| 6 | `bunx biome ci .` | **PASS** | 270 files, no issues (the new `scripts/verify-urls.ts` also passes `biome check`). |
| 6 | `bun run lint:palette` | **PASS** | "no colour literals outside the Tokyonight tokens". |
| 6 | `bunx astro check` | **PASS** | 0 errors, 0 warnings, 1 hint (`'await' has no effect` in `src/lib/spotify/client.test.ts:87`; harmless). |
| 6 | `bun test` | **PASS** | 428 pass, 0 fail, 32 files. |
| 6 | Admin key not in static output | **PASS** (for this build) | `grep -r sk-ant .vercel/output/static`: empty. Repeat on the production build. |
| 7 | No-env build boots and every page renders its empty states | **PASS** | See [No-env run](#no-env-run). |
| — | Vercel preview, production env, DB, third-party keys, CI on the PR, Umami, Firewall | **DEFERRED** | [Pre-launch checklist](#pre-launch-checklist-for-the-user). |

## URL parity

Sources: the live v1 `https://karhdo.dev/sitemap.xml` (7 URLs), `/robots.txt`, and every internal link and `/static/*` asset in the HTML of the 8 live v1 pages. "Local v2" is the build served by the Vercel emulator.

| URL | Live v1 | Local v2 | Notes |
| --- | ------- | -------- | ----- |
| `/` | 200 | 200 | |
| `/blog` | 200 | 200 | |
| `/blog/exploring-module-in-nestjs` | 200 | 200 | |
| `/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods` | 200 | 200 | |
| `/blog/problems-when-the-application-develops` | 200 | 200 | |
| `/blog/page/1` | 200 | 308 → `/blog` | `vercel.json` redirect |
| `/blog/page/2`, `/blog/page/99` | 200 (v1 renders any page number) | 404 | Intentional: 3 posts at 5 per page means 1 page. No v1 link or sitemap entry points there. |
| `/tags` | 200 | 200 | |
| `/tags/{application,database,design-patterns,javascript,nestjs,typescript}` | 200 | 200 | All 6 v1 tags |
| `/tags/{tag}/feed.xml` (×6) | **404** (not live on v1) | 200 | v2 adds them |
| `/feed.xml` | **404** (not live on v1, although v1 pages link to it) | 200 | v2 fixes the broken v1 link |
| `/tags/devops`, `/tags/react` | 404 | 404 | Linked from v1 popular tags but never existed |
| `/projects` | 200 | 200 | on-demand function |
| `/about` | 200 | 200 | |
| `/robots.txt` | 200 | 200 | `Sitemap:` now points at `/sitemap-index.xml` |
| `/sitemap.xml` | 200 | 308 → `/sitemap-index.xml` | `vercel.json` redirect |
| `/sitemap-index.xml` | — | 200 | |
| `/static/resume.pdf` | 200 | 200 | |
| `/static/images/avatar.jpg`, `/static/favicons/tennis-racquet.png`, `/static/favicons/site.webmanifest` | 200 | 200 | |
| `/static/images/blogs/{global-module,module-in-nestjs,shared-module}.png` (post images) | 200 | 200 | |
| `/static/images/experiences/{qkit-logo,uit-logo,younetmedia-logo}.png`, `spartan-logo.jpeg` | 200 | 200 | |
| `/static/images/projects/karhdo-blog.png` | 200 | 200 | kept in `public/` as the OG fallback |
| `/static/images/projects/{ecom-heat,simulate-geometry,military-7a-bidding,website-selling-food}.png` | 200 | **404** | Intentional (task 17): moved to `src/assets/projects/` and served as AVIF/WebP. v1 only used them through `/_next/image`, so no v1 URL links them. Copy them back to `public/` if external backlinks matter. |
| `/static/favicons/apple-touch-icon.png`, `safari-pinned-tab.svg` | 404 | 404 | Never existed (task 07 note) |
| `/stats/script.js` | 200 | 200 | Umami rewrite (the emulator proxies to `analytics.karhdo.dev`) |
| `/og/{slug}.png` (×3), `/og/default.png`, `/pagefind/pagefind.js`, `/static/giscus/tokyonight-{day,night}.css` | — | 200 | new |
| `/blog/`, `/about/` | — | 308 → no slash | adapter route; recorded: **redirect**, not 200 |
| `/dev/tokens` | — | 404 | dev pages are not built |
| `/blog/does-not-exist`, `/tags/does-not-exist` | — | 404 with the custom 404 page | |
| `/api/spotify`, `/api/token-burn` | — | 200 (`{"isPlaying":false}`, `{"available":false,"reason":"not-configured"}`) | never 5xx |
| `/api/github?repo=Karhdo/karhdo.dev` | — | 200 (`null` without a token, as in v1) | |
| `/api/github/activity`, `/api/stats?type=blog&slug=…`, `/api/stats/summary` | — | 503 (no env) | the designed empty state; 200 is expected on the preview |
| `/api/stats?type=snippet&slug=x` | — | 400 | |
| `POST /api/stats` with `Origin: https://evil.vercel.app` | — | 403 | |

Rerun on the preview without `--no-env`: `bun scripts/verify-urls.ts https://<preview>.vercel.app`.

## Feature parity

| v1 feature | v2 status | Verified how |
| ---------- | --------- | ------------ |
| Home: intro + typed bios | ✅ | render + screenshot |
| Home: Spotify now playing with progress | ✅ empty state locally; live data DEFERRED | `/api/spotify` → `{"isPlaying":false}`, card shows its idle state |
| Home: recent posts / latest post, popular tags | ✅ | render |
| New bento: Token burn, GitHub 46-week heatmap, Blog stats, Daily stack (14 tools), Selected projects | ✅ render and empty states; live numbers DEFERRED (Token burn on **Production** only) | screenshots of the no-env build |
| Local time / GMT+7 card | Intentionally removed; the HCMC time is in the footer statusline | |
| Snowfall (119 flakes, radius .8–2.6, speed .25–1.2, wind −.2–.4, opacity .15–.4) | ✅ | `src/components/snowfall/model.ts`; canvas present on `/` only, absent under reduced motion |
| Blog list, tag chips, pagination | ✅ | `/blog` (1 page), `/blog/page/1` → `/blog` |
| Post: title, tags, date, reading time, views, reactions, TOC, callouts/alerts, Expressive Code (title tab, language badge, copy, markers, line numbers, Tokyonight Day), image zoom, Twemoji, heading anchors, prev/next, scroll-top, Giscus, JSON-LD (`BlogPosting` + `Person`), reading progress, newsletter card | ✅ render; views/reactions/newsletter with real backends DEFERRED | HTML + screenshot + tour (Giscus iframe loads with CSP on). The newsletter card is hidden without `BUTTONDOWN_API_KEY`, as designed. |
| Tags index, tag pages, tag RSS | ✅ | URL table |
| Projects: work + side, GitHub stars/languages | ✅ static fallback without a token; live stars DEFERRED | `/projects` from the built function |
| About: author MDX, profile, career timeline, resume link | ✅ | render |
| Header: text wordmark, nav **Blog · Projects · About**, theme switch without flash, ⌘K search (lazy cmdk + Pagefind), analytics link, mobile nav | ✅ | built HTML + tour (palette found 2 results; theme toggle set `data-theme`) |
| Footer statusline (★ stars, version switcher, HCMC time, `#sha · committed …`, Made in Vietnam) | ✅ | screenshot: `karhdo.dev ★ 78`, `v2` (the branch label shows `main` on production), `#29e19d3 · committed … ago`. The time zone maths is covered by unit tests. |
| Version switcher → `v1.karhdo.dev` | ✅; the target isn't live yet (expected) | |
| RSS, sitemap, robots, SEO meta, OG images | ✅ (see bug 3 on the sitemap) | canonical, OG/Twitter meta, `rss+xml` alternate, per-post OG PNG |
| Umami tracking | DEFERRED | `UMAMI_WEBSITE_ID` is unset locally, so the script isn't rendered. `/stats/script.js` rewrite works. |
| Security headers, 404 | ✅ | check 3 |
| Buttondown subscribe end-to-end | DEFERRED | needs the real key |

Intentional differences (per spec): kbar → Pagefind ⌘K; react-snowfall → vanilla canvas (v1 count, larger and slower flakes); KaTeX and citations not ported (unused); tag sidebar → tag chips; v1 footer Signature + BuiltWith row → statusline; v1 avatar logo → text wordmark; v1 footer last-commit API call → build-time commit info; homepage clock card → Token burn. Found during this check: project screenshots are no longer at `/static/images/projects/*` (except `karhdo-blog.png`), `/blog/page/N` beyond the last page is a 404, and `/feed.xml` plus the tag feeds now work (they were 404 on live v1).

## Lighthouse

Lighthouse 13.5.0, headless Chrome 154, local emulator (see above), 3 runs per page, median. Build with the Giscus public vars and no secrets, so the live cards show their empty states and their 503s land in the console. **Treat these as indicative only:** the emulator has no HTTP/2, no Vercel edge and no CDN, and Lighthouse's simulated slow 4G on localhost differs from a real preview. Rerun on the preview (checklist 5.12).

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Perf runs |
| ---- | ---- | ---- | -- | --- | --- | --- | --- | --- | --------- |
| mobile `/` | **96** | 100 | 100 | **92** | 1.66 s | 2.71 s | 0 ms | 0.001 | 97/96/93 |
| mobile `/blog` | **99** | 100 | 100 | 100 | 1.36 s | 2.10 s | 0 ms | 0.002 | 99/98/99 |
| mobile `/blog/exploring-module-in-nestjs` | **84** | 96 | 96 | 100 | 2.10 s | 4.28 s | 0 ms | 0.000 | 83/96/84 |
| mobile `/projects` (built function) | **96** | 100 | 100 | 100 | 1.51 s | 2.70 s | 0 ms | 0.001 | 97/96/96 |
| mobile `/about` | **86** | 100 | 100 | 100 | 1.51 s | 4.21 s | 0 ms | 0.001 | 84/86/86 |
| desktop `/` | 100 | 100 | 96 | 92 | 0.51 s | 0.57 s | 0 ms | 0.000 | 100/100/100 |
| desktop `/blog` | 100 | 100 | 100 | 100 | 0.43 s | 0.48 s | 0 ms | 0.000 | 100/100/100 |
| desktop `/blog/exploring-module-in-nestjs` | 99 | 93 | 96 | 100 | 0.52 s | 0.90 s | 0 ms | 0.005 | 99/99/99 |
| desktop `/projects` | 100 | 100 | 100 | 100 | 0.48 s | 0.61 s | 0 ms | 0.000 | 100/100/100 |
| desktop `/about` | 99 | 100 | 100 | 100 | 0.46 s | 0.90 s | 0 ms | 0.000 | 99/99/99 |

Against the targets (Perf ≥ 95, or ≥ 90 on `/projects`; A11y/BP/SEO 100; LCP < 2 s; CLS < 0.05; TBT < 100 ms):

- **Met:** CLS (≤ 0.005 everywhere), TBT (0 ms everywhere), Perf on `/`, `/blog` and `/projects` (mobile and desktop), and every desktop Perf score.
- **Missed, mobile Perf on the post (84) and `/about` (86):** mostly bug 2 (a 349 KB `avatar.jpg` for a 32 px avatar, plus the unoptimized experience logos on `/about`). The rest is render-blocking CSS (750 ms est.), which the missing HTTP/2 in the emulator inflates.
- **Missed, mobile LCP:** above 2 s everywhere locally (2.1–4.3 s). Recheck on the preview before acting on it.
- **SEO 92 on `/`:** bug 1 (`crawlable-anchors`).
- **A11y 96/93 on the post:** Expressive Code token `color-contrast` (the accepted exception). Desktop also flags `target-size` on the small TOC-aside tag links (bug 5).
- **BP 96:** `errors-in-console`. These are the no-env 503s (`/api/github/activity`, `/api/stats*`) and, on the post, a **local-only** 403: `POST /api/stats` from `http://127.0.0.1:4728`, an origin that production builds don't allow, which is correct. Both should disappear on the preview with env vars.

Top opportunities:

1. Serve the post-header and `/about` avatar through `astro:assets` (bug 2): about 350 KB less on every post and on `/about`.
2. Optimize the `/about` experience logos (`uit-logo.png` 51 KB shown at logo size) and the markdown post images (`module-in-nestjs.png` etc.: no width/height, full-size PNG). Also fixes the `unsized-images` audit.
3. Render-blocking CSS: `PageLayout.*.css` (~18 KB) plus the base CSS. Measure on the preview before inlining anything.
4. The home HTML is 166 KB raw / 33 KB brotli (inline SVG icons for the stack marquee and project chips). Acceptable, but it's the largest document.
5. `label-content-name-mismatch` (desktop, not scored): the search button's `aria-label="Search"` doesn't contain its visible text "Search ⌘K" (bug 6).

## axe

axe-core 4.13.0 on `/`, `/blog`, 2 posts, `/tags`, `/tags/nestjs`, `/projects`, `/about`, and 404, in light and dark (via `prefers-color-scheme`) at 1280 and 390 px, after scrolling to the bottom (so every card and lazy section rendered). 36 page runs.

- **0 violations:** `/`, `/blog`, `/tags`, `/tags/nestjs`, `/projects`, `/about` in every combination.
- **Posts:** `color-contrast` on Expressive Code tokens (Day: 2.71–4.31:1, for example comments `#848cb5` on `#e9e9ed`; Night: comments `#51597d` on `#1a1b26`, 2.5:1). This is the **known, accepted exception**. It also includes the EC language badge `.ec-lang` (Day, 3.81:1), which is site chrome rather than a token (bug 4). `landmark-unique` (moderate): two scrollable `pre[role=region]` without labels on `/blog/exploring-module-in-nestjs` (EC-generated; bug 4).
- **404 at 1280 px, both themes:** `color-contrast` on the header nav links "Projects"/"About" (3.65:1 Day, 2.97:1 Night). It only happens while the page is scrolled so that the saturated blue "Back home" button sits behind the translucent `.glass` header. It is a scroll-position artifact, not a token problem (bug 3).

## No-env run

Build with **no** env vars (not even public ones) served by the emulator, pages screenshotted after scrolling. Every page returned its expected status with **0 page errors**:

- `/`: intro, latest post and Daily stack render. Now playing shows "Not playing · Offline · Spotify". Token burn shows "— tokens today", flat bars, "No API usage data". GitHub shows "Activity is unavailable right now · See it on GitHub" with "—" counters. Blog stats shows "Live stats unavailable · 3 posts published" with "—" reactions. Selected projects, recent posts and popular tags render. Snowfall canvas present. The footer statusline shows `★ 78`, `v2`, the HCMC time and `#29e19d3`.
- `/blog`, `/tags`, `/tags/nestjs`, `/about`, 404: complete.
- Post: complete. The views count is empty (`/api/stats` 503), reactions render, the newsletter card is hidden (no `BUTTONDOWN_API_KEY`, as designed), and the comments section is absent (no Giscus vars).
- `/projects` (built function, no `GITHUB_API_TOKEN`): static fallback data, 200.
- `/newsletter?status=invalid&from=/blog` (function): "That didn't work" plus the retry form.
- APIs: `/api/spotify` → `{"isPlaying":false}`, `/api/token-burn` → `{"available":false,"reason":"not-configured"}`, `/api/github?repo=…` → `null` (all 200). `/api/github/activity`, `/api/stats`, `/api/stats/summary` → the designed 503 empty-state bodies (`no-store`, or a 60 s CDN cache for activity).
- **JS disabled + OS dark:** every page renders with the Night tokens and dark Expressive Code frames (no `data-theme`, so the `prefers-color-scheme` fallback works). Content is complete.
- **Reduced motion:** 0 running animations on any page after load. The snowfall canvas stays uninitialised (default 300 px, never drawn).

## Bugs found

None of these block the preview. 1 and 2 are worth fixing before the merge. Nothing was changed in the code.

1. **Home SEO 92: Spotify title is an `<a>` without `href` when nothing is playing** (`crawlable-anchors`, mobile and desktop). *Where:* `src/components/home/SpotifyCard.astro:76-81` renders `<a data-sp-title …>` with no `href`, and the script removes `href` when offline (lines 298, 323). Idle is the common production state, so production is likely to score SEO 92 too. *Fix:* give the anchor a stable fallback `href` (for example the Spotify profile URL) and swap in `songUrl` when playing, or render the title as a `<span>` and wrap it in a link only when `songUrl` exists.
2. **349 KB avatar for a 32 px image on every post and on `/about`** (mobile Perf 84/86). *Where:* `src/components/blog/PostHeader.astro:49` (`<img src={avatar}>` with the author's `/static/images/avatar.jpg`) and `src/components/about/ProfileCard.astro:29`. The About timeline logos (`src/components/about/TimelineItem.astro:30`, from `public/static/images/experiences/`) are also unoptimized. *Fix:* import `~/assets/images/avatar.jpg` (already used by `IntroCard.astro`) and render `<Image src={avatar} width={32} height={32} densities={[1, 2]} quality={75} alt="" />`, and the same for the profile card. Move the experience logos to `src/assets/` and use `<Image quality={75}>`.
3. **`/newsletter` is in the sitemap although it is `noindex`**. `sitemap-0.xml` lists `https://karhdo.dev/newsletter`, and the comment in `src/pages/newsletter.astro` ("on-demand pages are not in the sitemap") is wrong: `@astrojs/sitemap` includes it. Search Console will report "Submitted URL marked noindex". *Fix:* in `astro.config.mjs`, `filter: (page) => !page.includes('/dev/') && new URL(page).pathname !== '/newsletter'`.
4. **Minor, Expressive Code chrome a11y:** the `.ec-lang` badge (`src/plugins/ec-language-badge.mjs`) is 3.81:1 in Day; use `--fg-soft` for it. Two unlabeled scrollable `pre[role=region]` trip `landmark-unique`. Optional: have the badge plugin add an `aria-label` (title or language) to scrollable `pre`s.
5. **Minor, touch targets:** the tag links in the post TOC aside (`.tag-label`, `text-xs`) fail Lighthouse `target-size` (desktop A11y 93, together with the EC contrast). *Fix:* give them `min-height: 24px` / `inline-flex` padding.
6. **Minor:** the glass header over the 404's blue "Back home" button drops the nav link contrast to 3.65:1 / 2.97:1 while scrolled (axe). A slightly more opaque `.glass` on the sticky header, or no saturated button right under it, fixes it. Also the search button's `aria-label="Search"` doesn't include its visible "⌘K" (`label-content-name-mismatch`, unscored): drop the `aria-label` and mark the `kbd` `aria-hidden`, or set `aria-label="Search (⌘K)"`.

Not bugs (for the record): `POST /api/stats` → 403 from `http://127.0.0.1:4728` (production builds allow only the site, `localhost:4321` and this deployment's `VERCEL_URL`/`VERCEL_BRANCH_URL`). Giscus can't load the theme CSS from an http localhost origin (local only). The Vite `MODULE_LEVEL_DIRECTIVE` build warnings are upstream Astro. The `ts(80007)` hint is in a test file. The local `.env` typo `NEXT_PUBLIC_GISCUS_REPOSITORY_ID==` is config, not code (checklist 2.5).

## Pre-launch checklist for the user

Do these in order. Every command is read-only unless marked otherwise.

### 1. Fix or accept the bugs, then push

1. Decide on bugs 1–3 below (small fixes in the owning tasks; 4–6 can wait). Commit `scripts/verify-urls.ts` and this report.
2. `git push origin v2`, then open a **draft PR `v2 → main`**. CI (`.github/workflows/ci.yml`) must be green.

### 2. Vercel project settings (before the preview build)

1. Settings → General: Framework **Astro**, Install `bun install --frozen-lockfile`, Build `bun run build` (both also in `vercel.json`), **Node.js 24.x**. No `bunVersion`.
2. "Automatically expose System Environment Variables": **on** (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_URL`, `VERCEL_BRANCH_URL`).
3. Env vars: confirm these exist for **Production and Preview** (names unchanged from v1): `POSTGRES_URL`, `GITHUB_API_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BUTTONDOWN_API_KEY`, `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`, `UMAMI_WEBSITE_ID`. `UMAMI_SHARE_URL` is unused and can be deleted later.
4. Add **`ANTHROPIC_ADMIN_API_KEY`** (`sk-ant-admin…`, ideally from a dedicated Anthropic org): **Production only**, never Preview or Development, marked **Sensitive**.
5. Local only: your `.env` has `NEXT_PUBLIC_GISCUS_REPOSITORY_ID==…` (two `=`), so locally the value starts with `=`. Fix it to a single `=`. Also check that the Vercel value has no leading `=`.
6. Redeploy the preview after any env change.

### 3. Spotify token

If `curl -s https://<preview>/api/spotify` stays `{"isPlaying":false}` while something is playing, regenerate `SPOTIFY_REFRESH_TOKEN` (README → "Regenerating the Spotify refresh token"), update Production + Preview, redeploy.

### 4. `stats_daily` migration (Neon branch, then production)

Follow `db/manual-migrations/README.md`, with `POSTGRES_URL_DIRECT` set explicitly (direct host, not `-pooler`):

1. Baseline (production): `psql "$POSTGRES_URL_DIRECT" -c 'SELECT count(*), sum(views), sum(loves+applauses+ideas+bullseye) FROM stats;'` and save the output with `\d stats` and `SELECT count(*) FROM _prisma_migrations;`.
2. Create a Neon branch of production, then run (**write**): `psql "$BRANCH_URL" -v ON_ERROR_STOP=1 -f db/manual-migrations/0001_create_stats_daily.sql`. Check that `\d stats_daily` matches `src/lib/db/schema.ts` (PK `stats_daily_pkey (type, slug, date)`, index `stats_daily_date_idx`), and that `stats` counts are unchanged.
3. Production (**write**): `psql "$POSTGRES_URL_DIRECT" -v ON_ERROR_STOP=1 -f db/manual-migrations/0001_create_stats_daily.sql`.
4. Re-run the baseline query: `count` and sums identical (or only higher, from live traffic); `\d stats` and `_prisma_migrations` unchanged. Record the date in the README table.
5. Compare with the task-05 numbers: counts may only have increased.

### 5. Preview checks (`P=https://<preview>.vercel.app`)

1. **URLs:** `bun scripts/verify-urls.ts $P` (no `--no-env`), which must print all passed, including the v1 sitemap paths. If Deployment Protection is on for previews, use a bypass token or check while signed in.
2. **Headers:** `curl -sI $P/ $P/blog/exploring-module-in-nestjs $P/api/spotify $P/static/resume.pdf`: all 7 headers on each (CSP, Referrer-Policy, X-Frame-Options, X-Content-Type-Options, X-DNS-Prefetch-Control, HSTS, Permissions-Policy). `curl -sI $P/sitemap.xml` → 308 to `/sitemap-index.xml`; `curl -sI $P/blog/page/1` → 308 to `/blog`; `curl -s $P/stats/script.js | head -c 100` is JavaScript.
3. **Giscus CORS:** `curl -sI -H "Origin: https://giscus.app" $P/static/giscus/tokyonight-day.css`: exactly **one** `access-control-allow-origin`, `content-type: text/css`.
4. **CDN cache:** run `curl -sI $P/api/spotify` twice within 30 s: the second has `x-vercel-cache: HIT` and `age` > 0, and the browser `cache-control` is `public, max-age=0, must-revalidate` with no `s-maxage`. Do the same for `/api/github?repo=Karhdo/karhdo.dev`, `/api/github/activity`, `/api/stats/summary`, `/api/token-burn` and `/projects`.
5. **Token burn on preview:** `curl -s $P/api/token-burn` → 200 `{"available":false,…}` (the key is Production-only).
6. **CSP + console:** open DevTools → Console and browse `/` → `/blog` (a ClientRouter navigation) → a post (scroll to Giscus, click a reaction) → `/tags` → `/projects` → `/about`, open ⌘K and search, toggle the theme: **0 CSP violations** (Giscus, Umami, Pagefind WASM, Spotify art).
7. **Giscus:** the comments iframe loads with the Tokyonight theme and follows the theme toggle.
8. **Stats:** viewing a post increments `views` (`GET /api/stats?...` before/after), and today's UTC `stats_daily` row increments: `SELECT * FROM stats_daily WHERE date = (now() at time zone 'utc')::date;`.
9. **Newsletter:** subscribe with a `+test` address (e.g. `you+v2test@…`). Expect the success message and the Buttondown confirmation email (double opt-in). Then **delete that subscriber** in Buttondown. Also try the no-JS path (JS disabled → `/newsletter?status=…`).
10. **Umami:** navigate 3 pages (including view-transition navigations) and check that the pageviews show in the Umami dashboard.
11. **Footer:** `★ N` equals `stargazers_count` at deploy time, `#sha` equals the preview commit, and the version switcher works with the keyboard.
12. **Lighthouse on the preview** (mobile, 3 runs, median) for `/`, `/blog`, `/blog/exploring-module-in-nestjs`, `/projects`, `/about`, with live cards (Spotify, GitHub, Blog stats) loaded. Targets: Perf ≥ 95 (≥ 90 `/projects`), A11y/BP/SEO 100, LCP < 2 s, CLS < 0.05, TBT < 100 ms.
13. **Theme / motion:** no flash on hard reload in both OS modes; with JS off and OS dark, dark tokens and dark code frames; reduced-motion walk-through.
14. **Admin key leak:** `vercel build` locally or on the preview output, then `grep -r sk-ant-admin .vercel/output/static` must be empty.

### 6. Vercel Firewall (dashboard → Firewall → Configure → New rule → Rate limit, keyed by IP, action 429)

- `POST /api/stats`: about 30 requests / 60 s per IP.
- `POST /api/newsletter`: 5 requests / 60 s per IP.

### 7. Merge and verify production

1. Merge PR `v2 → main` (Git deploy, so the platform merges `vercel.json`; **never** `astro build` + `vercel deploy --prebuilt` without `vercel build`).
2. `bun scripts/verify-urls.ts https://karhdo.dev`.
3. `curl -s https://karhdo.dev/api/token-burn` → `"available": true`; numbers match the Anthropic Console Usage/Cost pages for the same UTC days.
4. Repeat the 7-header curl and the `stats` count query (only increases).
5. Footer shows `main`, the right sha and stars.
6. Submit `https://karhdo.dev/sitemap-index.xml` in Google Search Console (the old `/sitemap.xml` redirects).

### 8. v1 subdomain

1. In Vercel, add the domain `v1.karhdo.dev` to a project/deployment built from the **`v1`** branch (e.g. a second project on the same repo with Production Branch = `v1`, or a branch domain), plus the DNS record.
2. On the `v1` branch, update `siteUrl` in `data/siteMetadata.js` to `https://v1.karhdo.dev` (canonical, sitemap, feed), and optionally add a switcher back to karhdo.dev.
3. Check that the footer version switcher's v1 link now resolves.

