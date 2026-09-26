# 14 — Tags index and tag pages

## Endpoint

None (tag RSS feeds are task 24).

## Summary

Recreate `/tags` (all tags sorted by count) and `/tags/[tag]` (posts for a tag, no pagination — same as v1) using the slugs from `github-slugger`, so v1 tag URLs keep working (`application, database, design-patterns, javascript, nestjs, typescript`).

## Files to Create/Modify/Delete

- **Create** `src/pages/tags/index.astro` — `getTagCounts()` sorted by count desc; each tag as a pill (`Tag` + count), plus popular-tag cards (from `src/config/popular-tags.ts`, brand icon + coloured background as in v1 `.popular-tags` CSS) at the top.
- **Create** `src/pages/tags/[tag].astro` — `getStaticPaths()` over tag slugs; title = v1 rule (capitalise first letter, spaces → dashes: `tag[0].toUpperCase() + tag.split(' ').join('-').slice(1)`); `ListLayout` with `TagFilterChips active={tag}` (task 13) and dated rows; `BaseLayout` `rssFeed=/tags/{tag}/feed.xml`; description `${SITE.title} ${tag} tagged content` (v1).
- **Create** `src/components/tags/PopularTags.astro` — port v1 `components/homepage/PopularTags.tsx` (reused by the homepage bento in task 15 if desired).

## Implementation Steps

1. Port from `git show main:app/tags/page.tsx main:app/tags/[tag]/page.tsx main:components/homepage/PopularTags.tsx` and the `.popular-tags` CSS block from `main:css/tailwind.css`.
2. Build and list `.vercel/output/static/tags/`.

## Acceptance Criteria

- [ ] `bun run build` succeeds and generates `tags/index.html` plus 6 `tags/<tag>/index.html` pages whose directory names equal the v1 `public/tags/*` directory names (directory build format forced by `@astrojs/vercel`).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/tags/design-patterns` lists both posts tagged `design-patterns` / `design patterns` (slug normalisation works across the two spellings).
- [ ] Counts on `/tags` equal v1 `app/tag-data.json`.
- [ ] Popular-tag cards whose slug has no posts (currently `react`, `devops`) are hidden, so no card links to a 404.

## Dependencies

- v2-astro-blog-list-pagination

## Patterns to Follow

- v1 `app/tags/page.tsx`, `app/tags/[tag]/page.tsx`, `components/homepage/PopularTags.tsx`, `data/popularTags.ts`.


> **Note from task 24 review:** after building the tag pages, confirm `sitemap-0.xml` lists `/tags` and every `/tags/<slug>` page (6 today); the sitemap integration picks them up automatically once they are prerendered.
