import type { AstroIntegration } from 'astro';

/**
 * Dev-only preview pages (`/dev/tokens`, `/dev/components`, `/dev/content`, `/dev/mdx`).
 *
 * The pages live in `src/dev-pages/` (outside `src/pages/`, which is always built) and the route
 * is injected only under `astro dev`, so they never reach `astro build`, the sitemap or Pagefind.
 */
export default function devPages(): AstroIntegration {
  return {
    name: 'karhdo:dev-pages',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({
          pattern: '/dev/[...page]',
          entrypoint: './src/dev-pages/[...page].astro',
          prerender: false,
        });
      },
    },
  };
}
