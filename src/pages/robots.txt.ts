import type { APIRoute } from 'astro';
import { SITE } from '~/config/site';

export const prerender = true;

/** v1 `app/robots.ts` content, pointing at the `@astrojs/sitemap` index. */
const ROBOTS = `User-agent: *
Allow: /

Host: ${SITE.siteUrl}
Sitemap: ${SITE.siteUrl}/sitemap-index.xml
`;

export const GET: APIRoute = () => new Response(ROBOTS, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
