import { describe, expect, test } from 'bun:test';
import { NOT_PLAYING, NOW_PLAYING_CACHE_HEADERS } from './now-playing';

describe('NOW_PLAYING_CACHE_HEADERS', () => {
  test('browsers always revalidate; only the Vercel CDN caches (30 s + 30 s SWR)', () => {
    expect(NOW_PLAYING_CACHE_HEADERS).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=30, stale-while-revalidate=30',
    });
    expect(NOW_PLAYING_CACHE_HEADERS['Cache-Control']).not.toMatch(/s-maxage|stale-while-revalidate/);
  });
});

test('NOT_PLAYING is frozen', () => {
  expect(NOT_PLAYING).toEqual({ isPlaying: false });
  expect(Object.isFrozen(NOT_PLAYING)).toBe(true);
});
