<h1 align="center">Karhdo's Coding Adventure</h1>
<p align="center"><i>My desire to practice my skills and share my acquired knowledge fuels my endeavors.</i></p>

<div align="center">
    <a href="https://github.com/Karhdo/karhdo.dev/stargazers"><img src="https://img.shields.io/github/stars/Karhdo/karhdo.dev" alt="Stars Badge"/></a>
    <a href="https://github.com/Karhdo/karhdo.dev/network/members"><img src="https://img.shields.io/github/forks/Karhdo/karhdo.dev" alt="Forks Badge"/></a>
    <a href="https://github.com/Karhdo/karhdo.dev/pulls"><img src="https://img.shields.io/github/issues-pr/Karhdo/karhdo.dev" alt="Pull Requests Badge"/></a>
    <a href="https://github.com/Karhdo/karhdo.dev/issues"><img src="https://img.shields.io/github/issues/Karhdo/karhdo.dev" alt="Issues Badge"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Karhdo/karhdo.dev" alt="License Badge"/></a>
</div>
<br>
<p align="center"><i>Loved the project? Please visit the <a href="https://karhdo.dev">website</a>.</i></p>
<p align="center"><b>v2</b> (Astro × Bun) runs on <a href="https://karhdo.dev">karhdo.dev</a> from <code>main</code> · <b>v1</b> (Next.js × pnpm) stays on <a href="https://v1.karhdo.dev">v1.karhdo.dev</a> from the <a href="https://github.com/Karhdo/karhdo.dev/tree/v1"><code>v1</code></a> branch.</p>
<br>

<a href="https://karhdo.dev"><img src="public/static/images/projects/karhdo-blog.png" alt="Karhdo's Blog" /></a>

## Tech stack

v2 is a rebuild of the v1 Next.js site, which lives on the [`v1`](https://github.com/Karhdo/karhdo.dev/tree/v1) branch. It keeps every v1 URL and the existing Postgres data.

| Area            | Choice                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime tooling | [Bun](https://bun.sh) 1.3 (package manager, scripts, `bun test`); Vercel Functions run on **Node 24**     |
| Framework       | [Astro 7](https://astro.build), TypeScript strict, static by default with a few on-demand routes         |
| Interactivity   | Vanilla `<script>` modules. React 19 only for the Giscus comments island and the lazy ⌘K palette        |
| Styling         | Tailwind CSS v4 (`@tailwindcss/vite`), Tokyonight Day / Night tokens, CSS-first motion                   |
| Content         | MDX content collections, explicit unified processor, [Expressive Code](https://expressive-code.com)      |
| Data            | [Drizzle ORM](https://orm.drizzle.team) + postgres.js on [Neon](https://neon.tech) (existing v1 `stats` table) |
| Search          | [Pagefind](https://pagefind.app) index built after `astro build`, opened from a ⌘K palette (cmdk)         |
| Social images   | Satori + resvg, rendered at build time (`/og/*.png`)                                                     |
| Tooling         | [Biome](https://biomejs.dev) (lint + format), [lefthook](https://lefthook.dev) pre-commit, GitHub Actions CI |
| Hosting         | [Vercel](https://vercel.com) via `@astrojs/vercel`                                                       |

## Features

- Bento homepage: intro with typed bios, latest post, Spotify now playing (with progress, or the last played track), GitHub activity heatmap (with a contribution-eating snake), blog stats with a 30-day views chart, **Token burn** (personal Claude Code usage), Daily stack marquee, selected projects, popular tags.
- `/about`: a `whoami` terminal card (live local time and uptime) above the author story.
- `/career`: stats, a year ruler, the career as a `git log --graph` with role chapters and per-role stack diffs.
- Site-wide snowfall (vanilla canvas at 30 fps, fewer flakes on phones, persists across page navigations, paused in hidden tabs and during transitions, off under reduced motion) over a frost-tinted tilted grid.
- Blog with tag chips, pagination, per-tag pages and RSS feeds (`/feed.xml`, `/tags/{tag}/feed.xml`), sitemap and robots.
- Post pages: sticky TOC with scrollspy, reading progress, code blocks with filename tabs, language badge, copy and line markers, callouts and GitHub alerts, image zoom, Twemoji, views and reactions, Giscus comments, newsletter signup (Buttondown).
- Flash-free light/dark/system theme on a `data-theme` attribute, view transitions, reduced-motion aware animations.
- ⌘K command palette over a Pagefind index, loaded only on first open.
- Footer Neovim-style statusline (build-time repo stars and commit, live Ho Chi Minh City clock) and a v1/v2 version switcher.

## Quickstart

Requirements: Bun 1.3.14 (`packageManager` in `package.json`) and Node ≥ 22.12 (Astro 7). Docker is only needed for a local Postgres.

```bash
bun install          # also installs the lefthook pre-commit hook
cp .env.example .env.local # every variable is optional
bun dev              # http://localhost:4321
```

Without any env vars the site builds and runs: each integration shows its empty state.

| Command                   | What it does                                                                     |
| ------------------------- | -------------------------------------------------------------------------------- |
| `bun dev`                 | Astro dev server, including the dev-only `/dev/*` preview pages                  |
| `bun test`                | Unit tests for the pure modules (`*.test.ts` next to the code)                   |
| `bun run check`           | `astro check` (types) + `biome check .`                                          |
| `bunx biome check --write`| Fix lint and formatting                                                          |
| `bun run lint:palette`    | Fails on any colour literal in `src/` outside the Tokyonight token files         |
| `bun run build`           | Production build into `.vercel/output` (OG images and Pagefind index included)   |
| `bun run db:pull`         | Drizzle introspection only (see [Database](#database))                           |

### Previewing a build

`astro preview` isn't supported by `@astrojs/vercel`, so `bun run preview` only prints a pointer here and exits. To check a build locally, serve `.vercel/output/static` with a static server, use `bunx vercel dev`, or deploy a preview. The on-demand routes (`/api/*`, `/projects`, `/newsletter`) need `bun dev`.

### Local Postgres (optional)

Views, reactions and the blog stats card need a database. The `stats` table is owned by the v1 Prisma migrations, so a local copy is created from those SQL files on the `v1` branch:

```bash
docker compose up -d postgres
export POSTGRES_URL=postgres://postgres:postgres@localhost:5432/karhdo_blog
git fetch origin v1
for m in 20230921142214_init_db 20241227070913_create_tbl_stats; do
  git show "origin/v1:prisma/migrations/$m/migration.sql" | psql "$POSTGRES_URL" -v ON_ERROR_STOP=1
done
psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f db/manual-migrations/0001_create_stats_daily.sql
```

Then put the same `POSTGRES_URL` in `.env`. SSL is turned off automatically for `localhost`.

## Project structure

```text
├── astro.config.mjs          # adapter, integrations, unified markdown processor, astro:env schema
├── ec.config.mjs             # Expressive Code themes (tokyo-night + converted Tokyonight Day)
├── drizzle.config.ts         # introspection only (never push/migrate)
├── db/manual-migrations/     # reviewed, additive SQL run by hand with psql
├── scripts/                  # build-info.mjs (footer facts), lint-palette.ts, convert-tmtheme.ts
├── public/static/            # favicons, images, resume.pdf, vendored Twemoji SVGs
└── src/
    ├── pages/                # routes; api/*, projects.astro and newsletter.astro are on-demand, the rest is prerendered
    ├── layouts/              # BaseLayout, PageLayout, ListLayout, PostLayout
    ├── components/           # by feature: home, blog, header, footer, search, seo, ui, mdx, islands …
    ├── content/              # blog/*.mdx, authors/*.mdx (content.config.ts defines the collections)
    ├── config/               # site.ts, navigation, projects, experiences, popular tags
    ├── lib/                  # pure, tested logic + services (db, stats, spotify, github, token burn, og, seo)
    ├── plugins/              # remark/rehype and Expressive Code plugins
    ├── styles/               # theme.css (the only colour tokens), global, prose, animations, callouts
    ├── integrations/         # dev-pages.ts: injects /dev/* under `astro dev` only
    └── dev-pages/            # token, component, content and MDX fixture pages (never built)
```

## Environment variables

All variables are declared in the `astro:env` schema (`astro.config.mjs`) and are optional. The names are unchanged from v1, so the Vercel project needs no renames. See [`.env.example`](.env.example).

| Variable                           | Access        | Vercel environments          | Used for                                                             |
| ---------------------------------- | ------------- | ---------------------------- | -------------------------------------------------------------------- |
| `POSTGRES_URL`                     | server secret | Production, Preview          | Views, reactions, blog stats (Neon `-pooler` host)                   |
| `GITHUB_API_TOKEN`                 | server secret | Production, Preview          | `/projects`, `/api/github`, activity card, footer stars at build     |
| `SPOTIFY_CLIENT_ID`                | server secret | Production, Preview          | Now playing                                                          |
| `SPOTIFY_CLIENT_SECRET`            | server secret | Production, Preview          | Now playing                                                          |
| `SPOTIFY_REFRESH_TOKEN`            | server secret | Production, Preview          | Now playing ([regenerate](#regenerating-the-spotify-refresh-token))  |
| `BUTTONDOWN_API_KEY`               | server secret | Production, Preview          | Newsletter signup. Read at build too: adding it later needs a redeploy |
| `TOKEN_BURN_INGEST_KEY`            | server secret | **Production only**          | Token burn ingest key ([setup](#token-burn-claude-code-usage))         |
| `NEXT_PUBLIC_GISCUS_REPO`          | server public | Production, Preview          | Giscus comments                                                      |
| `NEXT_PUBLIC_GISCUS_REPOSITORY_ID` | server public | Production, Preview          | Giscus comments                                                      |
| `NEXT_PUBLIC_GISCUS_CATEGORY`      | server public | Production, Preview          | Giscus comments                                                      |
| `NEXT_PUBLIC_GISCUS_CATEGORY_ID`   | server public | Production, Preview          | Giscus comments                                                      |
| `UMAMI_WEBSITE_ID`                 | server public | Production, Preview          | Umami analytics (script proxied through `/stats/*`)                  |

The `NEXT_PUBLIC_` prefix is kept only to avoid renaming Vercel variables. These values are read on the server and rendered into pages; no variable uses `context: 'client'`. `POSTGRES_URL_DIRECT` (the Neon direct host) is a local-only tooling variable for `bun run db:pull` and manual migrations; the app never reads it. Vercel's system variables (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_URL`, `VERCEL_BRANCH_URL`) must stay exposed.

### Token burn (Claude Code usage)

The card shows personal Claude Code usage. Claude Code's built-in **OpenTelemetry** export sends token and cost metrics every 60 s to `POST /api/otel/v1/metrics`, which adds them per day (Asia/Ho_Chi_Minh) and model into the `token_burn_daily` table. No background job or commits.

On each machine, run the setup script (it asks for `TOKEN_BURN_INGEST_KEY`, backs up and merges `~/.claude/settings.json`, then checks the key):

```bash
curl -fsSL https://raw.githubusercontent.com/Karhdo/karhdo.dev/main/scripts/setup-token-burn-telemetry.sh | bash
```

It adds this to `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT": "https://karhdo.dev/api/otel/v1/metrics",
    "OTEL_EXPORTER_OTLP_METRICS_HEADERS": "Authorization=Bearer <TOKEN_BURN_INGEST_KEY>",
    "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE": "delta"
  }
}
```

- Only `claude_code.token.usage` and `claude_code.cost.usage` are stored, as daily totals; sessions, users and other attributes are dropped. Cost is Claude Code's estimate at API prices.
- History before 2026-09-29 was imported once from ccusage (`scripts/import-token-burn-history.ts`).
- The ingest is protected by its key; it has no firewall rule (the Hobby plan allows only one rate-limit rule, used for `POST /api/stats`).
- Verify: `curl -s https://karhdo.dev/api/token-burn` returns `"available": true`.

### Regenerating the Spotify refresh token

If the Now playing card stays empty, check the token endpoint's error: `invalid_client` means the client id/secret pair is wrong (secret rotated or app deleted: copy the current secret from the dashboard), `invalid_grant` means the refresh token is revoked or expired: regenerate it as below. With the app's client id and secret from the [Spotify developer dashboard](https://developer.spotify.com/dashboard):

1. In the app settings, add the redirect URI `http://127.0.0.1:8888/callback` (Spotify only accepts loopback IPs, not `localhost`).
2. Open this URL in a browser while signed in to the Spotify account to show, and approve:

   ```text
   https://accounts.spotify.com/authorize?client_id=<CLIENT_ID>&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A8888%2Fcallback&scope=user-read-currently-playing%20user-read-playback-state%20user-read-recently-played
   ```

3. The browser lands on `http://127.0.0.1:8888/callback?code=…` (the page itself fails to load; that's fine). Copy the `code` value; it expires after a few minutes.
4. Exchange it for tokens:

   ```bash
   curl -s https://accounts.spotify.com/api/token \
     -H "Authorization: Basic $(printf '%s:%s' "$SPOTIFY_CLIENT_ID" "$SPOTIFY_CLIENT_SECRET" | base64)" \
     -d grant_type=authorization_code -d code=<CODE> \
     -d redirect_uri=http://127.0.0.1:8888/callback
   ```

5. Put the returned `refresh_token` in `SPOTIFY_REFRESH_TOKEN` (Vercel Production and Preview, and `.env` locally), then redeploy.
6. Verify: play something and `curl -s https://karhdo.dev/api/spotify` shows `"isPlaying": true`; with nothing playing it shows the last track with `"playedAt"` (needs the `user-read-recently-played` scope; without it the card says "Not playing").

## Database

Postgres on Neon. The app connects through the `-pooler` host (PgBouncer, transaction mode, so `prepare: false`). Drizzle **maps** the existing v1 `stats` table and `StatsType` enum in `src/lib/db/schema.ts`; it never creates or changes them.

- **Never run `drizzle-kit push`, `migrate` or `generate`.** There are no such scripts. `bun run db:pull` introspects into a git-ignored folder, to diff against the hand-written schema. Set `POSTGRES_URL_DIRECT` (the direct, non-pooler host) explicitly first.
- The one schema addition, `stats_daily` (daily views for the 30-day chart), is a reviewed, idempotent, additive-only SQL file run by hand with `psql`: first on a Neon branch, then on production. Applied to production on 2026-09-27 (see [`db/manual-migrations/README.md`](db/manual-migrations/README.md)). Deploy order doesn't matter: the daily write is best-effort and tolerates a missing table.

## Deployment (Vercel)

Two Vercel projects:

| Site | Project | Source | Deploys |
| --- | --- | --- | --- |
| [karhdo.dev](https://karhdo.dev) (v2) | `karhdo-blog` | `main` (production), other branches (previews) | Git pushes |
| [v1.karhdo.dev](https://v1.karhdo.dev) (v1) | `karhdo-blog-v1` | the `v1` branch, not Git-linked | by hand: from a `v1` checkout, `vercel link --project karhdo-blog-v1`, then `vercel deploy --prod` |

v1 is a frozen archive with its own env (Next.js/pnpm, `ENABLE_EXPERIMENTAL_COREPACK=1`, which must never be set on `karhdo-blog`: Corepack rejects Bun). v1 is `noindex` and read-only: it shows stats from the shared `stats` table, but only v2 records views and reactions.

`karhdo-blog` settings:

- Framework preset **Astro**, install `bun install --frozen-lockfile`, build `bun run build` (also in [`vercel.json`](vercel.json)).
- **Node.js 24.x** for Functions. Don't set `bunVersion` in `vercel.json`: that moves Functions onto the Bun runtime.
- "Automatically expose System Environment Variables" on.

Rules:

- **Never deploy with `astro build` + `vercel deploy --prebuilt` without `vercel build`.** `@astrojs/vercel` doesn't merge `vercel.json` into the build output; the platform does that in `vercel build` and Git deploys. Skipping it drops the security headers, the `/stats/*` Umami rewrite and the redirects.
- Security headers (CSP, HSTS, …) live in `vercel.json`, since static files never pass through a function.
- **Vercel Firewall** rule "Rate limit stats writes" (live): `POST /api/stats` at 30 requests / 60 s per IP, 429 above. The Origin check only stops browser CSRF; scripted clients can forge `Origin`. The Hobby plan allows only this one rate-limit rule, so `POST /api/newsletter` (~5 / 60 s) needs a paid plan.
- Buttondown uses double opt-in, since the form never sends `type: "regular"`.
- Dependabot (`.github/dependabot.yml`, Bun ecosystem) reads its config only from the default branch (`main`), so it takes effect once v2 is merged into `main`.

## Design rules

- **Tokyonight only.** Every colour is a token from `src/styles/theme.css` (Day in `:root`, Night in `[data-theme="dark"]` and the `prefers-color-scheme` fallback), mirrored in `src/styles/palette.ts`. No brand or off-palette hex values; brand logos are tinted with tokens. `bun run lint:palette` enforces it in CI.
- **Contrast (Day theme).** `--faint` and `--muted` fail WCAG AA for small text: use them for decorative marks and large text only, and `--fg-soft` / `--fg` for meaningful small text. Never put `--bg` text on `--blue` in Day; solid accent chips use a `--heat-4` background with `--surface-solid` text.
- **Cache headers on on-demand routes.** Never send `s-maxage` / `stale-while-revalidate` in `Cache-Control` without a browser `max-age` (browsers would serve stale data for the SWR window). Use `Cache-Control: public, max-age=0, must-revalidate` for browsers plus `Vercel-CDN-Cache-Control: max-age=N, stale-while-revalidate=M` for the CDN.
- **Motion.** Effects run only under `prefers-reduced-motion: no-preference`, animate only transform/opacity/filter/clip-path, and content is complete at rest.

## Credits

- Design and code patterns borrowed from [Leo Huynh](https://github.com/hta218)'s [leohuynh.dev](https://github.com/hta218/leohuynh.dev) (Astro rebuild), which v1 was also based on, along with Timothy Lin's Tailwind Next.js Starter Blog.
- Colours from [Tokyonight](https://github.com/folke/tokyonight.nvim) by Folke Lemaitre (Apache-2.0). The light code theme is converted from its `extras/sublime/tokyonight_day.tmTheme` at a pinned commit.
- Emoji from [Twemoji](https://github.com/jdecked/twemoji) v17.0.3 by jdecked, graphics licensed under [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Brand logos from [simple-icons](https://simpleicons.org) (CC0), icons from [Lucide](https://lucide.dev) (ISC), fonts Outfit and JetBrains Mono (SIL OFL 1.1).
- Blog images from [Unsplash](https://unsplash.com/), GIFs from [GIPHY](https://giphy.com/), illustrations from [Storyset](https://storyset.com/).

Full licence notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

[MIT](LICENSE) © Do Trong Khanh (Karhdo). If this project helped you, a ⭐ is appreciated.
