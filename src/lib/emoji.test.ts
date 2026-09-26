import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync } from 'node:fs';
import { EMOJI_CODEPOINTS, emojiCodepoint, emojiLabel } from './emoji';

const TWEMOJI_DIR = new URL('../../public/static/twemoji/', import.meta.url).pathname;

describe('emojiCodepoint', () => {
  test('maps a name to its codepoint', () => {
    expect(emojiCodepoint('clinking-beer-mugs')).toBe('1f37b');
    expect(emojiCodepoint('man-technologist')).toBe('1f468-200d-1f4bb');
  });

  test('both Vietnam flag aliases map to the same codepoint', () => {
    expect(emojiCodepoint('flag-vietnam')).toBe('1f1fb-1f1f3');
    expect(emojiCodepoint('viet-nam-vietnam-flag')).toBe('1f1fb-1f1f3');
  });

  test('unknown names (and Object.prototype keys) return undefined', () => {
    expect(emojiCodepoint('not-an-emoji')).toBeUndefined();
    expect(emojiCodepoint('toString')).toBeUndefined();
  });
});

test('emojiLabel turns the name into words', () => {
  expect(emojiLabel('waving-hand')).toBe('waving hand');
});

describe('vendored SVGs', () => {
  test('every mapped codepoint has a file in public/static/twemoji', () => {
    const missing = Object.values(EMOJI_CODEPOINTS).filter((cp) => !existsSync(`${TWEMOJI_DIR}${cp}.svg`));
    expect(missing).toEqual([]);
  });

  test('no unused SVG is vendored', () => {
    const used = new Set<string>(Object.values(EMOJI_CODEPOINTS));
    const unused = readdirSync(TWEMOJI_DIR).filter((file) => !used.has(file.replace(/\.svg$/, '')));
    expect(unused).toEqual([]);
  });
});
