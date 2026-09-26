# 10 — Content collections for blog and authors

## Endpoint

None.

## Summary

Move MDX content into `src/content/` and define Astro content-layer collections (glob loader) whose schema mirrors v1 `contentlayer.config.ts`, so frontmatter migrates 1:1 and each entry's `id` equals the v1 slug. Provide content helpers (sorted published posts, prev/next, tag counts, reading time) that replace pliny/contentlayer utils and `app/tag-data.json`.

## Files to Create/Modify/Delete

- **Move** `data/blog/*.mdx` → `src/content/blog/*.mdx` (3 files, `git mv` to keep history); `data/authors/*.mdx` → `src/content/authors/*.mdx`.
- **Modify** each moved MDX: delete the line `import Twemoji from './components/ui/Twemoji';` (the component is injected via the MDX `components` prop in task 11). No other body changes. `resume.mdx`: keep file, but its frontmatter `layout: ResumeLayout` is accepted by the schema and unused.
- **Delete** `data/` (now empty).
- **Create** `src/content.config.ts`:
  - `blog`: `glob({ pattern: '**/*.mdx', base: './src/content/blog' })`, schema `{ title: z.string(), date: z.coerce.date(), lastmod: z.coerce.date().optional(), tags: z.array(z.string()).default([]), draft: z.boolean().default(false), summary: z.string().optional(), images: z.union([z.string(), z.array(z.string())]).optional(), authors: z.array(z.string()).default(['default']), layout: z.enum(['PostLayout','PostSimple','PostBanner']).optional(), bibliography: z.string().optional(), canonicalUrl: z.string().url().optional() }`.
  - `authors`: `glob({ pattern: '**/*.mdx', base: './src/content/authors' })`, schema `{ name, avatar?, occupation?, company?, email?, twitter?, linkedin?, github?, layout? }`.
  - Import `z` from `astro/zod`.
- **Create** `src/lib/tags.ts` (pure, no `astro:*` imports, so `bun test` can load it): `countTags(posts: { data: { tags: string[]; draft?: boolean } }[], { includeDrafts })` → `Record<slug, { label, count }>`, and `tagSlug(label)` wrapping `github-slugger`'s `slug()`.
- **Create** `src/lib/reading-time.ts` (pure): `getReadingTime(body: string)` → `{ text, minutes, words }` via `reading-time`.
- **Create** `src/lib/tags.test.ts`: runs `countTags` over the three MDX files' frontmatter (read with `fs` and parsed with the `yaml` package, no Astro involved). It asserts the counts equal v1 `app/tag-data.json`, frozen as the fixture `src/lib/__fixtures__/v1-tag-data.json` and copied from `git show main:app/tag-data.json`. It also checks `design patterns` and `design-patterns` both map to `design-patterns`.
- **Create** `src/lib/reading-time.test.ts`: a 400-word string → `2 min read`; an empty body → `0 min read` (the `reading-time@1.5.0` output).
- **Create** `src/lib/content.ts` (the Astro-facing wrappers, which call the pure helpers above):
  - `getPublishedPosts()` — `getCollection('blog', (p) => import.meta.env.PROD ? !p.data.draft : true)` sorted by `date` desc (v1 `sortPosts`).
  - `getPostNeighbours(id)` → `{ prev, next }` (v1: prev = older = index+1, next = newer = index-1).
  - `getTagCounts()` → `countTags(await getPublishedPosts())` (replaces `app/tag-data.json`).
  - `getPostsByTag(tagSlug)`.
  - re-export `getReadingTime` (add `reading-time@^1.5.0`, and dev dep `yaml` for the test), applied to `entry.body`.
  - `getAuthor(id = 'default')`.
  - `postUrl(post)` → `/blog/${post.id}`.
- **Create** `src/lib/utils/format-date.ts` — `formatDate(date, locale = SITE.locale)` → `"December 10, 2023"` (v1 pliny format: `{ year: 'numeric', month: 'long', day: 'numeric' }`).

## Implementation Steps

1. `git mv` the directories; strip the Twemoji import lines.
2. Write `content.config.ts`; run `bunx astro sync` and fix any schema error.
3. Write the helpers and tests; add the dev-only page `src/dev-pages/content.astro` (served at `/dev/content` in `bun dev` only) listing ids, dates, tag slugs and reading time.
4. Confirm ids: `exploring-module-in-nestjs`, `how-to-prevent-overbooking-in-sql-with-multiple-methods`, `problems-when-the-application-develops`; tag slugs: `nestjs, typescript, javascript, design-patterns, database, application` (matches v1 `public/tags/*` output: application, database, design-patterns, javascript, nestjs, typescript).

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes; `CollectionEntry<'blog'>` types resolve.
- [ ] `bun test` passes (tag counts equal v1 `tag-data.json`; reading time).
- [ ] Entry ids equal the three v1 slugs exactly.
- [ ] `getTagCounts()` yields exactly the 6 v1 tag slugs with the same counts as v1 `app/tag-data.json` (`git show main:app/tag-data.json`).
- [ ] No MDX file contains `import Twemoji`.
- [ ] `data/` directory no longer exists.

## Dependencies

- v2-astro-site-config-env

## Patterns to Follow

- v1 `contentlayer.config.ts` (fields, `createTagCount`, `structuredData`).
- Reference `src/content.config.ts`, `src/lib/content.ts` (hta218/leohuynh.dev).
