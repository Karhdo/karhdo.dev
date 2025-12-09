# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The blog uses Contentlayer for MDX content management and is deployed on Vercel. It's based on the Tailwind Nextjs Starter Blog template with custom enhancements including Tokyonight theme colors and integration with external services (Spotify, GitHub, PostgreSQL).

## Commands

### Development

```bash
pnpm dev                 # Start development server with cross-env
pnpm start              # Alternative dev command (plain next dev)
```

### Build & Production

```bash
pnpm build              # Build for production (runs postbuild script)
pnpm serve              # Start production server
pnpm analyze            # Build with bundle analyzer enabled
```

### Code Quality

```bash
pnpm lint               # Run ESLint with auto-fix on app, components, lib, layouts, scripts
```

### Database

```bash
pnpm postinstall        # Generate Prisma client (runs automatically after install)
pnpm migrate:postgres   # Run Prisma migrations with .env.local
```

## Architecture

### Content Management (Contentlayer)

The blog uses **Contentlayer** to transform MDX files into type-safe data. Key aspects:

- **Content Location**: MDX files live in `data/blog/` and `data/authors/`
- **Document Types**: Defined in `contentlayer.config.ts`
  - `Blog`: Blog posts with frontmatter (title, date, tags, draft, summary, etc.)
  - `Authors`: Author profiles
- **Processing Pipeline**: Contentlayer processes MDX with remark/rehype plugins:
  - Remark: GFM, math, code titles, image JSX conversion, GitHub alerts
  - Rehype: Slug generation, autolink headings, Prism syntax highlighting, KaTeX math, citations
- **Build Artifacts**:
  - `app/tag-data.json`: Generated tag count for all blog posts
  - `public/search.json`: Search index for kbar search (if enabled in siteMetadata)
  - `.contentlayer/`: Generated type-safe content data

### Application Structure (Next.js App Router)

- **App Directory** (`app/`): Uses Next.js 16 App Router
  - `app/layout.tsx`: Root layout with theme providers, analytics, search, header/footer
  - `app/page.tsx`: Homepage
  - `app/blog/[...slug]/page.tsx`: Dynamic blog post pages
  - `app/blog/page.tsx` & `app/blog/page/[page]/page.tsx`: Blog listing with pagination
  - `app/tags/[tag]/page.tsx`: Tag-based filtering
  - `app/about/page.tsx`: About page
  - `app/projects/page.tsx`: Projects showcase
  - `app/api/`: API routes for external integrations

- **Layouts** (`layouts/`): Reusable page layouts
  - `PostLayout.tsx`, `PostSimple.tsx`, `PostBanner.tsx`: Blog post layouts
  - `ListLayout.tsx`, `ListLayoutWithTags.tsx`: Blog listing layouts
  - `AuthorLayout.tsx`: Author profile layout

- **Components** (`components/`): Organized by feature
  - `about/`, `analytics/`, `blog/`, `footer/`, `header/`, `homepage/`, `project/`, `ui/`

### Data & Configuration

- **Site Metadata** (`data/siteMetadata.js`): Central configuration for site title, author, social links, analytics (Umami), comments (Giscus), search (kbar), newsletter (Buttondown)
- **Navigation** (`data/headerNavLinks.ts`): Header navigation links
- **Projects** (`data/projectsData.ts`): Project portfolio data
- **Popular Tags** (`data/popularTags.ts`): Curated tag list

### External Integrations

The blog integrates with external services via API routes and server utilities:

- **Spotify** (`app/api/spotify/route.ts`, `servers/spotify.server.ts`): Fetches currently playing track
  - Requires: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`

- **GitHub** (`app/api/github/route.ts`, `servers/github.server.ts`): Fetches repository data for projects page
  - Requires: `GITHUB_API_TOKEN`
  - Uses `@octokit/graphql` for GraphQL API queries

- **PostgreSQL/Prisma** (`app/api/stats/route.ts`, `servers/prisma.server.ts`, `prisma/schema.prisma`):
  - Stores blog post statistics (views, reactions: loves, applauses, ideas, bullseye)
  - Schema: `Stats` model with composite key `[type, slug]`
  - Requires: `POSTGRES_URL`

- **Giscus Comments**: GitHub-based comments configured via environment variables
  - Requires: `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPOSITORY_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

### Styling & Theming

- **Tailwind CSS**: Custom configuration in `tailwind.config.js`
- **Theme System**: Dark mode support via `next-themes`
  - Theme provider: `app/theme-providers.tsx`
  - Colors: Tokyonight Neovim theme palette
- **Custom Fonts**: Outfit font from Google Fonts loaded in `app/layout.tsx`
- **Global Styles**: `css/tailwind.css`, `css/twemoji.css`

### Build Process

- **Build Tool**: Turbopack is the default bundler in Next.js 16 (use `--webpack` flag to switch to Webpack)
- **Contentlayer Integration**: `next.config.js` wraps Next.js config with `withContentlayer`
- **Post-build Script** (`scripts/postbuild.mjs`): Runs after Next.js build
- **RSS Feed** (`scripts/rss.mjs`): Generates RSS feed
- **Bundle Analyzer**: Optional via `ANALYZE=true` environment variable
- **Security Headers**: CSP, referrer policy, X-Frame-Options configured in `next.config.js`
- **SVG Handling**: Turbopack configured with SVGR loader for SVG React components (`turbopack.rules` in `next.config.js`)

## Important Patterns

### Adding New Blog Posts

1. Create MDX file in `data/blog/`
2. Include required frontmatter: `title`, `date`
3. Optional frontmatter: `tags`, `draft`, `summary`, `images`, `authors`, `layout`
4. Contentlayer will auto-generate types and build artifacts on next dev/build

### Working with Stats/Reactions

- Stats are stored per blog post by slug in PostgreSQL
- API endpoint: `app/api/stats/route.ts` handles CRUD operations
- Frontend components can fetch/update stats via this API

### Environment Variables

Required for full functionality:

- **Database**: `POSTGRES_URL`
- **GitHub Integration**: `GITHUB_API_TOKEN`
- **Spotify Integration**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`
- **Comments**: `NEXT_PUBLIC_GISCUS_*` variables
- **Analytics**: `UMAMI_WEBSITE_ID` (optional)

See `.env.local.example` for the complete list.

## Conventions

- **Commit Messages**: Uses Conventional Commits format
- **Code Style**: ESLint + Prettier with Tailwind plugin
- **Pre-commit Hooks**: Husky + lint-staged for linting and formatting
- **TypeScript**: Strict mode enabled
- **React**: Strict mode enabled in Next.js config
