# 12 — Blog post page with sticky TOC and reading progress

## Endpoint

None (views/reactions/comments/newsletter islands are mounted by tasks 18, 21, 22).

## Summary

Render `/blog/[slug]` for every published post at build time with the new `PostLayout`: header (mockup `.post-head`: "← All posts" crumb, title, byline with avatar · author · date · reading time · views placeholder), prose content (including callouts from task 11), reactions slot **at the end of the article** (mockup `.reactions`, before comments), a sticky "On this page" aside (mockup `.toc`: TOC with scrollspy + a stat row with the post's **tags** and **updated** date = `lastmod ?? date`, ISO format) on desktop and a collapsible TOC on mobile, reading progress bar, prev/next navigation, scroll-to-top/comments button, JSON-LD `BlogPosting`, and Pagefind markers. URL must equal v1 (`/blog/{id}`).

## Files to Create/Modify/Delete

- **Create** `src/pages/blog/[...slug].astro` — `getStaticPaths()` from `getPublishedPosts()` → `params: { slug: post.id }`; renders `const { Content, headings } = await render(post)`; passes `neighbours`, `readingTime`, `author` to `PostLayout`; `<Content components={mdxComponents} />`.
- **Create** `src/layouts/PostLayout.astro` — grid `lg:grid-cols-12` (content `lg:col-span-8 xl:col-span-9`, aside `lg:col-span-4 xl:col-span-3` sticky `top-24` — v1 layout); `<article data-pagefind-body>` wraps title + content only; `data-pagefind-meta` for date; `data-pagefind-filter="tag"` per tag; named slots `stats` (header byline), `reactions` (end of article, after the prose and before `PostNav`), `newsletter`, `comments` for later tasks. The aside holds only `TableOfContents` + `TocMeta`; reactions are **not** in the sidebar (mockup m7). `frontmatter.layout` values (`PostSimple`, `PostBanner`) fall back to this layout (no post uses them — documented).
- **Create the post-page stub components (m2)**, rendered by `PostLayout.astro` / `PostHeader.astro` **once, here**. Tasks 18, 21 and 22 each fill **only their own stub file** and never edit `PostLayout.astro` or `PostHeader.astro`, so they can run in parallel:
  - `src/components/blog/PostViewCount.astro`: renders `—— views` in the byline; filled by 18.
  - `src/components/blog/PostReactions.astro`: a fixed-height placeholder at the end of the article, before `PostNav`; filled by 18.
  - `src/components/blog/PostNewsletter.astro`: after `PostNav`, renders nothing; filled by 22.
  - `src/components/blog/PostComments.astro`: `<section id="comments">`, empty; filled by 21.
    Each stub carries a `<!-- filled by task NN -->` marker and a `data-pagefind-ignore` wrapper. The **Pagefind markup** for this layout is also final here, so task 23 doesn't touch `PostLayout.astro`: `data-pagefind-body` on the article only, `data-pagefind-meta="title"` on the h1, `data-pagefind-meta="date"`, `data-pagefind-filter="tag"`, and `data-pagefind-ignore` on the TOC aside and the stubs. The header's ⌘K trigger already comes from task 09.
- **Create** `src/components/blog/PostHeader.astro` — `PageTitle` with `transition:name={`post-title-${id}`}`, tags, `<time datetime>` formatted date, reading time (`x min read`), `<slot name="stats" />`.
- **Create** `src/components/blog/TableOfContents.astro` — from `headings.filter(h => h.depth <= 3)`; script uses `IntersectionObserver` to set `aria-current="true"` on the active item; smooth scroll only when motion allowed; mobile variant inside `<details>`.
- **Motion (item 5).** Add to `src/styles/prose.css`, under `@media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) { … } }`: `.prose h2, .prose .expressive-code, .prose .callout, .prose .markdown-alert { animation: revealIn linear both; animation-timeline: view(); animation-range: entry 0% entry 50%; }`. This is a scroll-driven reveal with no JS. The content is static and fully visible in browsers without support, and `revealIn` starts at `opacity: .35`, never 0.
- **Create** `src/components/blog/TocMeta.astro` — mockup `.toc .stat`: `tags · <Tag…>` and `updated · YYYY-MM-DD` (from `lastmod ?? date`).
- **Create** `src/components/blog/ReadingProgress.astro` — fixed top bar (`scale-x` transform driven by `scroll` + `requestAnimationFrame` on the article element), `role="progressbar"` with `aria-valuenow`; still shown under reduced motion, but without transition easing.
- **Create** `src/components/blog/PostNav.astro` — prev/next cards (v1 `BlogNav.tsx`), plus "Back to the blog" link.
- **Create** `src/components/blog/ScrollTopAndComment.astro` — floating buttons (v1 `ScrollTopAndComment.tsx`): scroll to top, scroll to `#comments`; appear after 50 % scroll.
- **Modify** `src/lib/seo.ts` — `buildBlogPostingJsonLd` uses `post.data.images?.[0] ?? `/og/${post.id}.png``(OG route arrives in task 25; until then fall back to`SITE.socialBanner`).
- Page `<BaseLayout>` props: `type: 'article'`, `publishedTime`, `modifiedTime` (lastmod ?? date), `tags`, `image`, `jsonLd`, canonical = `canonicalUrl ?? /blog/{id}`.

## Implementation Steps

1. Port structure from `git show main:layouts/PostLayout.tsx` and `main:components/blog/{BlogMeta,BlogTags,BlogNav,TableOfContents}.tsx`.
2. Implement page + layout; verify three posts build.
3. Implement TOC scrollspy and progress bar scripts (re-init on `astro:page-load`, remove listeners on `astro:before-swap`).
4. Keep the dev-only `/dev/mdx` page from task 11 (it is never built); confirm the real post page renders the same as `/dev/mdx?post=<id>`.
5. Check `https://karhdo.dev/blog/<id>` canonical and JSON-LD with Google's Rich Results test (task 28 on preview URL).

## Acceptance Criteria

- [ ] `bun run build` succeeds and outputs `blog/exploring-module-in-nestjs/index.html`, `blog/how-to-prevent-overbooking-in-sql-with-multiple-methods/index.html`, `blog/problems-when-the-application-develops/index.html` under `.vercel/output/static/` (`@astrojs/vercel` forces `build.format: 'directory'`; with `trailingSlash: 'never'` they are served at `/blog/<slug>`).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/blog/exploring-module-in-nestjs` renders all headings, 11 code frames, 3 images; TOC highlights the section in view while scrolling.
- [ ] The aside shows the TOC plus `tags · …` and `updated · YYYY-MM-DD`; the reactions slot sits at the end of the article (not in the aside).
- [ ] GitHub-alert and `<Callout>` blocks (via `/dev/mdx` fixture parity) render inside `.prose` with the post styles.
- [ ] In Chrome, h2s, code frames and callouts ease in as they scroll into view; in Firefox/Safari without `view()` support, and with reduced motion, they are simply static; no layout shift (transform/opacity only).
- [ ] The four stub components exist and render at their final positions; Pagefind attributes are in place; tasks 18/21/22/23 need no edits to `PostLayout.astro` or `PostHeader.astro`.
- [ ] Reading progress bar reaches 100 % at the end of the article.
- [ ] Prev/next links match v1 ordering (newest ↔ oldest by date).
- [ ] Page source contains a `BlogPosting` JSON-LD with headline, datePublished, dateModified, author `Do Trong Khanh`, url `https://karhdo.dev/blog/{id}`.
- [ ] Only the article body is inside `data-pagefind-body`.

## Dependencies

- v2-astro-header-footer
- v2-astro-mdx-pipeline

## Patterns to Follow

- v1 `app/blog/[...slug]/page.tsx`, `layouts/PostLayout.tsx`, `components/blog/*`, `components/ui/ScrollTopAndComment.tsx`.
- Reference `src/pages/blog/[...slug].astro` (hta218/leohuynh.dev).
