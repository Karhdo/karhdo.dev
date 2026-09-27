# v2-astro: final verification (task 28)

Run on 2026-09-27 against commit `29e19d3` (branch `v2`), from a fresh local `git clone` into a scratch directory. Nothing was pushed or deployed, and no third-party account or the production database was touched. The first pass added only `scripts/verify-urls.ts` (the URL checker listed in the spec; committed with this report in `0c920f4`). **The 6 bugs it found were then fixed on top of `0c920f4` (uncommitted working tree) and re-measured: see [Re-verification after the fixes](#re-verification-after-the-fixes).**

## Verdict

**Ready for a Vercel preview.** All 6 bugs from the first pass are **fixed**. Every local check passes: URL parity with v1, the build and test suite, security headers, 0 CSP violations, the no-env build, and axe (0 violations outside the accepted Expressive Code token contrast). After the fixes, Lighthouse meets mobile Perf ≥ 95 and SEO 100 on `/`, the post and `/about` (96/96/97). The remaining gaps are all accepted or local-only: A11y 96 on the post (EC token contrast), BP 96 (console errors from the no-env 503s and a local-only 403), and mobile LCP around 2.5 s in the local emulator. Everything that needs a preview deploy, real keys or the production database is **deferred to you**; see the [pre-launch checklist](#pre-launch-checklist-for-the-user).

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
| 4 | Lighthouse, mobile + desktop, 3 runs, median | **PASS after fixes** (except the accepted EC contrast, the no-env console errors, and mobile LCP ≈ 2.5 s locally) | First pass: [Lighthouse](#lighthouse). After the fixes: [re-verification](#re-verification-after-the-fixes). A local approximation of Vercel. |
| 5 | axe (scrolled to the bottom), 9 pages × light/dark × 1280/390 px | **PASS** (after fixes: only the accepted EC token contrast) | First pass: 0 violations on `/`, `/blog`, `/tags`, `/tags/nestjs`, `/projects`, `/about`. Posts had EC `color-contrast` (accepted), plus EC `landmark-unique` and the `.ec-lang` badge (bug 4); the 404 at 1280 px had the glass header over the blue button (bug 6). After the fixes, both are gone: 36 runs, 0 violations except EC token `color-contrast` on the 2 posts. |
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

Found in the first pass, then **all fixed** in the follow-up (see [re-verification](#re-verification-after-the-fixes)). The descriptions below are from the first pass.

1. **[FIXED]** **Home SEO 92: Spotify title is an `<a>` without `href` when nothing is playing** (`crawlable-anchors`, mobile and desktop). *Where:* `src/components/home/SpotifyCard.astro:76-81` renders `<a data-sp-title …>` with no `href`, and the script removes `href` when offline (lines 298, 323). Idle is the common production state, so production is likely to score SEO 92 too. *Fix:* give the anchor a stable fallback `href` (for example the Spotify profile URL) and swap in `songUrl` when playing, or render the title as a `<span>` and wrap it in a link only when `songUrl` exists.
2. **[FIXED]** **349 KB avatar for a 32 px image on every post and on `/about`** (mobile Perf 84/86). *Where:* `src/components/blog/PostHeader.astro:49` (`<img src={avatar}>` with the author's `/static/images/avatar.jpg`) and `src/components/about/ProfileCard.astro:29`. The About timeline logos (`src/components/about/TimelineItem.astro:30`, from `public/static/images/experiences/`) are also unoptimized. *Fix:* import `~/assets/images/avatar.jpg` (already used by `IntroCard.astro`) and render `<Image src={avatar} width={32} height={32} densities={[1, 2]} quality={75} alt="" />`, and the same for the profile card. Move the experience logos to `src/assets/` and use `<Image quality={75}>`.
3. **[FIXED]** **`/newsletter` is in the sitemap although it is `noindex`**. `sitemap-0.xml` lists `https://karhdo.dev/newsletter`, and the comment in `src/pages/newsletter.astro` ("on-demand pages are not in the sitemap") is wrong: `@astrojs/sitemap` includes it. Search Console will report "Submitted URL marked noindex". *Fix:* in `astro.config.mjs`, `filter: (page) => !page.includes('/dev/') && new URL(page).pathname !== '/newsletter'`.
4. **[FIXED]** **Minor, Expressive Code chrome a11y:** the `.ec-lang` badge (`src/plugins/ec-language-badge.mjs`) is 3.81:1 in Day; use `--fg-soft` for it. Two unlabeled scrollable `pre[role=region]` trip `landmark-unique`. Optional: have the badge plugin add an `aria-label` (title or language) to scrollable `pre`s.
5. **[FIXED]** **Minor, touch targets:** the tag links in the post TOC aside (`.tag-label`, `text-xs`) fail Lighthouse `target-size` (desktop A11y 93, together with the EC contrast). *Fix:* give them `min-height: 24px` / `inline-flex` padding.
6. **[FIXED]** **Minor:** the glass header over the 404's blue "Back home" button drops the nav link contrast to 3.65:1 / 2.97:1 while scrolled (axe). A slightly more opaque `.glass` on the sticky header, or no saturated button right under it, fixes it. Also the search button's `aria-label="Search"` doesn't include its visible "⌘K" (`label-content-name-mismatch`, unscored): drop the `aria-label` and mark the `kbd` `aria-hidden`, or set `aria-label="Search (⌘K)"`.

Not bugs (for the record): `POST /api/stats` → 403 from `http://127.0.0.1:4728` (production builds allow only the site, `localhost:4321` and this deployment's `VERCEL_URL`/`VERCEL_BRANCH_URL`). Giscus can't load the theme CSS from an http localhost origin (local only). The Vite `MODULE_LEVEL_DIRECTIVE` build warnings are upstream Astro. The `ts(80007)` hint is in a test file. The local `.env` typo `NEXT_PUBLIC_GISCUS_REPOSITORY_ID==` is config, not code (checklist 2.5).

## Re-verification after the fixes

Working tree on top of `0c920f4`, synced into the scratch copy (no `.env`) and built with only the public Giscus vars, then served by the same emulator (ports 4728 / 9728, stopped afterwards).

### What changed

| Bug | Fix | Files |
| --- | --- | ----- |
| 1 Spotify `<a>` without `href` | The title renders as a `<span>`. The script swaps in an `<a href=songUrl target=_blank …>` only when a song URL exists, and swaps back when idle. Every attribute is copied across (class, `data-sp-title`, Astro's scoped `data-astro-cid-*`), so the fixed layout is unchanged. Checked idle (`<span>Not playing</span>`) and playing (mocked `/api/spotify` → `<a href="https://open.spotify.com/track/…">`). | `src/components/home/SpotifyCard.astro` |
| 2 Unoptimized avatar and logos | New `src/lib/local-assets.ts` (`import.meta.glob`) maps a `/static/images/**` path to its `src/assets` twin. `PostHeader` (32 px), `ProfileCard` (160 px, eager) and `TimelineItem` (48 px) now render `<Image quality={75} densities={[1, 2]}>`, with the plain `<img>` as a fallback for unknown paths. The logos are copied to `src/assets/experiences/`; the `public/` copies stay for v1 URL parity. The adapter snaps widths to `imagesConfig.sizes`, which started at 320, so `64, 96, 128, 160, 256` were added. The avatar now loads at `w=64` on posts and `w=160` / `320` (2x) on `/about`, instead of the 349 KB original. | `src/lib/local-assets.ts`, `src/components/blog/PostHeader.astro`, `src/components/about/{ProfileCard,TimelineItem}.astro`, `src/assets/experiences/*`, `src/config/experiences.ts` (comment), `astro.config.mjs` (`imagesConfig.sizes`) |
| 3 `/newsletter` in the sitemap | `filter: (page) => !page.includes('/dev/') && new URL(page).pathname !== '/newsletter'`; the page comment is corrected. `sitemap-0.xml` no longer lists it. | `astro.config.mjs`, `src/pages/newsletter.astro` |
| 4 EC badge contrast + `landmark-unique` | `.ec-lang` is now `light-dark(color-mix(in srgb, var(--muted) 60%, var(--fg)), color-mix(in srgb, var(--muted) 75%, var(--fg-soft)))`: 5.3:1 Day, about 5.5:1 Night (was 3.8:1 / 4.5:1). Each EC figure gets `data-ec-label` ("Code: <filename>" or "<LANG> code"). A plugin `jsModules` script, bundled into the external `/_astro/ec.*.js` so it stays CSP-safe, names every `pre[role=region]` that EC's own script creates, numbering repeats ("Code: app.module.ts (2)"). It re-runs on `astro:page-load` and when `role` changes, and leaves plain `pre`s unlabeled, since `aria-label` is prohibited on generic elements. | `src/plugins/ec-language-badge.mjs` |
| 5 TOC tag target size | TOC tags are `inline-flex min-h-6 items-center` (24 px tall); the row drops its `gap-y-1`, so the spacing looks the same. | `src/components/blog/TocMeta.astro` |
| 6 Header contrast + search name | The header card (`.site-glass`) uses `color-mix(in srgb, var(--surface-solid) 90%, transparent)` instead of `--surface` (55 %); the blur stays. Worst case (any token colour, even full `--fg` or white, right behind it): nav `--fg-soft` ≥ 5.3:1 Day and ≥ 5.4:1 Night. The search button has no `aria-label` now: its name is its text, "Search" (sr-only below `md`) plus the visible "⌘K", which reads "Search ⌘K" on desktop and "Search" on mobile. | `src/components/header/{Header,SearchTrigger}.astro` |

### Results

| Check | Result |
| ----- | ------ |
| `bunx biome ci .` | PASS (272 files) |
| `bun run lint:palette` | PASS |
| `bunx astro check` | PASS: 0 errors, 0 warnings, 1 hint (unchanged, test file) |
| `bun test` | PASS: 428/428 |
| Scratch build | PASS: no deprecation warnings; `/newsletter` gone from `sitemap-0.xml` |
| `bun scripts/verify-urls.ts http://127.0.0.1:4728 --no-env` | PASS: 57/57 |
| CSP tour (same route as check 3b) | PASS: 0 violations; ⌘K still finds 2 results |
| axe, 9 pages × light/dark × 1280/390 px | PASS: 0 violations except the accepted EC token `color-contrast` on the 2 posts. `landmark-unique`, `.ec-lang` and the 404 header are gone. |
| Accessible names | Scrollable code frames: "Code: modules/product/product.module.ts", "… (2)", "… (3)", "Code: app.module.ts", …, "TS code". Search button: "Search ⌘K" (desktop) / "Search" (390 px). TOC tag links: 24 px tall. |

### Lighthouse after the fixes (median of 3)

| Page | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Perf runs | Before (Perf/A11y/BP/SEO) |
| ---- | ---- | ---- | -- | --- | --- | --- | --- | --- | --------- | ------------------------- |
| mobile `/` | **96** | 100 | 100 | **100** | 1.66 s | 2.63 s | 0 ms | 0.001 | 94/96/96 | 96/100/100/92 |
| mobile `/blog/exploring-module-in-nestjs` | **96** | 96 | 96 | 100 | 1.73 s | 2.48 s | 0 ms | 0.001 | 96/95/97 | 84/96/96/100 |
| mobile `/about` | **97** | 100 | 100 | 100 | 1.51 s | 2.56 s | 0 ms | 0.001 | 97/95/97 | 86/100/100/100 |
| desktop `/` | 100 | 100 | 96 | **100** | 0.51 s | 0.57 s | 0 ms | 0.000 | 100/100/100 | 100/100/96/92 |
| desktop `/blog/exploring-module-in-nestjs` | 100 | **96** | 96 | 100 | 0.53 s | 0.57 s | 0 ms | 0.032 | 100/100/100 | 99/93/96/100 |
| desktop `/about` | 100 | 100 | 100 | 100 | 0.47 s | 0.55 s | 0 ms | 0.000 | 100/100/100 | 99/100/100/100 |

What's left, all accepted or local-only:

- **A11y 96 on the post:** only EC token `color-contrast` (accepted). `target-size` now passes.
- **BP 96:** `errors-in-console`, from the no-env 503s (`/api/github/activity`, `/api/stats*`) and, on the post, the local-only 403 (the emulator's `127.0.0.1:4728` origin isn't allowed by a production build). Expect 100 on the preview with env vars.
- **Mobile LCP ≈ 2.5–2.6 s** (target < 2 s) and render-blocking CSS: measure on the preview (HTTP/2, real CDN) before acting.
- **Desktop post CLS rose from 0.005 to 0.032** (still under 0.05). Lighthouse attributes it to a code-block `figure` pushed down when the first **unsized lazy markdown image** (`/static/images/blogs/module-in-nestjs.png`, no width/height) loads. That image loads earlier now that the 349 KB avatar no longer competes for bandwidth. It was already flagged as `unsized-images` in the first pass and is **outside the 6 fixes**. Suggested follow-up: have `src/components/mdx/MdxImage.astro` read the intrinsic size of `/static/...` images at build (e.g. `sharp(...).metadata()`, or move post images to `src/content/` and let `astro:assets` handle them), then emit `width`/`height`. That also removes the last ~19 KB `image-delivery` saving on the post.
- **Home intro avatar** (72 px shown, `width={144}`) now snaps to `w=128` instead of `w=320`, a side effect of the new small sizes. That's about 1.8x density, visually indistinguishable. Add `144` to `imagesConfig.sizes` if you want exact 2x.

## Pre-launch checklist for the user

Do these in order. Every command is read-only unless marked otherwise.

### 1. Fix or accept the bugs, then push

1. Bugs 1–6 are fixed in the working tree (see re-verification). Commit them (for example `fix(verify): resolve final-verification findings`), and optionally fix the unsized markdown images (follow-up below).
2. `git push origin v2`, then open a **draft PR `v2 → main`**. CI (`.github/workflows/ci.yml`) must be green.

### 2. Vercel project settings (before the preview build)

1. Settings → General: Framework **Astro**, Install `bun install --frozen-lockfile`, Build `bun run build` (both also in `vercel.json`), **Node.js 24.x**. No `bunVersion`.
2. "Automatically expose System Environment Variables": **on** (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_URL`, `VERCEL_BRANCH_URL`).
3. Env vars: confirm these exist for **Production and Preview** (names unchanged from v1): `POSTGRES_URL`, `GITHUB_API_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BUTTONDOWN_API_KEY`, `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`, `UMAMI_WEBSITE_ID`. `UMAMI_SHARE_URL` is unused and can be deleted later.
4. Add **`TOKEN_BURN_SUMMARY_URL`** (`https://api.github.com/repos/Karhdo/token-burn/contents/public/summary.json`) for Production and Preview; `GITHUB_API_TOKEN` must be able to read that private repo. *(Replaces the removed `ANTHROPIC_ADMIN_API_KEY`.)*
5. Local only: your `.env` has `NEXT_PUBLIC_GISCUS_REPOSITORY_ID==…` (two `=`), so locally the value starts with `=`. Fix it to a single `=`. Also check that the Vercel value has no leading `=`.
6. Redeploy the preview after any env change.

> **Vercel env, 2026-09-27:** `TOKEN_BURN_SUMMARY_URL` added (all environments); the three `SPOTIFY_*` values updated to the new app; `ENABLE_EXPERIMENTAL_COREPACK` removed from Preview and Development (Corepack rejects `bun`, so every v2 build failed). **At the v2 cutover, also remove it from Production**, or the production build fails the same way.

### 3. Spotify token

> **2026-09-27:** the token endpoint returns `invalid_client`, so the client ID/secret pair itself is rejected (secret rotated or app deleted), not just the refresh token. Update `SPOTIFY_CLIENT_SECRET` from the Spotify dashboard (or create a new app + refresh token), then Production + Preview.

If `curl -s https://<preview>/api/spotify` stays `{"isPlaying":false}` while something is playing, regenerate `SPOTIFY_REFRESH_TOKEN` (README → "Regenerating the Spotify refresh token"), update Production + Preview, redeploy.

### 4. `stats_daily` migration (Neon branch, then production)

> **Done 2026-09-27:** applied to production (validated on a throwaway Postgres 17 instead of a Neon branch); `stats` unchanged. Skip steps 1-3.

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
5. **Token burn on preview:** `curl -s $P/api/token-burn` → 200 `{"available":true,…}` with today's Claude Code tokens.
6. **CSP + console:** open DevTools → Console and browse `/` → `/blog` (a ClientRouter navigation) → a post (scroll to Giscus, click a reaction) → `/tags` → `/projects` → `/career` → `/about`, open ⌘K and search, toggle the theme: **0 CSP violations** (Giscus, Umami, Pagefind WASM, Spotify art).
7. **Giscus:** the comments iframe loads with the Tokyonight theme and follows the theme toggle.
8. **Stats:** viewing a post increments `views` (`GET /api/stats?...` before/after), and today's UTC `stats_daily` row increments: `SELECT * FROM stats_daily WHERE date = (now() at time zone 'utc')::date;`.
9. **Newsletter:** subscribe with a `+test` address (e.g. `you+v2test@…`). Expect the success message and the Buttondown confirmation email (double opt-in). Then **delete that subscriber** in Buttondown. Also try the no-JS path (JS disabled → `/newsletter?status=…`).
10. **Umami:** navigate 3 pages (including view-transition navigations) and check that the pageviews show in the Umami dashboard.
11. **Footer:** `★ N` equals `stargazers_count` at deploy time, `#sha` equals the preview commit, and the version switcher works with the keyboard.
12. **Lighthouse on the preview** (mobile, 3 runs, median) for `/`, `/blog`, `/blog/exploring-module-in-nestjs`, `/projects`, `/career`, `/about`, with live cards (Spotify, GitHub, Blog stats) loaded. Targets: Perf ≥ 95 (≥ 90 `/projects`), A11y/BP/SEO 100, LCP < 2 s, CLS < 0.05, TBT < 100 ms.
13. **Theme / motion:** no flash on hard reload in both OS modes; with JS off and OS dark, dark tokens and dark code frames; reduced-motion walk-through.
14. **Admin key leak:** `vercel build` locally or on the preview output, then `grep -r sk-ant-admin .vercel/output/static` must be empty.

### 6. Vercel Firewall (dashboard → Firewall → Configure → New rule → Rate limit, keyed by IP, action 429)

- `POST /api/stats`: about 30 requests / 60 s per IP.
- `POST /api/newsletter`: 5 requests / 60 s per IP.

### 7. Merge and verify production

1. Merge PR `v2 → main` (Git deploy, so the platform merges `vercel.json`; **never** `astro build` + `vercel deploy --prebuilt` without `vercel build`).
2. `bun scripts/verify-urls.ts https://karhdo.dev`.
3. `curl -s https://karhdo.dev/api/token-burn` → `"available": true`; numbers match `public/summary.json` in `Karhdo/token-burn` for the same ICT days.
4. Repeat the 7-header curl and the `stats` count query (only increases).
5. Footer shows `main`, the right sha and stars.
6. Submit `https://karhdo.dev/sitemap-index.xml` in Google Search Console (the old `/sitemap.xml` redirects).

### 8. v1 subdomain

1. In Vercel, add the domain `v1.karhdo.dev` to a project/deployment built from the **`v1`** branch (e.g. a second project on the same repo with Production Branch = `v1`, or a branch domain), plus the DNS record.
2. On the `v1` branch, update `siteUrl` in `data/siteMetadata.js` to `https://v1.karhdo.dev` (canonical, sitemap, feed), and optionally add a switcher back to karhdo.dev.
3. Check that the footer version switcher's v1 link now resolves.

