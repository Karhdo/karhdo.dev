import { describe, expect, test } from 'bun:test';
import { parseThemeBlocks } from './theme-css';

const css = await Bun.file(new URL('./theme.css', import.meta.url)).text();
const { light, darkMedia, dark } = parseThemeBlocks(css);

describe('theme.css', () => {
  test('the OS-dark fallback block is identical to [data-theme="dark"]', () => {
    expect([...darkMedia.entries()]).toEqual([...dark.entries()]);
  });

  test('light and dark define the same tokens (dark omits only the radius)', () => {
    const lightNames = [...light.keys()].filter((name) => name !== '--r');
    expect([...dark.keys()]).toEqual(lightNames);
  });

  test('light is Tokyonight Day and dark is Tokyonight Night', () => {
    expect(light.get('color-scheme')).toBe('light');
    expect(dark.get('color-scheme')).toBe('dark');
    expect(light.get('--bg')).toBe('#e1e2e7');
    expect(dark.get('--bg')).toBe('#16161e');
  });

  test('--spotify is Tokyonight green, and there is no --magenta or coral', () => {
    for (const block of [light, darkMedia, dark]) {
      expect(block.get('--spotify')).toBe('var(--green)');
      expect(block.has('--magenta')).toBe(false);
    }
    expect(css).not.toMatch(/-(magenta|coral)\b/);
  });

  test('--yellow, --blue1 and --shine exist in all three blocks', () => {
    for (const block of [light, darkMedia, dark]) {
      for (const name of ['--yellow', '--blue1', '--shine']) expect(block.has(name)).toBe(true);
    }
  });
});
