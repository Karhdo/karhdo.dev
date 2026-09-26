# 07 — Base layout: SEO head, flash-free theme, view transitions, Umami

## Endpoint

None.

## Summary

Create the document shell every page uses: `<head>` with SEO/OG/Twitter/canonical/RSS/JSON-LD, favicons, the inline theme script that applies light/dark before first paint, Astro `<ClientRouter />` view transitions, the tilted-grid background, Umami analytics, and a skip link. Header/footer slots are filled in task 09.

## Files to Create/Modify/Delete

- **Create** `src/layouts/BaseLayout.astro` — props `{ title?: string; description?: string; image?: string; type?: 'website' | 'article'; publishedTime?: Date; modifiedTime?: Date; tags?: string[]; noindex?: boolean; jsonLd?: object; rssFeed?: string }`. Renders `<html lang="en" class="scroll-smooth">`, `<head>` (`<Seo />`, `<ThemeScript />`, `<ClientRouter />`, `<Analytics />`), `<body class="bg-bg text-fg antialiased">`, skip link `#main`, `<slot name="header" />`, `<main id="main">`, `<slot />`, `<slot name="footer" />`.
- **Create** `src/layouts/PageLayout.astro` — wraps `BaseLayout` with Header/Footer (task 09 wires them) and a max-width container (`max-w-5xl` / `xl:max-w-6xl`, v1 `SectionContainer` widths).
- **Create** `src/components/seo/Seo.astro` — title template `%s | ${SITE.title}` (default `SITE.title`), description, canonical (`new URL(Astro.url.pathname, SITE.siteUrl)` without trailing slash), `og:*` (title, description, url, site_name, locale `en_US`, type, image absolute URL, `article:published_time`, `article:modified_time`, `article:author`, `article:tag`), Twitter `summary_large_image`, robots (`index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` — v1 values; `noindex` override), `<link rel="alternate" type="application/rss+xml" href="/feed.xml">` (+ tag feed when `rssFeed` passed), `<link rel="sitemap" href="/sitemap-index.xml">`, favicons (`/static/favicons/tennis-racquet.png` 32/16, webmanifest), `<meta name="theme-color" media="(prefers-color-scheme: light)" content="#e1e2e7">` and `media="(prefers-color-scheme: dark)" content="#16161e"` (the mockup `--bg` values; the ThemeScript also updates a single un-mediated `theme-color` when the user overrides the OS), JSON-LD `<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />`.
- **Create** `src/lib/seo.ts` — `absoluteUrl(path)`, `pageTitle(title?)`, `buildBlogPostingJsonLd(post, author)` (port of v1 `structuredData`: headline, datePublished, dateModified, description, image, url, author Person), `buildWebsiteJsonLd()`.
- **Create** `src/components/seo/ThemeScript.astro` — `<script is:inline>`: `const t = localStorage.getItem('theme') ?? 'system'; const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light';` wrapped in a function (the attribute is always set to the _resolved_ value when JS runs; with JS off it is absent and the `prefers-color-scheme` fallback in `theme.css` applies), re-run on `document.addEventListener('astro:after-swap', apply)`; also listens to `matchMedia` changes when `theme === 'system'`. Wrap `localStorage` access in try/catch.
- **Create** `src/components/seo/Analytics.astro` — reads `UMAMI_WEBSITE_ID` from `astro:env/server` (server/public, v1 name); when set: `<script is:inline defer src="/stats/script.js" data-website-id={id} data-astro-rerun={false}></script>` (Umami auto-tracks history pushes, so it must not re-run on swap); nothing in dev.
- **Create** `src/components/ui/TiltedGridBackground.astro` — port v1 component using `src/assets/icons/tilted-grid.svg` as an Astro SVG component (move of that one file happens here; the rest in task 08), `mask-image` gradient, `aria-hidden`.
- **Modify** `public/static/favicons/site.webmanifest` — fill `name`/`short_name` ("Karhdo's Blog"/"Karhdo"), fix icon path to `/static/favicons/tennis-racquet.png`, `theme_color` and `background_color` `#16161e`.
- **Modify** `src/pages/index.astro` — use `PageLayout` (still placeholder content).

## Implementation Steps

1. Port v1 `app/layout.tsx` `metadata` and `lib/seo.ts` field-by-field into `Seo.astro` / `seo.ts`.
2. Implement `ThemeScript` first in `<head>` (before any stylesheet link is irrelevant in Astro — just ensure it is `is:inline` and not deferred).
3. Add `<ClientRouter />` from `astro:transitions`; set `transition:animate="fade"` default on `<main>`.
4. Add Analytics; verify request goes to `/stats/script.js` (proxied by `vercel.json`).
5. Test: hard-reload in dark OS mode with no stored theme → no white flash (record a performance trace or screen recording); navigate between two pages → theme persists; set `localStorage.theme='light'` in dark OS → light.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] View source of `/` contains title, description, canonical `https://karhdo.dev`, og:image absolute URL, twitter card, RSS alternate, JSON-LD `WebSite`.
- [ ] `<html>` has `data-theme="light"|"dark"` (never a `.dark` class); with JS disabled the attribute is absent and the OS scheme decides.
- [ ] `theme-color` metas are `#e1e2e7` (light) and `#16161e` (dark), read from `src/styles/palette.ts` (`palette.day.bg` / `palette.night.bg`) rather than typed inline.
- [ ] No flash of the wrong theme on hard reload (dark OS, light OS, stored override) — checked in Chrome with CPU 4× slowdown.
- [ ] Navigating between pages uses view transitions (no full reload in Network tab) and theme stays applied.
- [ ] With `UMAMI_WEBSITE_ID` set, `/stats/script.js` is requested once per full load; without it, no analytics tag is emitted.
- [ ] Skip link is the first focusable element.

## Dependencies

- v2-astro-site-config-env
- v2-astro-design-tokens

## Patterns to Follow

- v1 `app/layout.tsx`, `lib/seo.ts`, `app/blog/[...slug]/page.tsx` (`generateMetadata`), `components/analytics/umami.tsx`, `components/ui/TiltedGridBackground.tsx`.
- Reference `src/layouts/BaseLayout.astro`, `src/components/JsonLd.astro` (hta218/leohuynh.dev).
- Astro docs: "View transitions → Script behavior" (`astro:after-swap`, `data-astro-rerun`).
