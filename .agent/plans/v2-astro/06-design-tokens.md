# 06 — Design tokens: Tokyonight Day (light) and Tokyonight Night (dark) on Tailwind v4

## Endpoint

None.

## Summary

Build the CSS foundation in Tailwind v4 CSS-first syntax, copying the **mockup tokens verbatim** (`.agent/plans/v2-astro/mockup/karhdo-v2.src.html`, lines 7–43): `:root` is Tokyonight Day (light), and `:root[data-theme="dark"]` is Tokyonight Night (dark). The same dark block is repeated under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, so the site is dark by default for dark-OS visitors even with JS off (m8). This task also covers: the theme attribute is `data-theme` (not a `.dark` class); fonts are Outfit and JetBrains Mono, both self-hosted; prose styles for posts; glass surfaces; the v1 keyframes; a global reduced-motion guard; and the dev-only preview-pages mechanism used by later tasks.

## Files to Create/Modify/Delete

- **Create** `src/styles/theme.css`. Raw tokens are copied **verbatim** from the mockup; the only change is that the long hex/rgba lists are kept exactly, with no renaming:
  ```css
  :root {
    color-scheme: light;
    --bg: #e1e2e7;
    --bg-2: #d5d6db;
    --surface: rgba(255, 255, 255, 0.55);
    --surface-solid: #eceef3;
    --line: rgba(55, 96, 191, 0.14);
    --line-strong: rgba(55, 96, 191, 0.28);
    --fg: #343b58;
    --fg-soft: #4c5578;
    --muted: #6172b0;
    --faint: #8990b3;
    --blue: #2e7de9;
    --purple: #9854f1;
    --cyan: #007197;
    --green: #587539;
    --orange: #b15c00;
    --red: #f52a65;
    --teal: #118c74;
    --yellow: #8c6c3e;
    --blue1: #188092;
    --shine: rgba(225, 226, 231, 0.75);
    --spotify: var(--green);
    --code-bg: #e9e9ed;
    --code-fg: #3760bf;
    --glow-a: rgba(46, 125, 233, 0.2);
    --glow-b: rgba(152, 84, 241, 0.16);
    --shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 12px 32px -18px rgba(52, 59, 88, 0.35);
    --snow-c: #6172b0;
    --heat-0: rgba(55, 96, 191, 0.08);
    --heat-1: #b7c7ee;
    --heat-2: #7ea1ea;
    --heat-3: #4d80e4;
    --heat-4: #2e62c9;
    --r: 18px;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      color-scheme: dark; /* dark block */
    }
  }
  :root[data-theme='dark'] {
    color-scheme: dark;
    --bg: #16161e;
    --bg-2: #1a1b26;
    --surface: rgba(36, 40, 59, 0.55);
    --surface-solid: #1f2335;
    --line: rgba(122, 162, 247, 0.12);
    --line-strong: rgba(122, 162, 247, 0.26);
    --fg: #c0caf5;
    --fg-soft: #a9b1d6;
    --muted: #7982a9;
    --faint: #565f89;
    --blue: #7aa2f7;
    --purple: #bb9af7;
    --cyan: #7dcfff;
    --green: #9ece6a;
    --orange: #ff9e64;
    --red: #f7768e;
    --teal: #73daca;
    --yellow: #e0af68;
    --blue1: #2ac3de;
    --shine: rgba(192, 202, 245, 0.75);
    --spotify: var(--green);
    --code-bg: #1a1b26;
    --code-fg: #c0caf5;
    --glow-a: rgba(122, 162, 247, 0.18);
    --glow-b: rgba(187, 154, 247, 0.14);
    --shadow: 0 1px 0 rgba(192, 202, 245, 0.06) inset, 0 16px 40px -20px rgba(0, 0, 0, 0.6);
    --snow-c: #c0caf5;
    --heat-0: rgba(122, 162, 247, 0.07);
    --heat-1: #2a3a66;
    --heat-2: #3d59a1;
    --heat-3: #5a7ed6;
    --heat-4: #7aa2f7;
  }
  ```
  **Tokyonight-only palette (user decision).** Every colour on the site comes from the Tokyonight palette (Night for dark, Day for light) through these tokens. Components contain no off-palette or brand hex values.
  - `--magenta` is **removed**; the neon `#ff007c` didn't match.
  - Added to **all three blocks** (light, the media-query dark block, and `[data-theme="dark"]`):
    - `--yellow`: `#8c6c3e` Day / `#e0af68` Night;
    - `--blue1`: `#188092` Day / `#2ac3de` Night;
    - `--shine`: `rgba(225,226,231,.75)` Day, from the Day bg / `rgba(192,202,245,.75)` Night, from the Night fg. It's used for **every** shine or sheen highlight instead of white.
  - `--spotify` is `var(--green)` in every block, so the Spotify card uses Tokyonight green, not the brand `#1db954`.
  - **Non-CSS mirror**: `src/styles/palette.ts` exports the same Day/Night hex values as typed constants, for places that can't read CSS variables: Satori OG images (25), the `theme-color` meta and web manifest (07), and the Expressive Code `styleOverrides` (11). `src/styles/palette.test.ts` parses `theme.css` and asserts that every mirrored value equals its CSS token, so the two can't drift.
    The dark block inside the media query is identical to the `[data-theme="dark"]` block. To avoid duplication drift, generate both from one list (e.g. Tailwind `@custom-variant` cannot do this for raw vars, so keep two literal copies and add a `theme.test.ts` that parses `theme.css` and asserts the two dark blocks are identical).
- **In the same file**, expose the tokens to Tailwind with `@theme inline { --color-bg: var(--bg); --color-bg-2: var(--bg-2); --color-surface: var(--surface); --color-surface-solid: var(--surface-solid); --color-line: var(--line); --color-line-strong: var(--line-strong); --color-fg: var(--fg); --color-fg-soft: var(--fg-soft); --color-muted: var(--muted); --color-faint: var(--faint); --color-blue: var(--blue); --color-purple: var(--purple); --color-cyan: var(--cyan); --color-green: var(--green); --color-orange: var(--orange); --color-red: var(--red); --color-teal: var(--teal); --color-yellow: var(--yellow); --color-blue1: var(--blue1); --color-shine: var(--shine); --color-spotify: var(--spotify); --color-code-bg: var(--code-bg); --color-code-fg: var(--code-fg); --color-heat-0..4: var(--heat-0..4); --color-snow: var(--snow-c); --shadow-card: var(--shadow); --radius-card: var(--r); --font-sans: 'Outfit Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif; --font-mono: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }`, plus the v1 keyframes and animations (`wave`, `music-bar-1..4`, `scale-up`) and the new `rise`, `shimmer`. The v1 alias stays reachable as `--color-primary-500: var(--blue)` (v1's `#7aa2f7` is the dark `--blue`). v1's `coral` is **not** carried over; where it was used, use `--color-red` (Tokyonight `--red`) instead (m1).
- **Rewrite** `src/styles/global.css`:
  - `@import 'tailwindcss';`, `@plugin '@tailwindcss/typography';`, `@import '@fontsource-variable/outfit';`, `@import '@fontsource-variable/jetbrains-mono';`, `@import './theme.css';`, `@import './prose.css';`, `@import './animations.css';`.
  - Dark variant that works with the attribute and with the JS-off media fallback: `@custom-variant dark { &:where([data-theme=dark], [data-theme=dark] *) { @slot; } @media (prefers-color-scheme: dark) { &:where(:root:not([data-theme=light]), :root:not([data-theme=light]) *) { @slot; } } }`. Components prefer the semantic tokens (`bg-surface`, `text-muted`) over `dark:` utilities.
  - Base layer: `body { background: var(--bg); color: var(--fg); }`. The page background (colour **and** the glow gradients) goes on **`body` only, never on `html`**, and layout wrappers stay transparent. CSS propagates `body`'s background to the canvas only when `html` has none, and that is what keeps negative-z layers (the snowfall `<canvas class="-z-1">`, task 29) visible above the background. `html` only gets `color-scheme`. a background glow made of two radial gradients (`--glow-a`, `--glow-b`) as in the mockup; `::selection`; `:focus-visible` ring using `--blue`; `scroll-behavior: smooth` only under `prefers-reduced-motion: no-preference`.
  - v1 carry-overs from `css/tailwind.css`: `.no-scrollbar`, autofill fix, `.task-list-item`, `.footnotes`, `.content-header-link` anchor hover styles.
- **Create** `src/styles/prose.css`. Port the v1 `typography` config to `.prose`, using tokens only, so a single rule set serves both themes:
  - links are `--blue` with a 4 px underline offset;
  - headings use `--fg` with `scroll-margin-top: 6em`;
  - inline code is `--purple` on `--code-bg`, without backticks;
  - blockquotes use `--surface-solid` with a `--line-strong` border;
  - `font-size: 18px`, `h2` 28 px, `h3` 24 px;
  - images are rounded;
  - tables use `--line`.
- **Create** `src/styles/animations.css`:
  - `.glass`: `background: var(--surface)`, `border: 1px solid var(--line)`, `box-shadow: var(--shadow)`, `backdrop-filter: blur(14px) saturate(140%)`, `border-radius: var(--r)`, with a `@supports not (backdrop-filter: …)` fallback to `--surface-solid`.
  - **Motion system foundation (item 5).** This is the library that later tasks apply by class; the orchestration and QA are in task 26.
    - **Motion tokens**, in `theme.css` `@theme`: `--ease-out: cubic-bezier(.2,.7,.2,1)` (this deliberately overrides Tailwind's default `ease-out`) and `--ease-spring: cubic-bezier(.34,1.56,.64,1)`.
    - **Keyframes, copied from the mockup's "Motion system" section**: `wordIn`, `nameFlow`, `dotPulse`, `riseIn`, `revealIn`, `cellIn`, `barUp`, `splitIn`, `burst`, `floatUp`, `pageOut`, `pageIn`, `draw`, `fadeFill`, `dotPop`, `mq`, `pulse`, `flick`, `pop`, `chWave` (wordmark, task 09), plus the v1 keyframes (`wave`, `music-bar-1..4`, `scale-up`).
    - **Primitives, all inside `@media (prefers-reduced-motion: no-preference)`**:
      - **Tilt-safe keyframes (M-A).** `riseIn`, `revealIn` and any other keyframe that runs on an element that can also tilt (`[data-tilt]` cards) must animate the **individual transform properties** `translate`, `scale`, `rotate` and/or `opacity`, **never `transform`**. With `animation-fill-mode: both`, a `transform: none` end state would otherwise permanently override the tilt's `transform: perspective(…) rotateX(…) rotateY(…)` (task 26). Concretely: `@keyframes riseIn { from { translate: 0 14px; scale: .985 } to { translate: none; scale: none } }` and `@keyframes revealIn { from { translate: 0 24px; opacity: .35 } to { translate: none; opacity: 1 } }`. Keyframes on elements that never tilt (e.g. `wordIn` on hero words, `cellIn` on heatmap cells, `barUp`) may keep `transform`, but should use the individual properties too, for consistency.
      - `.rise`: `riseIn` .7 s `--ease-out` `both`, delayed by `calc(var(--i, 0) * 50ms)`.
      - `.reveal`: inside `@supports (animation-timeline: view())`, `animation: revealIn linear both; animation-timeline: view(); animation-range: entry 0% entry 60%`. With no support (or with reduced motion) it simply isn't animated; there is **no JS fallback**.
      - `.loop-anim`: marks an infinite animation that task 26 pauses while it's off-screen.
    - **At-rest rule:** no class may leave an element at `opacity: 0` or off-position outside a running animation. The keyframes animate _from_ an offset _to_ `none`. `revealIn` starts at `opacity: .35`, not 0, and only runs when `view()` is supported. So the page is complete and readable with JS off, with reduced motion, and before any animation runs.
  - Reduced-motion guard: `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }`.
- **Modify** `package.json`: add `@tailwindcss/typography@^0.5.20`, `@fontsource-variable/outfit@^5.3.0`, `@fontsource-variable/jetbrains-mono` (latest 5.x).
- **Create** the dev-only preview-pages mechanism (used by tasks 08, 10, 11). Files under `src/pages/` are always built, so these pages live outside it:
  - `src/integrations/dev-pages.ts` is an Astro integration whose `astro:config:setup` hook calls `injectRoute({ pattern: '/dev/[...page]', entrypoint: './src/dev-pages/[...page].astro' })` **only when `command === 'dev'`**. The pages are never part of `astro build`, the sitemap or Pagefind.
  - `src/dev-pages/[...page].astro` is a small router rendering `src/dev-pages/tokens.astro` (this task), `components.astro` (08), `content.astro` (10) and `mdx.astro` (11).
  - Register the integration in `astro.config.mjs`.
- **Create** `src/dev-pages/tokens.astro`: swatches for every token, the `rise`/`shimmer` animations, the glass card, and body/mono text samples, with a theme switcher (`data-theme` light / dark / unset).

## Implementation Steps

1. Copy the token blocks from the mockup file (the mockup HTML's `<style>`, lines 7–43) into `theme.css` character for character, then add the `@theme inline` mapping.
2. `git show main:tailwind.config.js main:css/tailwind.css main:css/prism.css` to port keyframes and the v1 base rules.
3. Add fonts, prose and animations; write the dev-pages integration and the tokens page.
4. Check contrast in both themes (AA 4.5:1 for `--fg` and `--fg-soft` on `--bg`, 3:1 for `--muted` on large text); record the values.
5. Test the JS-off fallback: disable JavaScript in DevTools, emulate `prefers-color-scheme: dark` → the dark tokens apply; emulate light → the light tokens apply.

## Acceptance Criteria

- [ ] `bun run build` succeeds; the build output contains no `/dev/` pages.
- [ ] `bunx biome check` passes (CSS with Tailwind directives parses).
- [ ] `bunx astro check` passes.
- [ ] `bun test` passes (includes the dark-block equality test).
- [ ] The token values in `theme.css` are byte-identical to the mockup (the diff is attached to the PR).
- [ ] `/dev/tokens` (in `bun dev` only) switches all colours when `data-theme` is set to `light`/`dark`, and follows the OS setting when the attribute is absent.
- [ ] With JS disabled and a dark OS, the page renders with dark tokens; with a light OS, light tokens.
- [ ] Body text contrast is ≥ 4.5:1 in both themes (values recorded in the PR).
- [ ] With OS "reduce motion" enabled, `animate-wave` does not animate.
- [ ] **Palette lint (M-C)**: `bun run lint:palette` passes. It is a real `package.json` script (`"lint:palette": "bun scripts/lint-palette.ts"`) and has no dependency on `rg`. The Bun script walks `src/**` with `Bun.Glob` and fails, printing `file:line`, on any `#[0-9a-fA-F]{3,8}\b`, `rgba?\(` or `hsla?\(` outside these exclusions:
  - `src/styles/theme.css` (the tokens);
  - `src/styles/palette.ts` (the TS mirror);
  - `src/styles/ec-tokyonight-day.json` (the vendored code theme);
  - `src/assets/icons/**` (vendored brand SVGs, including the MIV badge);
  - `**/*.test.ts` and `**/__fixtures__/**` (tests compare literal values on purpose).
    Components use named colours such as `black`/`transparent` only in masks (for example the marquee `mask-image` in task 15 uses `black`, not `#000`). **Modify** `.github/workflows/ci.yml` (from task 02) to add a `bun run lint:palette` step after `biome ci`.
- [ ] `bun test` passes `palette.test.ts` (the TS mirror equals the CSS tokens).
- [ ] `--ease-out`/`--ease-spring` exist; `/dev/tokens` demos `.rise` and `.reveal` (in Chrome, via scroll); no primitive leaves content hidden when animations are disabled (DevTools → Animations → pause at 0 and set playback to 0: every element is visible).
- [ ] `getComputedStyle(document.documentElement).backgroundColor` is `rgba(0, 0, 0, 0)`; the background is on `body`.
- [ ] Outfit and JetBrains Mono are served from the same origin (no Google Fonts request; CSP `font-src 'self'` satisfied).

## Dependencies

- v2-astro-tooling-biome

## Patterns to Follow

- Mockup: `karhdo-v2.src.html`, `<style>` lines 7–43 (tokens), plus its `.card`, `.eyebrow`, `.chip` and glow rules for reference.
- v1: `tailwind.config.js`, `css/tailwind.css`, `css/prism.css` (`git show main:…`).
- Reference `src/styles/theme.css` and `src/styles/prose.css` (hta218/leohuynh.dev) for v4 `@theme` and typography layout.
- Tailwind v4 docs: "Dark mode → using a data attribute" (`@custom-variant`), "@theme inline", "@plugin".
- Astro docs: Integration API, `injectRoute`, `astro:config:setup` `command`.


> **Note from task 01 review:** Tailwind v4 auto source detection currently scans the whole repo (incl. `data/`, `.agent/`). Set explicit sources in `src/styles/global.css` (e.g. `@import "tailwindcss" source("../");` plus `@source not "../../.agent";` or `source(none)` + `@source "../**/*.{astro,ts,tsx,mdx,md}"`) so unused utilities are not generated.
