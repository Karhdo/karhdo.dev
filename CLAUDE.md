# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog at https://karhdo.dev. v2 (this branch line) is an **Astro 7** site built with **Bun**, TypeScript strict, Tailwind CSS v4, MDX content collections, Expressive Code, Biome and Drizzle on Neon Postgres, deployed to Vercel with `@astrojs/vercel` (Functions on Node 24). It replaced the v1 Next.js + Contentlayer + Prisma site, which lives on the `v1` branch (`git show v1:<path>` to read v1 code). Every v1 URL and the existing `stats` table are kept. The UI uses the Tokyonight Day (light) and Night (dark) palettes.

The rebuild plan, with every decision and its review notes, is in `.agent/plans/v2-astro/` (`00-overview.md` first).

## Commands

```bash
bun install                 # install deps; `prepare` installs the lefthook pre-commit hook
bun dev                     # astro dev on http://localhost:4321 (includes the dev-only /dev/* pages)
bun run build               # astro build → .vercel/output (OG images + Pagefind index included)
bun test                    # unit tests (*.test.ts next to pure modules)
bun run check               # astro check + biome check .
bunx biome check --write    # fix lint + formatting
bun run lint:palette        # fail on colour literals in src/ outside the Tokyonight token files
bun run db:pull             # drizzle-kit pull (introspection only; set POSTGRES_URL_DIRECT first)
```

CI (`.github/workflows/ci.yml`) runs `bun install --frozen-lockfile`, `bunx biome ci .`, `bun run lint:palette`, `bunx astro check`, `bun test` and `bun run build`.

**`bun run preview` only prints a pointer and exits 1**: `@astrojs/vercel` doesn't support `astro preview`. To check built pages, serve `.vercel/output/static` with a static server that applies `config.json` routes (incl. the `^/.*$ → /404.html` fallback), or use `bunx vercel dev` / a preview deploy. On-demand routes (`/api/*`, `/projects`, `/newsletter`) need `bun dev`. Parallel builds share `.vercel/output`, so build in a scratch copy (rsync) when another build may run.

## Architecture

### Rendering

- Static by default. Only `src/pages/api/*`, `src/pages/projects.astro` and `src/pages/newsletter.astro` (the no-JS newsletter result page) export `prerender = false` and run as Vercel Functions. Everything else (pages, feeds, robots, OG images) is prerendered, so the DB, Spotify, GitHub and the token-burn summary are never fetched at build (except the footer's build info, below).
- `trailingSlash: 'never'`; the adapter emits `blog/<slug>/index.html`, served at `/blog/<slug>`.
- `<ClientRouter />` view transitions. Every inline/bundled `<script>` re-initialises on `astro:page-load`.
- Path alias `~/*` → `src/*` (no `baseUrl` in `tsconfig.json`: TypeScript 6 rejects it).

### Islands policy

Interactivity is vanilla `<script>` modules by default: header, theme toggle, mobile nav, statusline, version switcher, TOC scrollspy, reading progress, image zoom, typed bios, views and reactions, Spotify, GitHub activity, Blog stats, Token burn, newsletter form and snowfall (`Snowfall.astro` + `snowfall/engine.ts`: canvas at 30 fps, persisted across navigations). React 19 is used only for:

- `src/components/islands/Comments.tsx` (Giscus, `client:visible`);
- the ⌘K palette: not an island. `search/CommandPaletteLoader.astro` dynamic-imports `mount-palette.tsx` + `CommandPalette.tsx` (cmdk) and `/pagefind/pagefind.js` on first open, so pages ship no React until then.

### Content

- Collections in `src/content.config.ts` (glob loader): `src/content/blog/*.mdx` and `src/content/authors/*.mdx`. Entry `id` = file name = v1 slug. Drafts are excluded in production.
- Frontmatter: `title`, `date` required; `tags`, `lastmod`, `draft`, `summary`, `images`, `authors`, `canonicalUrl` optional. **Never add `layout:` to MDX frontmatter**: Astro resolves it as an import.
- Markdown uses an **explicit unified processor** in `astro.config.mjs` (Astro 7 defaults to Sätteri): `remarkCodeTitles`, `remarkAlert`, then `rehypeHeadingIds` before `rehype-autolink-headings`. MDX inherits it. Plugins live in `src/plugins/`.
- Code blocks: Expressive Code (`ec.config.mjs`, listed before `mdx()`): Shiki `tokyo-night` for dark and `src/styles/ec-tokyonight-day.json` for light (converted from folke's tmTheme by `scripts/convert-tmtheme.ts`). ` ```ts:path/file.ts ` becomes a filename tab; `{2-3}`, `ins=`, `del=` markers; line numbers only with `showLineNumbers`.
- MDX components (`src/components/mdx/`): `Callout`, images with zoom, links, tables, `Twemoji` (`src/components/ui/Twemoji.astro`; vendored jdecked v17.0.3 SVGs in `public/static/twemoji/`, name map in `src/lib/emoji.ts`).
- Reading time and tag slugs (`github-slugger`) in `src/lib/`.

### Configuration and env

- Site data in `src/config/` (`site.ts`: metadata, `snowfall`, `versions`, `stack`; `navigation.ts`, `projects.ts`, `experiences.ts` (also drives /career via `src/lib/career.ts`), `popular-tags.ts`).
- Env goes through **`astro:env`** (schema in `astro.config.mjs`); import from `astro:env/server`. The v1 names are kept on purpose (no Vercel renames): secrets `POSTGRES_URL`, `GITHUB_API_TOKEN`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`, `BUTTONDOWN_API_KEY`, `TOKEN_BURN_SUMMARY_URL`; server-public `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`, `UMAMI_WEBSITE_ID`. All optional: the site must build and run with none set, and each feature degrades to an empty state. Public values are read in prerendered components and passed as props; nothing uses `context: 'client'`.
- `bun test` can't resolve `astro:*` virtual modules, so logic lives in pure modules (e.g. `src/lib/spotify/client.ts`) and thin `src/lib/services/*.ts` wrappers bind them to `astro:env`.

### Database (Drizzle on Neon)

- `src/lib/db/schema.ts` **maps** the existing v1 objects: enum `StatsType` (`blog`, `snippet`), table `stats` (PK `stats_pkey (type, slug)`, counters `views`, `loves`, `applauses`, `ideas`, `bullseye`), plus `stats_daily (type, slug, date, views)`.
- `src/lib/db/client.ts`: one lazy module-scoped postgres.js client (`max: 3`, `prepare: false` for the Neon `-pooler` PgBouncer host, SSL off only for localhost). Only API routes import it.
- Writes are single-statement atomic upserts (`ON CONFLICT … DO UPDATE SET col = stats.col + delta`). The daily upsert is best-effort (a missing `stats_daily` is tolerated).
- **Never run `drizzle-kit push`, `migrate` or `generate`**, and never add such scripts. `drizzle.config.ts` is for `pull` only (into git-ignored `.drizzle-introspect/`) against the Neon **direct** host `POSTGRES_URL_DIRECT`. Schema additions are hand-written additive SQL in `db/manual-migrations/`, run with `psql` on a Neon branch then production (see its README).

### API endpoints (`src/pages/api/`)

| Method | Path                          | Purpose                                                                                         |
| ------ | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/api/stats?type=blog&slug=…` | Views + reactions of a post (zeros if no row)                                                   |
| POST   | `/api/stats`                  | Atomic delta upsert (`views: 1`, reactions 1..5); Origin allowlist; v1 absolute payloads → 400  |
| GET    | `/api/stats/summary`          | Totals, reactions, 30-day series from `stats_daily`, most-read post                             |
| GET    | `/api/spotify`                | Now playing with progress                                                                       |
| GET    | `/api/github?repo=owner/name` | Repo data + last commit (v1 parity)                                                             |
| GET    | `/api/github/activity`        | 46-week contributions, streak, public repos                                                     |
| GET    | `/api/token-burn`             | Claude Code usage (today, 14 ICT days, month, all-time, model split); `{available:false}` on failure |
| POST   | `/api/newsletter`             | Buttondown subscribe (double opt-in)                                                            |

Prerendered endpoints: `/feed.xml`, `/tags/[tag]/feed.xml`, `/robots.txt`, `/og/[...slug].png`, `/og/default.png`, `/static/giscus/[theme].css`, sitemap (`@astrojs/sitemap`; `/sitemap.xml` redirects to `/sitemap-index.xml`).

### Build-time pieces

- **OG images**: `src/pages/og/[...slug].png.ts` renders Satori trees (`src/lib/og/`) with Outfit to PNG via `@resvg/resvg-js` (kept external in Vite). Posts use `/og/{id}.png` unless frontmatter `images` is set; other pages use `/og/default.png`.
- **Pagefind**: `astro-pagefind` (last integration) indexes only `<article data-pagefind-body>` into `.vercel/output/static/pagefind/`.
- **Footer build info**: `scripts/build-info.mjs`, called from `astro.config.mjs`, resolves GitHub stars, commit sha/date and branch (Vercel env → git → GitHub REST) and injects them as `__BUILD_INFO__` via Vite `define`. Failures hide the segment; they never fail the build. Relative time and the HCMC clock are computed in the browser.
- **Dev pages**: `src/integrations/dev-pages.ts` injects `/dev/*` from `src/dev-pages/` only under `astro dev`, so they never reach the build, sitemap or Pagefind.

### Token burn

Personal Claude Code usage, not the Anthropic API. The private repo `Karhdo/token-burn` runs ccusage hourly on the owner's Mac (launchd) and pushes `public/summary.json` (daily tokens, cost and per-model totals in `Asia/Ho_Chi_Minh` days). `src/lib/token-burn.ts` fetches it server-side through the GitHub Contents API (`TOKEN_BURN_SUMMARY_URL` + `GITHUB_API_TOKEN`) and builds today, 14 days, month, all-time and the month's model split. Cost is an API-price estimate.

### Styling and theming

- `src/styles/theme.css` is the **only** place colours are defined (`:root` = Tokyonight Day; `:root[data-theme="dark"]` and the `prefers-color-scheme: dark` fallback = Night), mirrored in `src/styles/palette.ts` (parity tested). Tailwind v4 via `@tailwindcss/vite`; `dark:` is a custom variant covering both.
- Theme lives on `<html data-theme="light|dark">`, set before paint by an inline script from `localStorage.theme` (`light|dark|system`), re-applied on `astro:after-swap`. Giscus gets its theme via `postMessage`.
- Scoped styles use raw tokens (`var(--blue)`), not `--color-*`; fonts are `var(--font-sans)` / `var(--font-mono)`. `.glass` etc. live in `@layer components`; prose overrides in `@layer utilities`.
- Motion: keyframes and easing tokens in `src/styles/animations.css`; effects only under `prefers-reduced-motion: no-preference`; animate only transform/opacity/filter/clip-path; content is complete at rest.

## Key rules

- **Tokyonight tokens only.** No hex/rgb/hsl literals in `src/` outside `theme.css`, `palette.ts`, the EC theme JSON, tests and fixtures (`bun run lint:palette`). Brand logos (simple-icons) are tinted with tokens, never brand colours.
- **Contrast (Day).** `--faint` and `--muted` fail AA for small text: decorative marks and large text only; use `--fg-soft` / `--fg` for meaningful small text. Never `--bg` text on `--blue`; solid accent chips use a `--heat-4` background with `--surface-solid` text.
- **Once-only listener guards**: `el.dataset.bound = 'true'` (never `""`, which is falsy and rebinds on every `astro:page-load`), or test `!== undefined`.
- **Animation longhands** with `animation-timeline: view()`: never the `animation:` shorthand (the minifier folds it into a rule Chrome drops). Copy `.reveal` in `animations.css`.
- **Images**: always pass an explicit `quality` (75 or `"high"`) to `<Image>` / `getImage`; the Vercel adapter defaults to 100.
- **Cache headers on on-demand routes**: never `s-maxage` / `stale-while-revalidate` in `Cache-Control` without a browser `max-age`. Use `Cache-Control: public, max-age=0, must-revalidate` + `Vercel-CDN-Cache-Control: max-age=N, stale-while-revalidate=M`. Uncached responses use `no-store`.
- **Layout measurement** inside cards that can be transformed (rise/tilt): use `clientWidth` / `offsetWidth`, not `getBoundingClientRect`.
- **Never `drizzle-kit push`/`migrate`/`generate`**; never touch `stats`, `StatsType` or `_prisma_migrations`.
- **Hosting**: v2 is Vercel project `karhdo-blog` (`main` → karhdo.dev); v1 is the separate project `karhdo-blog-v1` (v1.karhdo.dev, deployed by hand from the `v1` branch; `noindex`, stats read-only). Never set `ENABLE_EXPERIMENTAL_COREPACK` on `karhdo-blog` (Corepack rejects Bun).
- **Deploy**: never `astro build` + `vercel deploy --prebuilt` without `vercel build` (drops `vercel.json` headers, rewrites and redirects). Don't set `bunVersion` in `vercel.json`. Security headers live in `vercel.json`.
- **Vercel Firewall rate limits** (dashboard, not code): `POST /api/stats` ~30/min per IP, `POST /api/newsletter` ~5 per 60 s per IP. The Origin check only stops browser CSRF.
- **No `layout:` in MDX frontmatter.**

- **View transitions and glass:** never give a `.glass` ancestor a permanent `view-transition-name` (`transition:name` / `transition:animate` / `transition:persist`); it becomes a backdrop root and kills the blur. `page` is named only while `html[data-astro-transition]` is set.
- **No literal tags in `.astro` comments** (e.g. a script tag in a CSS comment): Vite's dependency scan regex-matches them and fails to parse the rest as JS.
- **Scripts stay external:** `vite.build.assetsInlineLimit` keeps `.js` out of the HTML. Inline module scripts make the ClientRouter inject a `data:` script (blocked by the CSP) and re-run on every swap.

## Conventions

- **Commits**: Conventional Commits, one commit per task (`feat(scope): …`, `fix(…)`, `chore(deps): …`, `docs(…)`).
- **Code style**: Biome (`biome.json`: single quotes, semicolons, 120 columns, 2 spaces, ES5 trailing commas, sorted Tailwind classes). lefthook runs `biome check --staged --write` on pre-commit.
- **Tests**: `*.test.ts` next to pure modules (no `astro:*` imports), run with `bun test`; fixtures in `__fixtures__/`.
- **TypeScript**: strict (`astro/tsconfigs/strict`), TypeScript 6.
- **Third-party material**: record anything copied, vendored or derived in `THIRD_PARTY_NOTICES.md`.
