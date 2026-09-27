# 17 — Projects page and project cards (featured and browser-framed)

## Endpoint

None. GitHub repo data is added in task 20.

## Summary

Recreate `/projects` ("Work" and "Side projects" from `src/config/projects.ts`) using the mockup's project cards (the "Projects" CSS section). The same cards are reused by the homepage "Selected projects" block (task 15). There are two variants:

- **`featured`** (EcomHeat): full width, split into a text column and a browser-frame screenshot.
  - The text column has a kind badge (Work/Side) plus the org, an h3, a description, **three fact tiles**, built-with chips and a primary **"Visit product"** button (with the sheen from task 26).
  - At ≤ 900 px the screenshot moves below the text.
- **`framed`**: a browser-frame screenshot on top (three coloured dots plus a host label), then the body.
  - The body has a kind badge, the org or tagline, **★ stars** for repos, the title, description, chips and a "Source code →" / "Visit →" link.

On hover, the screenshot zooms slightly (`scale(1.05)`, 1.2 s `--ease-out`) and pans from top to bottom (`object-position` top → bottom, 3 s). This is motion-safe only. Cards carry `.reveal` (a scroll-driven reveal, task 06) and `data-card` / `data-tilt` (task 26).

Screenshots use `astro:assets` `<Image>` (AVIF/WebP negotiated, responsive widths, lazy loading, explicit dimensions) from `src/assets/projects/`. The grid is 2 columns and stacks to 1 column on mobile. `/projects` is rendered on demand (`prerender = false`) with CDN cache headers, so task 20 can add live GitHub stats without a rebuild. In this task it renders the static data only.

## Files to Create/Modify/Delete

- **Move** `public/static/images/projects/*.png` → `src/assets/projects/` (`git mv`; 5 files).
  - **Exception:** keep a copy of `karhdo-blog.png` at `public/static/images/projects/karhdo-blog.png`, because `SITE.socialBanner` still references that public URL as the OG fallback (task 25). Every other project image is imported from `src/assets/projects/`.
  - Where a screenshot is too small or outdated for the framed layout (the karhdo.dev one will show v1), leave a `TODO(screenshot)` in the config. Refreshing screenshots after launch is out of scope.
- **Modify** `src/config/projects.ts`: extend the `Project` type (the data stays v1-verbatim where it exists):
  ```ts
  type Fact = { value: string; label: string };
  export type Project = {
    type: 'work' | 'self';
    title: string;
    description?: string;
    builtWith: string[];
    image: ImageMetadata;
    imageAlt: string;
    frameLabel: string; // e.g. 'youneteci.com/eci-ecomheat'
    url?: string;
    repo?: string; // repo = 'owner/name'
    org?: string;
    tagline?: string;
    featured?: boolean;
    selected?: boolean;
    facts?: [Fact, Fact, Fact];
  };
  ```
  The entries:
  - **EcomHeat**: `featured: true`, `selected: true`, `org: 'YouNet Media'`, with the mockup description and facts `[{value:'Market share',label:'across marketplaces'},{value:'Competitor',label:'research tools'},{value:'Fullstack',label:'my role'}]`, `url: 'https://youneteci.com/en/eci-ecomheat/?ref=karhdo.dev'` and `frameLabel: 'youneteci.com/eci-ecomheat'`.
  - **karhdo.dev** (v1 "Personal website"): `selected: true`, `tagline: 'Open source'`, `repo: 'Karhdo/karhdo.dev'`, `builtWith: ['Astro','Bun','Tailwind','Drizzle']`.
  - **Simulate Basic Geometry**: `selected: true`, `tagline: '3D on the web'`, `repo: 'Karhdo/geometry-simulation'`.
  - The other two projects keep v1 data with images and frame labels.
    Images are imported statically (`import ecomheat from '~/assets/projects/ecom-heat.png'`).
- **Create** `src/components/projects/BrowserFrame.astro`: mockup `.frame` / `.frame-bar` / `.shot`. The bar has three dots coloured `var(--red)`, `var(--yellow)` and `var(--green)` (Tokyonight tokens, decorative, `aria-hidden`) and a mono host label. The shot is `<Image src={image} alt={imageAlt} widths={[480, 768, 1200]} sizes={featured ? '(max-width: 900px) 100vw, 560px' : '(max-width: 600px) 100vw, 50vw'} loading="lazy" decoding="async" class="object-cover object-top" />` inside a `.shot` that has a fixed `aspect-ratio: 16/10` (featured: `min-height: 300px`, 220 px ≤ 900 px), so there's no CLS. There's a bottom fade overlay (`::after`), and the hover zoom/pan is under `@media (prefers-reduced-motion: no-preference)`.
- **Create** `src/components/projects/ProjectCard.astro`: props `project`, `variant: 'featured' | 'framed'` and `stars?: number | null`. It renders the mockup markup:
  - a `.kind.work` / `.kind.side` badge;
  - `.facts` as a `<ul>` of 3 tiles (3 columns, 1 column ≤ 600 px), featured only;
  - `.chips` using `SimpleIcon` (task 08) when a slug matches, otherwise text;
  - `.proj-links`: featured gets `Button variant="primary"` "Visit product ↗"; framed gets `.link-arrow` "Source code →" (repo) or "Visit →" (url);
  - the stars pill `★ N` only when `stars` is a number.
    The whole card is an `<article>`, and the image isn't a separate link (avoiding duplicate tab stops).
- **Create** `src/components/projects/GithubRepoMeta.astro`: a placeholder that renders nothing until task 20 (stars, forks, languages, topics on `/projects`).
- **Create** `src/pages/projects.astro`: `export const prerender = false;` with `Astro.response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')`. It uses `SectionHeader` "Projects" with the v1 description ("My open-source side projects and stuff that I built with my colleagues at work"). "Work" renders EcomHeat as `featured` and the other work project as `framed`; "Side projects" is a `.proj-grid` of `framed` cards. It splits work/self in one pass (v1 logic).
- **Modify** `astro.config.mjs`: `adapter: vercel({ imageService: true, imagesConfig: { sizes: [320, 480, 640, 768, 960, 1200, 1280], formats: ['image/avif', 'image/webp'], domains: ['i.scdn.co', 'avatars.githubusercontent.com'] } })`. With this, `astro:assets` images on both prerendered and on-demand pages go through Vercel Image Optimization with AVIF/WebP negotiation, and `sharp` isn't bundled into functions.

## Implementation Steps

1. Port the content from `git show main:app/projects/page.tsx main:components/project/ProjectCard.tsx main:data/projectsData.ts`, and the markup and CSS from the mockup's "Projects" section.
2. `git mv` the images; re-add the `karhdo-blog.png` public copy; update the imports.
3. Implement `BrowserFrame` and `ProjectCard`, then the page.
4. Check at 375, 600, 900 and 1280 px, in both themes; hover the zoom/pan; check reduced motion.
5. Confirm on-demand rendering in `bun run preview` (or `bunx vercel dev`), and that the image URLs are `/_vercel/image?...` on Vercel (or `/_image` locally) with `w=` variants.

## Acceptance Criteria

- [ ] `bun run build` succeeds; `projects` is a function in `.vercel/output/functions/` (not a static HTML file).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes (the `Project` type with `ImageMetadata` imports).
- [ ] `/projects` shows 2 work projects (EcomHeat featured) and 3 side projects in framed cards with screenshots, chips and links.
- [ ] Featured card: kind badge, org, 3 fact tiles, chips and a "Visit product" button; the screenshot sits on the right at ≥ 900 px and below the text under that; the grid is 1 column at ≤ 600 px.
- [ ] Screenshots are served as AVIF/WebP at responsive widths, lazy-loaded, with explicit dimensions (no CLS); `alt` text is meaningful.
- [ ] Hover zooms and pans the screenshot only when motion is allowed.
- [ ] Response has `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- [ ] `public/static/images/projects/` contains only `karhdo-blog.png` (the OG fallback).

## Dependencies

- v2-astro-header-footer

## Patterns to Follow

- Mockup "Projects" CSS/markup (`.proj-grid`, `.proj.featured`, `.proj-body`, `.kind`, `.facts`, `.frame`, `.frame-bar`, `.shot`, `.proj-links`, `.link-arrow`).
- v1 `app/projects/page.tsx`, `components/project/ProjectCard.tsx`, `data/projectsData.ts`.
- Astro docs: "Images" (`<Image>` `widths`/`sizes`), `@astrojs/vercel` `imageService`/`imagesConfig`.
- Reference `src/components/builds/ProjectCard.astro` (hta218/leohuynh.dev).
