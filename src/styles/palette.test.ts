import { describe, expect, test } from 'bun:test';
import { palette, spotify, themeColor, tokenNames } from './palette';
import { parseThemeBlocks } from './theme-css';

const css = await Bun.file(new URL('./theme.css', import.meta.url)).text();
const { light, dark } = parseThemeBlocks(css);

type Rule = { scope: string[]; settings: { foreground?: string } };
const ecDay = (await Bun.file(new URL('./ec-tokyonight-day.json', import.meta.url)).json()) as {
  type: string;
  colors: Record<string, string>;
  tokenColors: Rule[];
};

const keys = Object.keys(tokenNames) as (keyof typeof tokenNames)[];

describe('palette.ts mirrors theme.css', () => {
  test('covers exactly the same keys in both themes', () => {
    expect(Object.keys(palette.day).sort()).toEqual([...keys].sort());
    expect(Object.keys(palette.night).sort()).toEqual([...keys].sort());
  });

  test.each(keys)('day.%s equals its :root token', (key) => {
    expect<string>(palette.day[key]).toBe(light.get(tokenNames[key]) ?? 'missing');
  });

  test.each(keys)('night.%s equals its [data-theme="dark"] token', (key) => {
    expect<string>(palette.night[key]).toBe(dark.get(tokenNames[key]) ?? 'missing');
  });

  test('every colour token in theme.css is mirrored', () => {
    const mirrored = new Set<string>(Object.values(tokenNames));
    const notColours = new Set(['color-scheme', '--r', '--shadow', '--spotify']);
    const missing = [...light.keys()].filter((name) => !notColours.has(name) && !mirrored.has(name));
    expect(missing).toEqual([]);
  });

  test('spotify and theme-color derive from the tokens', () => {
    expect(spotify).toEqual({ day: palette.day.green, night: palette.night.green });
    expect(themeColor).toEqual({ light: '#e1e2e7', dark: '#16161e' });
  });
});

describe('ec-tokyonight-day.json (folke Tokyonight Day) matches the Day tokens', () => {
  /** Foreground of the last rule listing `scope` exactly (later rules win, as in TextMate). */
  const fg = (scope: string) =>
    ecDay.tokenColors.filter((rule) => rule.scope.includes(scope) && rule.settings.foreground).at(-1)?.settings
      .foreground;

  test('is a light theme on the Day background', () => {
    expect(ecDay.type).toBe('light');
    expect(ecDay.colors['editor.background']).toBe(light.get('--bg') ?? 'missing');
  });

  test.each([
    ['keyword', '--purple'],
    ['storage.type', '--purple'],
    ['string', '--green'],
    ['entity.name.function', '--blue'],
    ['meta.function-call', '--blue'],
  ])('%s equals Day %s', (scope, token) => {
    expect(fg(scope)?.toLowerCase()).toBe(light.get(token) ?? 'missing');
  });
});
