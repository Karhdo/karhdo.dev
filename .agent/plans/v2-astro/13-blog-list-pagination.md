# 13 — Blog list with pagination and tag filter chips

## Endpoint

None.

## Summary

Recreate `/blog` and `/blog/page/[page]` (5 posts per page, as v1) in the mockup's layout: a page head (eyebrow `Blog · N posts`, h1 "Writing", intro line), a row of **tag filter chips** (`all` + one chip per tag, from `getTagCounts()`), and **dated rows** (mockup `.post-row`: ISO date column · title + summary + tags · reading time on the right). The chips are real links: `all` → `/blog`, and each tag → `/tags/{slug}` (the same chip bar with the active chip is reused on tag pages, task 14). They work without JS, keep v1 URLs, and filter across all pages rather than just the current one. The active chip has `aria-current="page"`. This chip bar replaces v1's `ListLayoutWithTags` sidebar. The reusable `PostList`/`PostRow` components are also used by the tag pages and the homepage's "Recent posts" list. Page 1 lives at `/blog`; `/blog/page/1` 301-redirects to `/blog` (vercel.json, task 04) and is not generated.

## Files to Create/Modify/Delete

- **Create** `src/pages/blog/index.astro` — first page of `getPublishedPosts()` rendered with `ListLayout` (eyebrow `Blog · {total} posts`, h1 "Writing", description "Notes on backend architecture, databases and TypeScript, written while building real products." from the mockup), `<title>` "Blog" (v1).
- **Create** `src/pages/blog/page/[page].astro` — `getStaticPaths({ paginate })` using `paginate(posts, { pageSize: SITE.postsPerPage })`, filtered to skip page 1 (return paths for `page >= 2`); 404 for out-of-range handled by static generation.
- **Create** `src/components/blog/PostList.astro` — `<ol>` of `PostRow`.
- **Create** `src/components/blog/PostRow.astro` — mockup `.post-row`: `<time datetime>` in ISO `YYYY-MM-DD` (mono, muted), title (`transition:name={`post-title-${id}`}` to morph into the post page), summary, tag pills (non-link spans, so the row stays a single link), reading time (`8 min`) on the right; the whole row is one `<a>` with hover glass highlight.
- **Motion (item 5, mockup "Post rows" and "Chips").** Row hover grows an underline under the title (`background: linear-gradient(currentColor, currentColor) 0 100% / 0 1.5px no-repeat` → `background-size: 100% 1.5px`, .35 s `--ease-out`) and nudges the arrow. Tag chips pop on hover (`translateY(-2px) scale(1.04)`, spring, with a `--line-strong` border). The page head and chip bar carry `.reveal`. Everything is motion-safe; with reduced motion, only colour changes on hover.
- **Create** `src/components/blog/Pagination.astro` — Previous / `Page X of Y` / Next; previous from page 2 goes to `/blog`; `rel="prev"`/`rel="next"`.
- **Create** `src/components/blog/TagFilterChips.astro` — mockup `.filters` (`role="group" aria-label="Filter by tag"`): `all` chip + tag chips sorted by count (label = slug, `title` shows the count), `active` prop (`'all'` or a tag slug).
- **Create** `src/layouts/ListLayout.astro` — page head (eyebrow, h1, description) + `TagFilterChips` + `PostList` + optional `Pagination`.

## Implementation Steps

1. Port from `git show main:layouts/ListLayoutWithTags.tsx main:layouts/ListLayout.tsx main:app/blog/page.tsx main:app/blog/page/[page]/page.tsx`.
2. v1's client-side search box in `ListLayout` is replaced by the ⌘K palette (task 23); add a "Search posts ⌘K" button that dispatches `open-command-palette`.
3. Temporarily set `postsPerPage: 1` locally to exercise pagination (3 posts → `/blog`, `/blog/page/2`, `/blog/page/3`), then restore 5.

## Acceptance Criteria

- [ ] `bun run build` succeeds.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/blog` lists all 3 posts newest first with date, tags, summary.
- [ ] With `postsPerPage = 1` (local experiment): `/blog/page/2` and `/blog/page/3` exist, `/blog/page/1` is not generated, navigation links are correct.
- [ ] Clicking a row navigates with a title morph (view transition) when motion is allowed.
- [ ] Tag chips: `all` is active on `/blog`; each chip links to `/tags/{slug}`; works with JS disabled.
- [ ] Row hover grows the title underline and chips pop (motion allowed only); neither causes layout shift.
- [ ] Rows show ISO date, title, summary, tags and reading time as in the mockup.

## Dependencies

- v2-astro-header-footer
- v2-astro-content-collections

## Patterns to Follow

- Mockup `#view-blog` (`.page-head`, `.filters`, `.post-row`).
- v1 `layouts/ListLayout.tsx`, `layouts/ListLayoutWithTags.tsx` (behaviour/pagination only).
- Reference `src/components/PostList.astro`, `src/pages/blog/page/[page].astro` (hta218/leohuynh.dev).
- Astro docs: "Pagination" (`paginate()`).


> **Note from task 09:** the header search button dispatches `window.dispatchEvent(new CustomEvent("open-command-palette"))` (no detail). The palette loader must listen on `window` for that event, and any other "Search posts" button (task 13) must dispatch the same event on `window`.
