// @ts-check

import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkAlert } from 'remark-github-blockquote-alert';
import { loadEnv } from 'vite';
import { resolveBuildInfo } from './scripts/build-info.mjs';
import devPages from './src/integrations/dev-pages.ts';
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
const buildInfo = await resolveBuildInfo({ githubToken: GITHUB_API_TOKEN, network: process.argv.includes('build') });

export default defineConfig({
  site: 'https://karhdo.dev',
  trailingSlash: 'never',
  adapter: vercel(),
  // expressiveCode() must come before mdx() (it handles the fenced code blocks).
  integrations: [expressiveCode(), mdx(), react(), devPages()],
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
  },
});
