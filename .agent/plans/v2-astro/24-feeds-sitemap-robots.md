# 24 — RSS feeds, sitemap and robots.txt

## Endpoint

Static (prerendered) endpoints: `GET /feed.xml`, `GET /tags/{tag}/feed.xml`, `GET /robots.txt`, `GET /sitemap-index.xml` (+ `/sitemap-0.xml`); `/sitemap.xml` 301 → `/sitemap-index.xml` (task 04).

## Summary

Replace `scripts/rss.mjs` (post-build file writer) and Next's `app/sitemap.ts` / `app/robots.ts` with Astro-native prerendered endpoints and `@astrojs/sitemap`, keeping the same feed URLs and item structure.

## Files to Create/Modify/Delete

- **Create** `src/pages/feed.xml.ts` — `@astrojs/rss` (`@astrojs/rss@^4.0.19`): `title: SITE.title`, `description: SITE.description`, `site: SITE.siteUrl`, channel link `/blog` (v1), `customData`: `<language>en-us</language>`, `<managingEditor>`/`<webMaster>` `${email} (${author})`, `<lastBuildDate>` = newest post date; `xmlns: { atom }` + `<atom:link rel="self" href="…/feed.xml"/>`; items: `title`, `link: /blog/{id}`, `pubDate: date`, `description: summary`, `categories: tags` (original tag labels, v1), `author: "${email} (${author})"`. Published posts only.
- **Create** `src/pages/tags/[tag]/feed.xml.ts` — `getStaticPaths()` over tag slugs; same generator filtered by tag; self link `…/tags/{tag}/feed.xml`.
- **Create** `src/lib/rss.ts` — shared `buildFeed(posts, selfPath)`.
- **Create** `src/pages/robots.txt.ts` — `User-agent: *\nAllow: /\n\nHost: https://karhdo.dev\nSitemap: https://karhdo.dev/sitemap-index.xml` (v1 content, new sitemap path).
- **Modify** `astro.config.mjs` (**shared-file rule, m2**: tasks 23, 24 and 25 all edit this file in p5, so they are **merged one at a time**. Rebase on the latest `v2` before merging and re-run `bun run build`. Each adds only its own integration/option and never reorders existing ones; `expressiveCode()` stays before `mdx()`, and `pagefind()` stays last.) — add `sitemap({ filter: (page) => !page.includes('/dev/') /* defensive; dev pages are never built (task 06) */, serialize(item) { … lastmod for blog posts from frontmatter lastmod ?? date … } })` (`@astrojs/sitemap@^3.7.4`). `/projects` is on-demand so add it via `customPages: ['https://karhdo.dev/projects']` (v1 sitemap listed `''`, `blog`, `projects`, `tags` + posts).

## Implementation Steps

1. Port from `git show main:scripts/rss.mjs main:app/sitemap.ts main:app/robots.ts`.
2. `getCollection` is unavailable inside `astro.config.mjs`, so build the post `lastmod` map in a small helper `src/lib/sitemap-lastmod.mjs` that reads `src/content/blog/*.mdx` with `fs`, parses the frontmatter block with the `yaml` package (add as devDependency), and returns `{ '/blog/{id}': lastmod ?? date }`; `serialize` looks up each URL in it. This keeps post `lastmod` equal to v1.
3. Validate feeds with the W3C feed validator (paste XML) and in an RSS reader.

## Acceptance Criteria

- [ ] `bun run build` succeeds and outputs `feed.xml`, 6 × `tags/{tag}/feed.xml`, `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml`.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/feed.xml` items' `<link>`/`<guid>` equal v1 (`https://karhdo.dev/blog/{slug}`) so existing subscribers see no duplicates; feed validates (W3C).
- [ ] `sitemap-0.xml` contains `/`, `/blog`, `/projects`, `/tags`, `/about`, the 6 tag pages and 3 posts (with `lastmod` for posts), and no `/dev/` URLs.
- [ ] `robots.txt` references `https://karhdo.dev/sitemap-index.xml`.

## Dependencies

- v2-astro-content-collections

## Patterns to Follow

- v1 `scripts/rss.mjs`, `app/sitemap.ts`, `app/robots.ts`.
- Reference `src/pages/feed.xml.ts`, `src/pages/topics/[tag]/feed.xml.ts`, sitemap config in `astro.config.mjs` (hta218/leohuynh.dev).
