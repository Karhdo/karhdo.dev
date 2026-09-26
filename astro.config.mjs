// @ts-check

import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkAlert } from 'remark-github-blockquote-alert';
import { loadEnv } from 'vite';
import { resolveBuildInfo } from './scripts/build-info.mjs';
import devPages from './src/integrations/dev-pages.ts';
import { blogLastmod } from './src/lib/sitemap-lastmod.mjs';
import { linkIconHast } from './src/plugins/heading-link-icon.mjs';
import remarkCodeTitles from './src/plugins/remark-code-titles.mjs';

/** Every variable is optional: the site must build and run with none of them set. */
const secret = () => envField.string({ context: 'server', access: 'secret', optional: true });
const serverPublic = () => envField.string({ context: 'server', access: 'public', optional: true });

/**
 * Footer statusline facts (task 09), resolved once here and baked in via `define`; never at runtime.
 * Only `astro build` calls GitHub (stars, commit-date fallback); dev and check are git-only.
 */
const { GITHUB_API_TOKEN } = loadEnv(
  process.env.NODE_ENV === 'production' ? 'production' : 'development',
  process.cwd(),
  ''
);
/** Post URL → frontmatter `lastmod ?? date` for the sitemap (v1 values). */
const postLastmod = blogLastmod();

const buildInfo = await resolveBuildInfo({ githubToken: GITHUB_API_TOKEN, network: process.argv.includes('build') });

export default defineConfig({
  site: 'https://karhdo.dev',
  trailingSlash: 'never',
  adapter: vercel({
    // Vercel image optimisation: AVIF/WebP negotiation and resizing for astro:assets and remote avatars/covers.
    imageService: true,
    imagesConfig: {
      // 64–256 serve the small avatars and logos (32–160 px at 1x/2x) without a 320 px download.
      sizes: [64, 96, 128, 160, 256, 320, 480, 640, 768, 960, 1200, 1280],
      formats: ['image/avif', 'image/webp'],
      domains: ['i.scdn.co', 'avatars.githubusercontent.com'],
    },
  }),
  // expressiveCode() must come before mdx() (it handles the fenced code blocks).
  integrations: [
    expressiveCode(),
    mdx(),
    react(),
    devPages(),
    // Task 24. `/projects` is on-demand (task 17), so it is listed explicitly (v1 sitemap had it).
    sitemap({
      // Dev pages are never built (task 06; defensive). `/newsletter` is the on-demand, noindex no-JS form result.
      filter: (page) => !page.includes('/dev/') && new URL(page).pathname !== '/newsletter',
      customPages: ['https://karhdo.dev/projects'],
      serialize(item) {
        const lastmod = postLastmod[new URL(item.url).pathname];
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    // Task 23: indexes the built pages (only `<article data-pagefind-body>`) into `<client>/pagefind/`. Keep last.
    pagefind(),
  ],
  // Explicit unified processor (Astro 7 defaults to Sätteri): rehypeHeadingIds runs before
  // autolink so every heading has an id. @astrojs/mdx inherits this processor.
  markdown: {
    processor: unified({
      remarkPlugins: [remarkCodeTitles, remarkAlert],
      rehypePlugins: [
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          { behavior: 'prepend', headingProperties: { className: ['content-header'] }, content: linkIconHast },
        ],
      ],
    }),
  },
  env: {
    schema: {
      // Server secrets
      POSTGRES_URL: envField.string({ context: 'server', access: 'secret', optional: true, url: true }),
      GITHUB_API_TOKEN: secret(),
      SPOTIFY_CLIENT_ID: secret(),
      SPOTIFY_CLIENT_SECRET: secret(),
      SPOTIFY_REFRESH_TOKEN: secret(),
      BUTTONDOWN_API_KEY: secret(),
      ANTHROPIC_ADMIN_API_KEY: secret(),
      // Public values, read only on the server (v1 names kept, no renames)
      NEXT_PUBLIC_GISCUS_REPO: serverPublic(),
      NEXT_PUBLIC_GISCUS_REPOSITORY_ID: serverPublic(),
      NEXT_PUBLIC_GISCUS_CATEGORY: serverPublic(),
      NEXT_PUBLIC_GISCUS_CATEGORY_ID: serverPublic(),
      UMAMI_WEBSITE_ID: serverPublic(),
    },
    validateSecrets: false,
  },
  vite: {
    plugins: [tailwindcss()],
    define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
    // Task 25: native binary, loaded from node_modules by the prerendered OG route, never bundled.
    ssr: { external: ['@resvg/resvg-js'] },
    // Task 23: pre-bundle cmdk so the first palette open in dev does not race Vite's re-optimisation.
    optimizeDeps: { include: ['cmdk'] },
    build: {
      // Task 26: never inline component <script> chunks. After a ClientRouter navigation to a page
      // whose last module script is inline, Astro appends `<script src="data:application/javascript,">`,
      // which the CSP (no `data:` in script-src) blocks; inline modules also re-run on every swap.
      // Bundled `/_astro/*.js` modules run once and are cached. Other assets keep Vite's 4 kB default.
      assetsInlineLimit: (filePath) => (filePath.endsWith('.js') ? false : undefined),
    },
  },
});
