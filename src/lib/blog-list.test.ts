import { describe, expect, test } from 'bun:test';
import { blogPageHref, isoDate, paginationLinks, readingMinutes, sortTagChips, totalPages } from './blog-list';

describe('blogPageHref', () => {
  test('page 1 is the base path, never /page/1', () => {
    expect(blogPageHref(1)).toBe('/blog');
    expect(blogPageHref(0)).toBe('/blog');
  });
  test('later pages use /page/N', () => {
    expect(blogPageHref(2)).toBe('/blog/page/2');
    expect(blogPageHref(3, '/tags/nestjs')).toBe('/tags/nestjs/page/3');
  });
});

describe('paginationLinks', () => {
  test('single page has no links', () => {
    expect(paginationLinks(1, 1)).toEqual({ prev: undefined, next: undefined });
  });
  test('first of three', () => {
    expect(paginationLinks(1, 3)).toEqual({ prev: undefined, next: '/blog/page/2' });
  });
  test('previous from page 2 goes to /blog', () => {
    expect(paginationLinks(2, 3)).toEqual({ prev: '/blog', next: '/blog/page/3' });
  });
  test('last page has no next', () => {
    expect(paginationLinks(3, 3)).toEqual({ prev: '/blog/page/2', next: undefined });
  });
});

test('totalPages', () => {
  expect(totalPages(0, 5)).toBe(1);
  expect(totalPages(3, 5)).toBe(1);
  expect(totalPages(3, 1)).toBe(3);
  expect(totalPages(11, 5)).toBe(3);
});

test('sortTagChips sorts by count desc then slug asc', () => {
  const chips = sortTagChips({
    nestjs: { label: 'nestjs', count: 1 },
    'design-patterns': { label: 'design patterns', count: 2 },
    database: { label: 'database', count: 1 },
  });
  expect(chips.map((c) => c.slug)).toEqual(['design-patterns', 'database', 'nestjs']);
  expect(chips[0]).toEqual({ slug: 'design-patterns', label: 'design patterns', count: 2 });
});

test('isoDate is the UTC calendar day', () => {
  expect(isoDate(new Date('2025-03-19'))).toBe('2025-03-19');
});

test('readingMinutes rounds up with a floor of 1', () => {
  expect(readingMinutes(0.2)).toBe(1);
  expect(readingMinutes(7.1)).toBe(8);
});
