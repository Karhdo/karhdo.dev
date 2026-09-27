# 16 — About page and 404 page

> **Post-plan (2026-09-27):** /about now opens with the `whoami` hero and no longer has the career timeline, which moved to the new /career page. See 00-overview → Post-plan changes.

## Endpoint

None.

## Summary

Recreate `/about` from the `default` author MDX plus the profile sidebar and the career timeline, and a styled 404 page. Both prerendered.

## Files to Create/Modify/Delete

- **Create** `src/pages/about.astro` — `getAuthor('default')`, `render()` its MDX with `mdxComponents`; layout: `SectionHeader` "About" / "Further insights into who I am and the purpose of this blog." (v1), left profile card (avatar, name, occupation, company, email/GitHub/LinkedIn/Twitter icons, "Resume" button → `/static/resume.pdf`), right prose content, then "Career" timeline.
- **Create** `src/config/experiences.ts` — `EXPERIENCES` array ported verbatim from v1 `components/about/CareerTimeline.tsx` (org, url, logo, start, end, title, icon, event); the JSX `details` bodies become HTML strings or small Astro partials in `src/components/about/experiences/*.astro` (one per org) to keep rich markup.
- **Create** `src/components/about/CareerTimeline.astro`, `TimelineItem.astro` — vertical timeline with org logo (`/static/images/experiences/*`), dates, Twemoji icon, expandable details via `<details>` (v1 used a toggle button).
- **Create** `src/pages/404.astro` — v1 copy ("Sorry we couldn't find this page." / "But dont worry…" — fix typo to "don't"), big "404", "Back to homepage" button, plus a list of the 3 latest posts and a "Search ⌘K" button.
- **Modify** `src/content/authors/default.mdx` — update the "Tech stack" section text from Next.js to Astro (content change requested implicitly by the rebuild; keep the rest verbatim). Twemoji usages keep working via `mdxComponents`; fix `className="mr-2!"` usages to still apply (Twemoji accepts `className`).

## Implementation Steps

1. Port from `git show main:app/about/page.tsx main:layouts/AuthorLayout.tsx main:components/about/*.tsx main:app/not-found.tsx`.
2. Verify Astro serves `404.html` for unknown routes in `bun run preview` and on Vercel (task 28).

## Acceptance Criteria

- [ ] `bun run build` succeeds, outputs `about/index.html` and `404.html` under `.vercel/output/static/` (directory format forced by `@astrojs/vercel`; Astro always emits the error page as `404.html`).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `/about` renders the author MDX (all Twemoji visible), the profile card and 4 career entries with logos.
- [ ] `/this-does-not-exist` returns HTTP 404 with the custom page in `bun run preview`.
- [ ] `/static/resume.pdf` link works.

## Dependencies

- v2-astro-header-footer
- v2-astro-mdx-pipeline

## Patterns to Follow

- v1 `layouts/AuthorLayout.tsx`, `components/about/CareerTimeline.tsx`, `components/about/TimelineItem.tsx`, `app/not-found.tsx`.
