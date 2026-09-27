# 21 — Giscus comments

## Endpoint

None (third-party iframe `giscus.app`).

## Summary

Port the Giscus comments island to the post page, lazily hydrated when scrolled into view, reading its config from the v1-named `NEXT_PUBLIC_GISCUS_*` variables via `astro:env/server` (server/public) in `PostLayout.astro` and passing them to the island as props (no env renames), and following the site theme live (including after view-transition navigation) without remounting.

## Files to Create/Modify/Delete

- **Create** `src/components/islands/Comments.tsx` — port v1 `components/ui/Comments.tsx`: `@giscus/react` (`@giscus/react@^3.1.0`), props `repo`, `repoId`, `category`, `categoryId` (passed from `PostLayout.astro`, which imports them from `astro:env/server`) merged with the `GISCUS` defaults in `src/config/site.ts` (`mapping: 'title'` kept so existing discussions stay attached), `loading="lazy"`; initial theme from `document.documentElement.dataset.theme === 'dark'` (falling back to `matchMedia('(prefers-color-scheme: dark)')` when the attribute is absent) → `transparent_dark` / `light`; listens to the `theme-change` CustomEvent (task 09) and posts `{ giscus: { setConfig: { theme } } }` to the iframe. Renders nothing (and a small "Comments are not configured" note in DEV) when env ids are missing.
- **Modify** only `src/components/blog/PostComments.astro` (the stub from task 12, m2): `<section id="comments"><Comments client:visible term={title} … /></section>`, with the Giscus ids from `astro:env/server` passed as props. **Do not edit `PostLayout.astro`.** "Load comments" isn't needed because `client:visible` already defers.
- **Modify** `src/components/blog/ScrollTopAndComment.astro` — scroll target `#comments` (already).

## Implementation Steps

1. `git show main:components/ui/Comments.tsx main:types/giscus-configs.type.ts`.
2. Copy the existing `NEXT_PUBLIC_GISCUS_*` values into the local `.env` (same names as in Vercel; nothing to rename).
3. Test: open a post, scroll to comments → iframe loads, existing discussion for the post title appears; toggle theme → iframe theme switches; navigate to another post via view transition → correct discussion.

## Acceptance Criteria

- [ ] `bun run build` succeeds without Giscus env.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] Existing v1 discussions appear under the same posts (mapping by title unchanged).
- [ ] Theme toggle updates the Giscus theme without reloading the iframe.
- [ ] No Giscus network requests until the comments section is near the viewport.
- [ ] No CSP violations in the console (`frame-src giscus.app`, `script-src giscus.app`).

## Dependencies

- v2-astro-blog-post-page

## Patterns to Follow

- v1 `components/ui/Comments.tsx`, `data/siteMetadata.js` `comments.giscusConfig`.
- Reference `src/components/widgets/Comments.tsx`, `src/lib/comments.ts` (hta218/leohuynh.dev).
