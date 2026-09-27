import { describe, expect, test } from 'bun:test';
import {
  isExternal,
  isFile,
  matchesQuery,
  normaliseResultUrl,
  serialisePaletteData,
  toPalettePost,
} from './palette-data';

describe('normaliseResultUrl', () => {
  test('strips the directory-format trailing slash', () => {
    expect(normaliseResultUrl('/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods/')).toBe(
      '/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods'
    );
  });
  test('keeps hash and query, strips before them', () => {
    expect(normaliseResultUrl('/blog/x/#locks')).toBe('/blog/x#locks');
    expect(normaliseResultUrl('/blog/x/?a=1#h')).toBe('/blog/x?a=1#h');
  });
  test('drops index.html and .html', () => {
    expect(normaliseResultUrl('/blog/x/index.html')).toBe('/blog/x');
    expect(normaliseResultUrl('/blog/x.html')).toBe('/blog/x');
    expect(normaliseResultUrl('/index.html')).toBe('/');
  });
  test('root and already-clean URLs are unchanged', () => {
    expect(normaliseResultUrl('/')).toBe('/');
    expect(normaliseResultUrl('/blog/x')).toBe('/blog/x');
    expect(normaliseResultUrl('')).toBe('/');
  });
});

describe('toPalettePost', () => {
  test('maps title, tags, excerpt and the clean URL', () => {
    expect(
      toPalettePost({
        url: '/blog/nestjs-module/',
        excerpt: 'a <mark>module</mark> is',
        meta: { title: ' Exploring module in NestJS ' },
        filters: { tag: ['nestjs', 'backend'] },
      })
    ).toEqual({
      url: '/blog/nestjs-module',
      title: 'Exploring module in NestJS',
      tags: ['nestjs', 'backend'],
      excerpt: 'a <mark>module</mark> is',
    });
  });
  test('falls back to the URL as title and empty tags/excerpt', () => {
    expect(toPalettePost({ url: '/blog/y/' })).toEqual({ url: '/blog/y', title: '/blog/y', tags: [], excerpt: '' });
  });
});

describe('matchesQuery', () => {
  const link = { title: 'Projects', href: '/projects', hint: '/projects', keywords: ['portfolio', 'work'] };
  test('empty query matches', () => expect(matchesQuery(link, '  ')).toBe(true));
  test('matches title, hint and keywords case-insensitively', () => {
    expect(matchesQuery(link, 'PROJ')).toBe(true);
    expect(matchesQuery(link, 'portfolio')).toBe(true);
  });
  test('every word must match', () => {
    expect(matchesQuery(link, 'proj work')).toBe(true);
    expect(matchesQuery(link, 'proj nestjs')).toBe(false);
  });
});

describe('link kinds', () => {
  test('isExternal', () => {
    expect(isExternal('https://github.com/Karhdo')).toBe(true);
    expect(isExternal('/blog')).toBe(false);
  });
  test('isFile', () => {
    expect(isFile('/feed.xml')).toBe(true);
    expect(isFile('/static/resume.pdf')).toBe(true);
    expect(isFile('/blog')).toBe(false);
  });
});

test('serialisePaletteData escapes < so the JSON cannot close its script tag', () => {
  const out = serialisePaletteData({ posts: [{ url: '/x', title: '</script><b>', tags: [] }], pages: [], social: [] });
  expect(out).not.toContain('<');
  expect(JSON.parse(out).posts[0].title).toBe('</script><b>');
});
