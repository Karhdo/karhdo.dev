# 23 — Pagefind search and ⌘K command palette

## Endpoint

None (static Pagefind index at `/pagefind/*`).

## Summary

Replace v1's kbar + `search.json` with Pagefind full-text search generated after the build, surfaced through a ⌘K / Ctrl-K command palette (React + `cmdk`, **loaded lazily**: a tiny vanilla loader listens for the shortcut and dynamic-imports the React palette on first open, so React and cmdk are not shipped on pages that have no other islands) that also offers navigation (Home, Blog, Tags, Projects, About, RSS), theme switching and social links.

## Files to Create/Modify/Delete

- **Modify** `package.json` — add `astro-pagefind@^2.0.1` (which depends on `pagefind@^1.5`), `cmdk@^1.1.1`.
- **Modify** `astro.config.mjs` (**shared-file rule, m2**: tasks 23, 24 and 25 all edit this file in p5, so they are **merged one at a time**. Rebase on the latest `v2` before merging and re-run `bun run build`. Each adds only its own integration/option and never reorders existing ones; `expressiveCode()` stays before `mdx()`, and `pagefind()` stays last.) — add `pagefind()` integration **last**. Verify it writes to the adapter's client output (`.vercel/output/static/pagefind/`). If it does not (adapter output dir mismatch), remove the integration and instead set `"build": "astro build && pagefind --site .vercel/output/static"` with `pagefind` as a devDependency; document which path was taken.
- **Create** `src/components/search/CommandPaletteLoader.astro` — renders `<div id="cmdk-root" transition:persist="command-palette">` plus a bundled vanilla `<script>` (no React import): on ⌘K/Ctrl-K, `/` (when focus is not in an input/textarea/contenteditable), and the `open-command-palette` event (header/blog triggers from tasks 09/13), it calls `openPalette()` which on the **first** call does `const { mountPalette } = await import('~/components/search/mount-palette');` (Vite code-splits React + cmdk into that chunk) and mounts it into `#cmdk-root`, then dispatches `cmdk:open`; subsequent calls just dispatch `cmdk:open`. The listener is registered once (module scripts run once under `<ClientRouter />`); latest posts are passed via a `<script type="application/json" id="cmdk-data">` rendered by the loader. Optional warm-up: `import()` on `pointerenter`/`focus` of the search trigger.
- **Create** `src/components/search/mount-palette.tsx` — `mountPalette(el, data)` using `createRoot(el).render(<CommandPalette … />)`; root survives view transitions via `transition:persist` on `#cmdk-root`.
- **Create** `src/components/search/CommandPalette.tsx` (plain React component, **not** an Astro island) — mockup `.cmdk` dialog (input "Search posts, pages, actions…", `esc` hint, footer "↑ ↓ move · ↵ open · Full-text search by Pagefind"); `cmdk` `Command.Dialog`, opened/closed by the `cmdk:open` event and Esc. On first open: `const pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js'); await pagefind.options({ excerptLength: 20 }); pagefind.init();` — debounced `pagefind.debouncedSearch(q, {}, 150)`, show top 8 results (title from `meta.title`, excerpt with `<mark>` rendered via `dangerouslySetInnerHTML` — Pagefind escapes content). Groups: "Posts" (search results; when query empty show 5 latest posts passed as props), "Navigation", "Theme" (dispatches the same theme logic as the header toggle via a shared `src/lib/theme.ts`), "Social". Navigates with `navigate()` from `astro:transitions/client`. Glass dialog, focus trapped, Esc closes, `aria-label`s; motion-safe scale/opacity entrance. In dev (no index) show "Search index is built on `bun run build` — run `bun run preview`".
- **Create** `src/lib/theme.ts` — `setTheme(mode)`, `getTheme()`, shared by `ThemeToggle.astro` script and the palette.
- **Modify** `src/layouts/PageLayout.astro` — mount `<CommandPaletteLoader latestPosts={…} />` once.
- **No edit to `src/layouts/PostLayout.astro`** (m2): its Pagefind attributes (`data-pagefind-body` on the article, `data-pagefind-meta`, `data-pagefind-filter="tag"`, `data-pagefind-ignore` on the TOC and stubs) were finalised in task 12. Only verify them; if a change is needed, raise it against task 12 and don't patch it here.
- **Modify** `vercel.json` (task 04 output) — nothing if `'wasm-unsafe-eval'` already in CSP (it is).

## Implementation Steps

1. Add packages and integration; `bun run build`; inspect `.vercel/output/static/pagefind/pagefind.js` exists and the build log says "Indexed 3 pages".
2. Implement `theme.ts` and refactor `ThemeToggle` to use it.
3. Implement palette; test in `bun run preview`: search "overbooking", "NestJS module", "pessimistic lock".
4. Keyboard-only test: open with ⌘K, arrow through results, Enter navigates, Esc closes, focus returns to trigger.

## Acceptance Criteria

- [ ] `bun run build` succeeds and `.vercel/output/static/pagefind/pagefind.js` exists; index contains exactly the 3 posts.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] In `bun run preview`, ⌘K and Ctrl-K open the palette on every page, including after view-transition navigation.
- [ ] Query "overbooking" returns the SQL post first with a highlighted excerpt; selecting it navigates to `/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods`.
- [ ] Pagefind JS/WASM **and** the React/cmdk chunk are only requested after the palette is first opened: on `/tags` (a page with no other islands) the initial load requests no `react`/`cmdk` chunk (Network tab), and pressing ⌘K then loads it.
- [ ] Opening the palette a second time does not re-download or re-mount (single root).
- [ ] No CSP errors in production headers (checked on preview deploy in task 28).
- [ ] axe: palette dialog has accessible name and options are announced.

## Dependencies

- v2-astro-header-footer
- v2-astro-blog-post-page
- v2-astro-blog-list-pagination

## Patterns to Follow

- v1 `components/header/SearchButton.tsx`, `data/siteMetadata.js` `search` (kbar) — behaviour only.
- Pagefind docs "Using the Pagefind JS API"; astro-pagefind README.
- cmdk README (`Command.Dialog`).


> **Note from task 09:** the header search button dispatches `window.dispatchEvent(new CustomEvent("open-command-palette"))` (no detail). The palette loader must listen on `window` for that event, and any other "Search posts" button (task 13) must dispatch the same event on `window`.


> **Note from task 12 review:** Pagefind result URLs come out with a trailing slash (`/blog/x/`) because of the directory build format, while the site uses `trailingSlash: "never"`. Strip the trailing slash from result URLs in the palette UI (or configure pagefind URL handling) so links do not trigger the 308 redirect.
