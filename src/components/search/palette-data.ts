/**
 * Pure data helpers for the ⌘K palette (task 23): shared by the Astro loader (server) and the
 * lazily imported React palette (client). No DOM, no React: unit-tested in `palette-data.test.ts`.
 */

/** A post row: the latest posts (empty query) and Pagefind hits share this shape. */
export type PalettePost = { url: string; title: string; tags: string[]; excerpt?: string };

/** A static command: a page, a social profile or a file (RSS, résumé). */
export type PaletteLink = { title: string; href: string; hint: string; keywords?: string[] };

/** Everything the loader serialises into `#cmdk-data`. */
export type PaletteData = { posts: PalettePost[]; pages: PaletteLink[]; social: PaletteLink[] };

/** Subset of a Pagefind `result.data()` payload the palette reads. */
export type PagefindFragment = {
  url: string;
  excerpt?: string;
  meta?: Record<string, string | undefined>;
  filters?: Record<string, string[] | undefined>;
};

/** Most Pagefind hits shown for a query. */
export const MAX_RESULTS = 8;

/**
 * Pagefind indexes the directory build (`/blog/x/index.html`) and returns `/blog/x/`, while the site
 * uses `trailingSlash: 'never'`: strip the slash (and a stray `index.html`/`.html`) so result links do
 * not 308. Keeps `?query` and `#hash`; the root stays `/`.
 */
export function normaliseResultUrl(url: string): string {
  const match = /^([^?#]*)(.*)$/.exec(url);
  let path = match?.[1] ?? url;
  const rest = match?.[2] ?? '';
  path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return (path || '/') + rest;
}

/** Maps a Pagefind fragment to a palette row: title from `meta.title`, tags from the `tag` filter. */
export function toPalettePost(fragment: PagefindFragment): PalettePost {
  const url = normaliseResultUrl(fragment.url);
  return {
    url,
    title: fragment.meta?.title?.trim() || url,
    tags: fragment.filters?.tag ?? [],
    excerpt: fragment.excerpt ?? '',
  };
}

/** Case-insensitive match of every query word against a link's title, hint and keywords. */
export function matchesQuery(link: PaletteLink, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [link.title, link.hint, ...(link.keywords ?? [])].join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** True for URLs that leave the site (opened in a new tab). */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Same-origin non-HTML files (RSS, PDF) need a full load instead of a view-transition navigation. */
export function isFile(href: string): boolean {
  return /\.(xml|pdf|txt|json)$/i.test(href.split(/[?#]/)[0] ?? '');
}

/** Serialises data for `<script type="application/json">`: escapes `<` so `</script>` cannot close it. */
export function serialisePaletteData(data: PaletteData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
