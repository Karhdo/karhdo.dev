# 09 — Header, mobile nav, theme toggle, footer with statusline and version switcher

## Endpoint

None. The footer data (stars, commit, branch) is resolved **at build time** and baked in; nothing in the footer calls an API at runtime.

## Summary

Build the persistent site chrome.

**Header.** A glassy sticky header with the logo, the nav from `HEADER_NAV_LINKS` (**Blog · Projects · About**, exactly v1's order), the ⌘K search trigger, the theme toggle and the analytics link, plus an accessible mobile menu.

**Footer** (mockup `footer.site`, `.foot-top` and `.statusline`):

- **Top row:** the animated `Wordmark` (no dot) and the site description, then three link columns: **Site** (Blog, Projects, Tags, RSS feed), **Personal** (About, Resume → `/static/resume.pdf`, Analytics → `SITE.analyticsURL`) and **Elsewhere** (GitHub, LinkedIn, Twitter). This is the v1 parity from reviewer m2.
- **Neovim-style statusline** in the mono font, using design tokens only. Segments, left to right:
  1. `karhdo.dev ★ <stars>`: the "mode" segment, linking to the repo.
  2. **Version switcher** (git-branch icon, branch, chevron), opening a menu of site versions.
  3. `Ho Chi Minh, Viet Nam` with a map-pin icon.
  4. Live HCMC time plus "same time / Nh ahead / Nh behind".
  5. Spacer.
  6. `#<short sha> · committed <relative time>`.
  7. The "Made in Vietnam" badge.

The statusline fits on one row at ≥ 1024 px and stacks one segment per row at ≤ 600 px (mockup media rule). All interactivity is small vanilla scripts, no React. They re-initialise on `astro:page-load`; the header uses `transition:persist`.

v1's `Signature.tsx` SVG and the `BuiltWith` icon row are **not** carried over: the mockup footer replaces them. This is listed as an intentional difference in task 28.

## Files to Create/Modify/Delete

**Header**

- **Create** `src/components/header/Header.astro`: `<header transition:persist class="glass sticky top-0 z-50">`. The active link state comes from `Astro.url.pathname.startsWith(href)` and is updated on `astro:after-swap` by script, because the header persists. It contains `<Wordmark placement="header" />`, nav, `SearchTrigger`, `ThemeToggle` and `MobileNav`.
- **Create** `src/components/brand/Wordmark.astro` (item 5; mockup `.brand`, `.wm`, `.ch` and the "wordmark: decode on load, wave on hover" script). The header brand is **the text wordmark only**: no avatar `Logo` image, no green dot, no caret. The avatar stays on the homepage intro card (15) and the about page (16). The footer top row uses the same component.
  - **Markup**: `<a class="brand" href="/" aria-label="karhdo.dev, home">`, then `<span class="wm" aria-hidden="true">` with one `<span class="ch" style="--i:N">` per character of `karhdo.dev` (N = 0–9). The `.dev` chars get `.tld` (`--blue`); the rest use `--fg`, weight 700, 18 px. The server-rendered text is the real name, so it's correct with no JS.
  - **Underline, hover/focus only (like v1)**: `.wm{position:relative; padding-bottom:5px}` and `.wm::after{content:""; position:absolute; left:0; width:75%; bottom:0; height:2px; border-radius:2px; background:var(--green); transform-origin:left; transform:scaleX(0)}`, with `.brand:hover .wm::after, .brand:focus-visible .wm::after{transform:scaleX(1)}`. It is **hidden at rest** and covers 75 % of the width, left-aligned. With `prefers-reduced-motion: no-preference` it gets `transition: transform .5s var(--ease-out)`; under reduced motion it appears instantly. There is no load-time animation and no retract/redraw animation of the underline, in the header or the footer; the only underline motion is the hover/focus transition.
  - **Motion**, only under `prefers-reduced-motion: no-preference`; otherwise it's static text:
    1. **Decode**, header only, **once per browser session** (the `sessionStorage['wm-decoded']` read/write is wrapped in try/catch; if storage throws, it decodes at most once per page load), and never on ClientRouter navigations (the header is `transition:persist`). Each `.ch` cycles random glyphs from `abcdefghijklmnopqrstuvwxyz0123456789<>/_#$%&*` via rAF and settles left to right at `180 ms + i × 55 ms`. Scrambled chars get `.scr` (`--purple`, same font). Each `.ch` width is locked to its measured final width during the decode, so the proportional font doesn't jitter. **Safety net**: a `setTimeout` at `180 + 10 × 55 + 400 ms` always restores the real text and clears `.scr` and the locked widths. It also sets a `finished` flag, and **each rAF step checks `finished` first and returns immediately**. The decode timing uses `performance.now()` (captured as `t0` at start and compared inside each step), not the rAF timestamp, so a throttled or virtual-time rAF that fires after the timeout can never overwrite the restored text. When all chars settle normally, `finished` is set too and the timeout is cleared.
    2. **Hover/focus wave** (header and footer): on `pointerenter`/`focus`, re-add `.wave` (remove → reflow → add). Each `.ch` plays `chWave` (translateY −5 px with a `--cyan` flash, .55 s `--ease-spring`, delay `--i × 32 ms`). `.wave` is removed on the last char's `animationend`.
  - **Script**: `src/components/brand/wordmark.ts`, vanilla with no React. It binds on `astro:page-load` with a per-element `data-wm-bound` guard, so re-init re-binds new footer instances but **never re-runs the decode**. It checks `matchMedia('(prefers-reduced-motion: reduce)')` on each run and does nothing when it matches. The `chWave` keyframes live in `animations.css` (06).
- **Create** `src/components/header/ThemeToggle.astro`: a button cycling `light → dark → system`, with Sun/Moon/Monitor icons and an `aria-label` announcing the next state. Its script:
  - writes `localStorage.theme`;
  - sets `document.documentElement.dataset.theme` to the resolved `light|dark`;
  - updates the `theme-color` meta;
  - dispatches `window.dispatchEvent(new CustomEvent('theme-change', { detail: { dark } }))` (consumed by Giscus in task 21);
  - **Circular theme reveal (item 5).** When `document.startViewTransition` exists, reduced motion is off, and no Astro navigation transition is in flight (tracked via `astro:before-preparation` / `astro:after-swap`):
    - set `document.documentElement.dataset.themeSwitching = ''`;
    - call `const t = document.startViewTransition(() => apply(next))`;
    - on `t.ready`, run `document.documentElement.animate({ clipPath: ['circle(0 at X Y)', 'circle(R at X Y)'] }, { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' })`. X/Y is the toggle button's centre, and R is `Math.hypot(max(X, innerWidth − X), max(Y, innerHeight − Y))`;
    - on `t.finished`, remove the attribute.
      The CSS `::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal }` is **scoped to `html[data-theme-switching]`**, so it doesn't disable ClientRouter's page transitions. With no support or with reduced motion, the theme switches instantly.
- **Nav pill (item 5).** The active nav link is rendered as a pill (a `--surface-solid` background, a `--line-strong` ring) and gets `style="view-transition-name: nav-pill"` **only while it has `aria-current="page"`**. Because the header is `transition:persist`, the script moves `aria-current` (and with it the `view-transition-name`) inside the `astro:after-swap` handler. That handler runs inside the ClientRouter's update callback, so the view transition captures the old pill on the old link and the new pill on the new link, and the `nav-pill` group glides between them (`::view-transition-group(nav-pill) { animation-duration: .35s; animation-timing-function: var(--ease-spring) }`, motion-safe). Only one element may carry the name at a time.
- **Create** `src/components/header/SearchTrigger.astro`: a button with a `⌘K`/`Ctrl K` hint (platform detected in script) that dispatches the `open-command-palette` event (task 23 listens).
- **Create** `src/components/header/MobileNav.astro`: a `<dialog>`-based full-screen menu (focus trap and Esc for free). It closes on link click and on `astro:before-swap`, and locks body scroll via `overflow: hidden` on `<html>` while open (replaces `body-scroll-lock`).
- **Create** `src/components/header/AnalyticsLink.astro`: links to `SITE.analyticsURL` (v1 `AnalyticsLink.tsx`).

**Footer: top row**

- **Create** `src/components/footer/Footer.astro`: `<footer class="border-t border-line …">` containing `FooterTop` and `Statusline`.
- **Create** `src/components/footer/FooterTop.astro`: `.foot-brand` (`<Wordmark placement="footer" />`, linking to `/`, plus `SITE.description` in `--fg-soft`) and `.foot-cols` with three `<h4>` columns (mono, uppercase, `--faint`), fed by `FOOTER_COLUMNS` in `src/config/navigation.ts`:
  - Site: `/blog`, `/projects`, `/tags`, `/feed.xml`
  - Personal: `/about`, `/static/resume.pdf`, `SITE.analyticsURL`
  - Elsewhere: `SITE.github`, `SITE.linkedin`, `SITE.twitter`
    External links get `rel="noopener noreferrer"` and `data-umami-event="footer-<name>"`.
- **Modify** `src/config/navigation.ts`: replace `FOOTER_NAV_LINKS` / `FOOTER_PERSONAL_STUFF` with the typed `FOOTER_COLUMNS: { title: 'Site' | 'Personal' | 'Elsewhere'; links: { href; title }[] }[]`.

**Footer: statusline**

- **Create** `src/components/footer/Statusline.astro`: mockup `.sl-wrap` > `.statusline` (`role="contentinfo"` is **not** reused because the `<footer>` already has that role; use `aria-label="Site status"` on a `<div>`). It renders these segments:
  1. **Mode segment**: `<a class="sl-mode" href={SITE.siteRepo}>karhdo.dev <StarIcon/> <span>{stars}</span></a>`, with a `--blue` background and `--bg` text. When `stars` is `null`, the star icon and number are omitted and the link text stays `karhdo.dev`.
  2. **`VersionSwitcher`** (below).
  3. **Location**: map-pin icon + `SITE.location` ("Ho Chi Minh, Viet Nam").
  4. **Time**: `<span class="sl-live">` dot + `<time data-hcm-time>` + `<span data-hcm-diff>`. It is server-rendered with the **build-time** HCMC time (`HH:mm`) and **no diff text**, so it reads correctly without JS apart from being stale. The script replaces it immediately with the live value.
  5. **Spacer** (`flex: 1`, hidden ≤ 600 px).
  6. **Commit**: `<a href="https://github.com/Karhdo/karhdo.dev/commit/{sha}">`, containing `<span class="sl-hash">#{shortSha}</span>` and `<span data-committed-at={iso}>· committed {relative at build}</span>`. The script re-renders the relative time in the visitor's browser. When the sha is unknown the whole segment is omitted; when only the date is unknown, just the hash is shown.
  7. **Badge**: `<a class="sl-miv" href={SITE.siteRepo} data-umami-event="made-in-vietnam">` with `src/assets/icons/miv.svg` (moved in task 01) as an Astro SVG component, `aria-label="Made in Vietnam"`, height 18–20 px.
- **Create** `src/components/footer/VersionSwitcher.astro`, following the mockup `#ver-btn`, `#ver-menu` and `.ver-item`:
  - **Button**: `<button class="sl-branch" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="ver-menu" hidden>` with a git-branch icon, the current branch label and a chevron.
  - **Menu**: `<div id="ver-menu" role="menu" aria-label="Site versions" hidden>` positioned above the statusline, with heading "Switch version". There is one `<a role="menuitem" class="ver-item" href={v.url}>` per entry in `SITE.versions`, showing the branch (`--green`), the `stack` line and the `host` (derived from `new URL(url).host`, with ` ↗` for external items).
  - **Current item**: gets a check icon and `aria-current="true"`. It is the item whose `branch` equals the build branch; if no item matches (e.g. a preview of a feature branch), the item with `current: true` in config gets it, and the button label shows the build branch name.
  - **Without JS**: the button stays `hidden` and a `<noscript>` segment renders a plain `<a href="https://v1.karhdo.dev">v1 ↗</a>` (every non-current version as a link), so v1 stays reachable.
  - **Script**, vanilla, bound on `astro:page-load` and removed on `astro:before-swap`:
    - un-hides the button;
    - click toggles the menu;
    - opening focuses the first item and clamps the menu inside `.sl-wrap` (mockup `vSet`);
    - an outside click closes it;
    - Esc closes it and returns focus to the button;
    - ArrowDown/ArrowUp cycle through the items, and Home/End jump to the first/last;
    - Tab out of the menu closes it;
    - the `pop` animation runs only under `prefers-reduced-motion: no-preference`.
- **Create** `src/components/footer/statusline.ts`: the bundled client script for segments 4 and 6. It uses `formatHcmTime(now, SITE.timezone)` and `describeOffset(visitorOffsetMin, hcmOffsetMin)` from `src/lib/utils/local-time.ts`, and `formatRelative(committedAt, now)` from `src/lib/utils/relative-time.ts` (and `BUILD_INFO` from `src/lib/build-info.ts` for the values). It ticks every 30 s, pauses while `document.hidden`, and clears the interval on `astro:before-swap`.
- **Modify** `src/config/site.ts`: add `location: 'Ho Chi Minh, Viet Nam'`, `timezone: 'Asia/Ho_Chi_Minh'` (IANA) and `versions`. The versions are typed, and the type survives `as const` through `satisfies`:
  ```ts
  export type SiteVersion = { branch: string; stack: string; url: string; current?: boolean };
  versions: [
    { branch: 'main', stack: 'Astro × Bun', url: 'https://karhdo.dev', current: true },
    { branch: 'v1', stack: 'Next.js 16 × pnpm', url: 'https://v1.karhdo.dev' },
  ] satisfies SiteVersion[],
  ```
  **Note:** `v1.karhdo.dev` does not exist yet. The user will point that domain at the v1 branch after v2 ships. Until then the link 404s/NXDOMAINs, which is accepted and listed in task 28. A matching switcher on the v1 branch pointing back to karhdo.dev is a **follow-up outside this plan**.
- **Create** `src/lib/utils/local-time.ts` (pure, tested):
  - `formatHcmTime(date, timeZone)` → `HH:mm` via `Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })`.
  - `getZoneOffsetMinutes(date, timeZone)`: derived from `Intl` parts, so it's DST-safe; no hard-coded `420`.
  - `describeOffset(visitorOffsetMin, zoneOffsetMin)` → `same time` | `2h ahead` | `5h30m behind` | `45m ahead`. It handles half-hour and 45-minute zones; "ahead"/"behind" means HCMC relative to the visitor.
- **Create** `src/lib/utils/local-time.test.ts`: covers visitor UTC+7 → `same time`; UTC → `7h ahead`; UTC+9:30 → `2h30m behind`; UTC+5:45 → `1h15m ahead`; UTC−8 → `15h ahead`; and a formatting check at midnight → `00:00`.
- **Create** `scripts/build-info.mjs`: `resolveBuildInfo()` runs **only inside `astro.config.mjs` at build/dev start** and never in a function.
  - `sha`: `process.env.VERCEL_GIT_COMMIT_SHA`, else `git rev-parse HEAD`, else `null`.
  - `shortSha`: the first 7 characters of `sha`.
  - `committedAt`: `git log -1 --format=%cI` (works on Vercel's shallow clone for HEAD). If git is unavailable or fails, it falls back to GitHub REST `GET /repos/Karhdo/karhdo.dev/commits/{sha}` → `commit.committer.date`, else `null`. Vercel has no commit-date env var; the other `VERCEL_GIT_COMMIT_*` values are used where they exist.
  - `branch`: `VERCEL_GIT_COMMIT_REF`, else `git branch --show-current`, else `'main'`.
  - `stars`: GitHub REST `GET https://api.github.com/repos/Karhdo/karhdo.dev` → `stargazers_count`, with `Authorization: Bearer ${GITHUB_API_TOKEN}` when the token is present (read via Vite `loadEnv` in the config) and unauthenticated otherwise. It has a 5 s timeout and gives `null` on any failure.
  - Every git or network call is wrapped in try/catch, so **the build never fails** because of build info.
- **Modify** `astro.config.mjs`: `const buildInfo = await resolveBuildInfo();` then `vite: { define: { __BUILD_INFO__: JSON.stringify(buildInfo) } }`. The same constant is baked into prerendered pages **and** into the on-demand `/projects` function, which therefore never runs git at runtime.
- **Create** `src/lib/build-info.ts` (M-D): `declare const __BUILD_INFO__: BuildInfo | undefined;` and `export const BUILD_INFO: BuildInfo = typeof __BUILD_INFO__ !== 'undefined' ? __BUILD_INFO__ : FALLBACK_BUILD_INFO`, where `FALLBACK_BUILD_INFO = { sha: null, shortSha: null, committedAt: null, branch: 'main', stars: null }`. The type is `{ sha: string | null; shortSha: string | null; committedAt: string | null; branch: string; stars: number | null }`. This keeps the module importable under `bun test`, where the Vite `define` doesn't exist and a bare reference would throw a ReferenceError.
- **Create** `src/lib/utils/relative-time.ts` (pure, no build-time globals): `formatRelative(iso, now = Date.now(), locale = 'en')` using `Intl.RelativeTimeFormat` with `numeric: 'auto'`. It picks the largest unit of years, months (30.44 d), weeks, days, hours or minutes, giving "just now" under 1 minute and "8 months ago". An invalid ISO returns `null`.
  The GitHub REST star call lives in `scripts/build-info.mjs` (config-time). It **always sends `Authorization: Bearer ${GITHUB_API_TOKEN}` when the token is present** (m5), falling back to unauthenticated only when it's absent, to avoid the 60 req/h anonymous limit on busy build machines. Task 20's `src/lib/services/github.ts` (runtime GraphQL) is separate, because config code can't import `astro:env`. Both read the same `GITHUB_API_TOKEN`.
- **Create** `src/lib/utils/relative-time.test.ts`: `formatRelative` for 30 s, 5 min, 3 h, yesterday (`numeric: 'auto'` → "yesterday"), 2 weeks, 8 months and 2 years; an invalid ISO → `null`.
- **Modify** `src/layouts/PageLayout.astro`: render `<Header slot="header" />` and `<Footer slot="footer" />`.
- **Note:** the star count and the commit sha refresh on each deploy (they're build-time values), which is accepted. The relative commit time and the HCMC clock stay live in the browser.

## Implementation Steps

1. Read the mockup `footer.site`, `.foot-*`, `.sl-*`, `.ver-*` CSS/markup and the `slTick` + "version switcher" scripts, plus `git show main:components/header/*.tsx main:components/footer/*.tsx` for v1 content.
2. Implement the header and theme toggle script (`document.addEventListener('astro:page-load', init)`, guarding against double-binding because the header persists).
3. Implement the mobile nav with `<dialog>`; test the keyboard: Tab order, Esc closes, focus returns to the burger button.
4. Implement `resolveBuildInfo()` and the Vite `define`; log the resolved build info once at build start.
5. Implement the pure helpers and their tests, then the statusline and version switcher components and scripts.
6. Check the layout at 375, 600, 768, 1024 and 1280 px, in both themes, and with JS disabled.
7. Simulate failures: build with `GITHUB_API_TOKEN` unset and the network blocked (e.g. `HTTPS_PROXY=http://127.0.0.1:9`), and with `.git` absent (`git archive` into a temp dir). The build must still succeed with the segments degraded.

## Acceptance Criteria

- [ ] `bun run build` succeeds, including with no network, no `GITHUB_API_TOKEN` and no `.git` (stars hidden, commit segment hidden or hash-only).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (`local-time` offsets incl. half-hour and 45-minute zones; `relative-time`); importing `src/lib/build-info.ts` under `bun test` doesn't throw (falls back to `FALLBACK_BUILD_INFO`).
- [ ] Theme toggle cycles light/dark/system, persists across reload and view-transition navigation, and never flashes.
- [ ] Wordmark (header + footer): text only, with no avatar image, dot or caret in the header; screen readers announce "karhdo.dev, home" once. **No underline at rest.** A green underline at 75 % width, left-aligned, appears on hover **and** keyboard focus (animated in over .5 s when motion is allowed, instant under reduced motion). With motion allowed, the header decodes once per session (not on navigations or same-session reloads), with purple glyphs and no width jitter, landing on the real text within about 1.3 s even in a throttled tab, and staying on it afterwards: late rAF callbacks after the safety timeout never re-scramble (check with DevTools CPU throttling or background-tab throttling); hover/focus plays the letter wave. With reduced motion or no JS it's static text, correct from the server HTML.
- [ ] Theme toggle: a circle expands from the button in Chrome/Safari 18+ when motion is allowed; the switch is instant with reduced motion or without `startViewTransition`; toggling during a page navigation doesn't throw or break the navigation.
- [ ] Nav pill glides from the old active link to the new one on ClientRouter navigation (Chrome), and jumps instantly with reduced motion or in browsers without view transitions.
- [ ] Header nav shows exactly **Blog · Projects · About** (v1 `HEADER_NAV_LINKS`; Tags stays out of the header, as in v1).
- [ ] Current page link has `aria-current="page"` after client-side navigation.
- [ ] Mobile menu opens and closes via the button and Esc, traps focus, locks scroll, and closes on navigation.
- [ ] Footer top shows the brand and description, plus the Site / Personal / Elsewhere columns with the exact links listed above (Resume → `/static/resume.pdf`, Analytics → `SITE.analyticsURL`).
- [ ] **Stars**: the mode segment shows `★ N`, where N equals `stargazers_count` from `api.github.com/repos/Karhdo/karhdo.dev` at build time; with the fetch blocked it shows just `karhdo.dev`.
- [ ] **Time diff**: with Chrome DevTools timezone overrides, `Asia/Ho_Chi_Minh` → "same time", `Europe/London` (winter) → "7h ahead", `Australia/Adelaide` → "…h30m behind", `Asia/Kathmandu` → "1h15m ahead"; the clock ticks.
- [ ] **SHA**: the commit segment shows `#<first 7 of VERCEL_GIT_COMMIT_SHA or git HEAD>` linking to `/commit/<full sha>`, with a relative time computed in the browser (changing the system clock changes the text).
- [ ] **Badge**: the "Made in Vietnam" SVG renders, has an accessible name and links to the repo.
- [ ] **Version switcher**: keyboard-only operation works (Tab to the button, Enter/Space opens and focuses the first item, arrows move, Esc closes and restores focus, Tab out closes); `aria-expanded` is correct; the current item has `aria-current`; the link to `https://v1.karhdo.dev` is present; with JS disabled the v1 link is still visible.
- [ ] axe DevTools and Lighthouse a11y report no issues on the statusline and the open menu.
- [ ] The statusline stays on one row at ≥ 1024 px and stacks one segment per row at ≤ 600 px; it uses the mono font and tokens only, in both themes.
- [ ] No React is shipped by the header or footer.

## Dependencies

- v2-astro-base-layout
- v2-astro-ui-primitives

## Patterns to Follow

- Mockup: `footer.site`, `.foot-top`, `.foot-cols`, `.sl-wrap`, `.statusline`, `.sl-*`, `.ver-menu`, `.ver-item`, and the `slTick` and "version switcher" scripts.
- v1: `components/header/{Header,Logo,MobileNav,ThemeSwitch,SearchButton,AnalyticsLink}.tsx`; `components/footer/{index,FooterNav,FooterMeta,FooterBottom,LastCommit}.tsx` (content and time logic); `lib/utils/misc.ts` `getTimeAgo` (superseded by `formatRelative`).
- WAI-ARIA APG "Menu Button" pattern.
- Reference `src/components/studio/studio-shell/StatusBar.astro` (hta218/leohuynh.dev) for a statusline in Astro.


> **Note from task 03:** `SITE.location` (`"Ho Chi Minh, Viet Nam"`) and `SITE.timezone` already exist, and `src/config/site.ts` already exports `SiteConfig`, `SiteVersion`, `SnowfallMode` and `StackItem` (optional fields). This task only adds the `versions` value (and `FOOTER_COLUMNS` in navigation.ts), not the types.
