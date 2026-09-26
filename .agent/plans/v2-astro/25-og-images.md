# 25 — Per-post OG images with Satori

## Endpoint

Static (prerendered): `GET /og/{slug}.png` for every published post, `GET /og/default.png` for other pages.

## Summary

Generate 1200×630 Open Graph images at build time with Satori (JSX-like object tree → SVG) and `@resvg/resvg-js` (SVG → PNG): background from the Tokyonight Night palette via `src/styles/palette.ts` (task 06's TS mirror, since Satori can't read CSS variables): `bg`, `glowA`/`glowB` radial gradients, a title in `fg`, and accents `blue`/`purple`. No other colour literals, tilted-grid texture, post title, date, reading time, tags, avatar and `karhdo.dev`. Wire them into `Seo.astro` and JSON-LD.

## Files to Create/Modify/Delete

- **Modify** `package.json` — add `satori@^0.33.5`, `@resvg/resvg-js@^2.6.2`, `@fontsource/outfit@^5.3.0` (static weights as `.woff` — Satori does not read woff2).
- **Create** `src/lib/og.ts` — `renderOgImage({ title, subtitle?, date?, tags?, readingTime? }): Promise<Uint8Array>`: loads fonts once (`fs.readFile` of `node_modules/@fontsource/outfit/files/outfit-latin-{400,700}-normal.woff`), avatar as base64 data URI from `public/static/images/avatar.jpg`, builds the element tree with plain objects (`{ type: 'div', props: { style, children } }`, no React runtime needed), `satori(tree, { width: 1200, height: 630, fonts })`, `new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()`. Title auto-sizes (64 px → 48 px when > 60 chars).
- **Create** `src/pages/og/[...slug].png.ts` — `export const prerender = true;` `getStaticPaths()` over `getPublishedPosts()` + `{ params: { slug: 'default' } }`; `GET` returns `new Response(png, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' } })`.
- **Modify** `src/components/seo/Seo.astro` / `src/pages/blog/[...slug].astro` — `image = post.data.images?.[0] ?? `/og/${post.id}.png``; other pages default to `/og/default.png`(replacing`SITE.socialBanner`, which remains as fallback when rendering fails); add `og:image:width=1200`, `og:image:height=630`, `og:image:alt`.
- **Modify** `src/lib/seo.ts` — JSON-LD `image` uses the same URL.
- **Modify** `astro.config.mjs` (**shared-file rule, m2**: tasks 23, 24 and 25 all edit this file in p5, so they are **merged one at a time**. Rebase on the latest `v2` before merging and re-run `bun run build`. Each adds only its own integration/option and never reorders existing ones; `expressiveCode()` stays before `mdx()`, and `pagefind()` stays last.) — `vite.ssr.external: ['@resvg/resvg-js']` (native binary; keep it out of the Vite bundle) and ensure the route is prerendered so the native module is never traced into a Vercel function.

## Implementation Steps

1. Prototype `renderOgImage` in a scratch Bun script writing `og-test.png`; iterate on layout.
2. Add the route; `bun run build`; open `.vercel/output/static/og/*.png`.
3. Check `.vercel/output/functions/**` does not include `@resvg` (`grep -r resvg .vercel/output/functions` → nothing).
4. After deploy (task 28), validate with opengraph.xyz / LinkedIn Post Inspector / X card validator.

## Acceptance Criteria

- [ ] `bun run build` succeeds and outputs 4 PNGs (3 posts + default), each 1200×630 and < 300 kB.
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] Post pages' `og:image` and `twitter:image` are absolute URLs to `/og/{slug}.png`.
- [ ] Long titles do not overflow (test with a temporary 120-char title).
- [ ] `@resvg/resvg-js` is absent from all Vercel function bundles.

## Dependencies

- v2-astro-content-collections
- v2-astro-base-layout
- v2-astro-blog-post-page

## Patterns to Follow

- v1 `app/blog/[...slug]/page.tsx` `generateMetadata` (image fallback rules), `data/siteMetadata.js` `socialBanner`.
- Satori README (object tree without React, font requirements); Astro docs "Endpoints → static file endpoints".
