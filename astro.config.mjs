// @ts-check
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField } from 'astro/config';
import devPages from './src/integrations/dev-pages.ts';

/** Every variable is optional: the site must build and run with none of them set. */
const secret = () => envField.string({ context: 'server', access: 'secret', optional: true });
const serverPublic = () => envField.string({ context: 'server', access: 'public', optional: true });

export default defineConfig({
  site: 'https://karhdo.dev',
  trailingSlash: 'never',
  adapter: vercel(),
  integrations: [mdx(), react(), devPages()],
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
  },
});
