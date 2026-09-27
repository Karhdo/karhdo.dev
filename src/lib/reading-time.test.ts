import { describe, expect, test } from 'bun:test';
import { getReadingTime } from './reading-time';

describe('getReadingTime', () => {
  test('400 words → 2 min read', () => {
    const result = getReadingTime(Array.from({ length: 400 }, () => 'word').join(' '));
    expect(result).toEqual({ text: '2 min read', minutes: 2, words: 400 });
  });

  test('empty body → 0 min read', () => {
    expect(getReadingTime('')).toEqual({ text: '0 min read', minutes: 0, words: 0 });
  });
});
