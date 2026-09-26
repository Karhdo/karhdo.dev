import type { APIRoute, GetStaticPaths } from 'astro';
import { GISCUS_THEME_FILES, GISCUS_THEME_MODES, giscusThemeCss } from '~/lib/giscus-theme';

export const prerender = true;

/** `/static/giscus/tokyonight-day.css` and `/static/giscus/tokyonight-night.css` (task 21). */
export const getStaticPaths = (() =>
  Object.values(GISCUS_THEME_FILES).map((theme) => ({ params: { theme } }))) satisfies GetStaticPaths;

/**
 * Giscus loads the theme inside its giscus.app iframe with `crossorigin`, so the file must be
 * CORS-readable. This route is prerendered, so response headers set here are dropped at build:
 * production relies on Vercel's default `Access-Control-Allow-Origin: *` for static files plus the
 * `/static/giscus/*` rule in `vercel.json`. `astro dev` doesn't use these files (Comments.tsx falls
 * back to the built-in Giscus themes in dev).
 */
export const GET: APIRoute = ({ params }) => {
  const mode = GISCUS_THEME_MODES[params.theme ?? ''];
  if (!mode) return new Response(null, { status: 404 });
  return new Response(giscusThemeCss(mode), {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
};
