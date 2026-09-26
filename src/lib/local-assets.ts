/**
 * Maps a public `/static/images/**` path (author `avatar` frontmatter, `EXPERIENCES[].logo`) to the
 * same file under `src/assets/`, so it can go through `astro:assets` (resized, AVIF/WebP) instead of
 * shipping the full-size original. The `public/` copies stay for v1 URL parity. Vite-only
 * (`import.meta.glob`): import it from `.astro` files, never from `bun test` modules.
 */
import type { ImageMetadata } from 'astro';

const modules = import.meta.glob<{ default: ImageMetadata }>(
  ['/src/assets/images/*.{jpg,jpeg,png}', '/src/assets/experiences/*.{jpg,jpeg,png}'],
  { eager: true }
);

const byName = new Map(Object.entries(modules).map(([path, mod]) => [path.split('/').pop() ?? path, mod.default]));

/** The `src/assets` twin of a `/static/images/...` path, or `undefined` (render the plain URL then). */
export function localAsset(publicPath: string | undefined): ImageMetadata | undefined {
  if (!publicPath?.startsWith('/static/images/')) return undefined;
  return byName.get(publicPath.split('/').pop() ?? '');
}
