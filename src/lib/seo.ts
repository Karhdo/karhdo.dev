/**
 * SEO helpers, ported from v1 `lib/seo.ts`, `app/layout.tsx` metadata and the contentlayer
 * `structuredData` field. Pure (type-only imports), so `bun test` can load it.
 */
import { SITE } from '~/config/site';
import type { Author, Post } from '~/lib/content';

/** An absolute URL on the site. Absolute `http(s)` inputs are returned unchanged. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const url = new URL(path, SITE.siteUrl).href;
  // trailingSlash: 'never' — the home page is `https://karhdo.dev`, not `https://karhdo.dev/`.
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/** v1 title template: `%s | ${SITE.title}`, defaulting to `SITE.title`. */
export function pageTitle(title?: string): string {
  return title ? `${title} | ${SITE.title}` : SITE.title;
}

type JsonLd = Record<string, unknown>;

type PostLike = Pick<Post, 'id'> & {
  data: Pick<Post['data'], 'title' | 'date' | 'lastmod' | 'summary' | 'images'>;
};
type AuthorLike = { data: Pick<Author['data'], 'name'> };

/** First frontmatter image (string or list), else the site banner. */
export function postImage(images: Post['data']['images']): string {
  const first = typeof images === 'string' ? images : images?.[0];
  return first ?? SITE.socialBanner;
}

/** schema.org `BlogPosting` for a post (v1 `structuredData` + the page's `author` list). */
export function buildBlogPostingJsonLd(post: PostLike, author?: AuthorLike | AuthorLike[]): JsonLd {
  const authors = (Array.isArray(author) ? author : author ? [author] : []).map((a) => a.data.name);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    datePublished: post.data.date.toISOString(),
    dateModified: (post.data.lastmod ?? post.data.date).toISOString(),
    description: post.data.summary,
    image: absoluteUrl(postImage(post.data.images)),
    url: absoluteUrl(`/blog/${post.id}`),
    author: (authors.length > 0 ? authors : [SITE.author]).map((name) => ({ '@type': 'Person', name })),
  };
}

/** schema.org `WebSite` for the home page and any page without its own JSON-LD. */
export function buildWebsiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.title,
    alternateName: SITE.headerTitle,
    url: SITE.siteUrl,
    description: SITE.description,
    inLanguage: 'en',
    author: { '@type': 'Person', name: SITE.fullName, url: SITE.siteUrl },
  };
}

/** JSON for a `<script type="application/ld+json">`: `<` escaped so content can't close the tag. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
