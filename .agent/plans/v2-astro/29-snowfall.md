# 29 — Dependency-free homepage snowfall

## Endpoint

None.

## Summary

Keep v1's single-layer homepage snowfall of 119 round flakes, with **slightly larger and slower flakes** than v1 (user decision): radius .8–2.6 (v1: .5–2), speed .25–1.2 (v1: .4–2); count, wind and opacity are unchanged. It drops the `react-snowfall` dependency and React hydration, and becomes a zero-dependency Astro component: a fixed full-viewport `<canvas>` driven by a bundled plain-TypeScript `<script>`, with no React. It starts when the browser is idle, pauses while the tab is hidden, never starts under reduced motion (and stops if reduced motion is turned on mid-session), cleans up and re-initialises correctly with Astro view transitions, takes its colour from the `--snow-c` token, and is gated by `SITE.snowfall`. There are no depth layers, crystal sprites, rotation, twinkle or pointer gust (the proposed "snowfall v2" was rejected).

## Files to Create/Modify/Delete

- **Modify** `src/components/Snowfall.astro` (the empty stub created by task 15, already rendered by `index.astro`; **this task never edits `src/pages/index.astro`**):
  - Gating inside the component: `const mode = SITE.snowfall; if (mode === false) return nothing` (render no canvas and no script).
  - Markup: `<canvas id="snowfall" data-snowfall aria-hidden="true" class="pointer-events-none fixed inset-0 -z-1 h-screen w-screen"></canvas>`. It uses **`-z-1`** (z-index −1, as in v1's `style` prop and the mockup `#snow`), **not** `-z-10`.
  - **Background rule (29-a).** The canvas sits behind in-flow content but above the root background. This works only because the page background is declared on **`body`** and **never on `html`**. CSS propagates `body`'s background to the canvas root only when `html` has none; if `html` had a background, `body`'s own background box would paint over the negative-z canvas. Task 06 states the same rule. Layout wrappers (`PageLayout`, `main`, section containers) must also stay transparent, and none may create a stacking context with a background that covers the viewport.
  - The component passes `mode` (from `SITE.snowfall`); for `'december'` it sets `data-snowfall-mode="december"`, and the script checks `new Date().getMonth() === 11` on the client (the visitor's local month; the page is prerendered, so this check can't run at build).
  - **Bundled `<script>`** (`src/components/snowfall/snowfall.ts`, plain TS, no npm imports, about 60 lines of logic):
    - `const CONFIG = { count: 119, radius: [0.8, 2.6], speed: [0.25, 1.2], wind: [-0.2, 0.4], opacity: [0.15, 0.4] } as const;` (the final user settings, matching the mockup). Compared with v1 (`git show main:components/homepage/HomeContent.tsx` lines 27–40: radius [0.5, 2], speed [0.4, 2]), the flakes are larger and slower; count, wind and opacity are the v1 values.
    - The pure helpers live in `src/components/snowfall/model.ts` (no DOM): `makeFlake(W, H, rand, y?)` → `{ x, y, r, speed, wind, opacity }` within the `CONFIG` ranges, and `stepFlake(f, W, H, rand)` (`y += speed`, `x += wind`, respawn above the top past `H + 4`, horizontal wrap at ±4 px). `src/components/snowfall/model.test.ts` (bun test) checks that `makeFlake` values stay within every `CONFIG` range, that a flake respawns at the top when it passes the bottom, and that horizontal wrap works both ways.
    - `init()` on `astro:page-load`: find `[data-snowfall]` and return if it's missing (another page). Return if `matchMedia('(prefers-reduced-motion: reduce)').matches` (the canvas stays empty). Return if `mode === 'december'` and the month isn't December. Otherwise schedule `start()` with `requestIdleCallback(start, { timeout: 2000 })`, falling back to `setTimeout(start, 200)`. A module-level `running` flag prevents a double start.
    - `start()`: `dpr = min(devicePixelRatio, 2)`; size the canvas to `innerWidth/innerHeight × dpr` and call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Create 119 flakes with `makeFlake` (random values within each `CONFIG` range). The colour is `getComputedStyle(document.documentElement).getPropertyValue('--snow-c').trim()`: the mockup token from task 06, also exposed to Tailwind as `--color-snow`, which is light (Tokyonight Day) **`#6172b0`**, chosen so flakes show on `#e1e2e7` (29-b), and dark `#c0caf5`. The loop runs on `requestAnimationFrame`, calling `stepFlake` (`y += speed`, `x += wind`, wrap and respawn) and drawing round `arc` fills with `globalAlpha = opacity`.
    - Handlers:
      - a debounced `resize` re-scales for DPR and keeps the flakes;
      - `visibilitychange` cancels the rAF when hidden and resumes it when visible;
      - theme changes re-read `--snow-c` via a `MutationObserver` on `<html>`'s `data-theme` attribute, plus a `matchMedia('(prefers-color-scheme: dark)')` change listener for the no-attribute case.
    - **Reduced motion mid-session (29-c)**: a `change` listener on `matchMedia('(prefers-reduced-motion: reduce)')`. When it becomes `true`, call `stop()`: cancel the rAF, clear the canvas, and keep the listeners so it can resume. When it becomes `false` again, call `init()` (respecting the December gate).
    - `cleanup()` on `astro:before-swap`: `cancelAnimationFrame`, cancel any pending idle callback or timeout, remove the resize, visibility, colour-scheme and reduced-motion media listeners, disconnect the MutationObserver, and drop references.
- **Modify** `src/config/site.ts` (29-d): add `export type SnowfallMode = boolean | 'december';`, include `snowfall: SnowfallMode` in the `SiteConfig` type, and write the entry as `snowfall: true as SnowfallMode`. The object is declared `export const SITE = { … } as const satisfies SiteConfig;`. The `as SnowfallMode` assertion keeps the union through `as const` (otherwise it would narrow to the literal `true`, making `SITE.snowfall === 'december'` a type error), and `satisfies` checks the whole object. The default `true` matches v1, which always showed snow.

## Implementation Steps

1. Write `CONFIG` with the final settings (compare with the v1 props via `git show main:components/homepage/HomeContent.tsx`), then write `model.ts` with its tests.
2. Implement the component (gating, markup) and the script; keep the script to about 60 lines of logic.
3. Add the token and config flag, then wire it into the homepage.
4. Test in `bun run preview`:
   - Snow visible on `/` in light and dark themes.
   - Navigate `/` → `/blog` through a view transition; with a temporary rAF counter (`window.__snowFrames`) or the Performance panel, confirm no frames are scheduled after the swap.
   - Navigate back and snow restarts once (not twice).
   - Emulate reduced motion: no animation frames and a blank canvas.
   - Set `snowfall: 'december'`, fake the date with DevTools `Date` override or a local clock change, confirm it's gated, then restore `true`.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `react-snowfall` is not in `package.json` or `bun.lock`.
- [ ] Snow causes no React hydration on the homepage: no `astro-island` wraps the snowfall, and its script chunk doesn't import React.
- [ ] Snowfall uses the final settings: 119 round flakes, radius [0.8, 2.6], speed [0.25, 1.2], wind [-0.2, 0.4], opacity [0.15, 0.4] (v1 count, slightly larger and slower flakes); a single layer (no crystals, layers or pointer gust); `bun test` passes `model.test.ts`.
- [ ] It holds 60 fps on a mid-range laptop at DPR 2 with 119 flakes (Performance panel).
- [ ] No layout shift from the canvas (fixed, out of flow).
- [ ] After navigating from `/` to another page (view transition), no snowfall `requestAnimationFrame` callbacks run (Performance panel or rAF counter stays flat).
- [ ] Returning to `/` restarts exactly one loop.
- [ ] With `prefers-reduced-motion: reduce`, nothing animates on the canvas.
- [ ] Toggling reduced motion **mid-session** (DevTools Rendering → emulate) stops the loop immediately and clears the canvas; turning it off resumes it.
- [ ] The animation pauses while the tab is hidden.
- [ ] The canvas is sharp on DPR 2 screens and correct after window resize.
- [ ] Flakes are visible **over the page background** in both themes: the canvas uses `-z-1`; `html` has no computed background (`getComputedStyle(document.documentElement).backgroundColor` is transparent) and the background comes from `body`. Light flakes are `#6172b0` on `#e1e2e7`, dark flakes `#c0caf5` on `#16161e`, and they change colour when the theme is toggled.
- [ ] `astro check` accepts `SITE.snowfall === 'december'` (the `SnowfallMode` union survives `as const`).
- [ ] `src/pages/index.astro` is unchanged by this task (`git diff` shows only `Snowfall.astro` and `site.ts`).
- [ ] `snowfall: false` renders no canvas; `'december'` only animates when the visitor's local month is December.

## Dependencies

- v2-astro-homepage-bento
- v2-astro-site-config-env

## Patterns to Follow

- v1 `components/homepage/HomeContent.tsx` (Snowfall props and style), `data/siteMetadata.js` (config style).
- Mockup `karhdo-v2.src.html` snow module (the `snow` IIFE: `make`, `frame`, `start`, `stop`, and the `--snow-c` MutationObserver).
- Task 09 script conventions (`astro:page-load` / `astro:before-swap`).


> **Note from task 03:** `SnowfallMode` and the optional `snowfall` field already exist in `SiteConfig` (`src/config/site.ts`); add only the value.
