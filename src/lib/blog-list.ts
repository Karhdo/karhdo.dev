import type { TagCount } from './tags';

/** URL of a blog-list page: page 1 lives at `/blog` (`/blog/page/1` is a vercel.json redirect). */
export function blogPageHref(page: number, base = '/blog'): string {
  return page <= 1 ? base : `${base}/page/${page}`;
}

export type PaginationLinks = { prev?: string; next?: string };

/** Previous/next hrefs of a list page (v1 `Pagination`); undefined at either end. */
export function paginationLinks(current: number, total: number, base = '/blog'): PaginationLinks {
  return {
    prev: current > 1 ? blogPageHref(current - 1, base) : undefined,
    next: current < total ? blogPageHref(current + 1, base) : undefined,
  };
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

export type TagChip = TagCount & { slug: string };

/** Tag chips sorted by post count desc, then slug asc (stable across builds). */
export function sortTagChips(counts: Record<string, TagCount>): TagChip[] {
  return Object.entries(counts)
    .map(([slug, tag]) => ({ slug, ...tag }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

/** `YYYY-MM-DD` of a frontmatter date (dates are parsed as UTC midnight). */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Whole minutes for the row's `8 min` label (at least 1). */
export function readingMinutes(minutes: number): number {
  return Math.max(1, Math.ceil(minutes));
}
