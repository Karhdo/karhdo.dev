import { describe, expect, test } from 'bun:test';
import { palette } from '~/styles/palette';
import { DAY_OVERRIDES, GISCUS_THEME_FILES, GISCUS_THEME_MODES, giscusThemeCss, giscusThemePath } from './giscus-theme';

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\([^)]*\)/g;

/** Primer variables every built-in Giscus theme defines (giscus.app/themes/light.css). */
const REQUIRED = [
  'fg-default',
  'fg-muted',
  'canvas-default',
  'canvas-overlay',
  'border-default',
  'accent-fg',
  'btn-primary-bg',
  'btn-primary-text',
  'danger-fg',
  'social-reaction-bg-hover',
  'prettylights-syntax-keyword',
];

describe('giscusThemeCss', () => {
  for (const mode of ['day', 'night'] as const) {
    const css = giscusThemeCss(mode);
    const values = new Set<string>(Object.values(palette[mode]));

    test(`${mode}: every colour literal is a Tokyonight ${mode} token value`, () => {
      const literals = css.match(COLOUR) ?? [];
      expect(literals.length).toBeGreaterThan(10);
      for (const literal of literals) expect(values.has(literal)).toBe(true);
    });

    test(`${mode}: defines the Primer variables Giscus reads`, () => {
      for (const name of REQUIRED) expect(css).toContain(`--color-${name}:`);
    });

    test(`${mode}: color-scheme matches the scheme`, () => {
      expect(css).toContain(`color-scheme: ${mode === 'night' ? 'dark' : 'light'};`);
    });
  }
});

describe('theme files', () => {
  test('paths map to the served files and back to their palette', () => {
    expect(giscusThemePath(true)).toBe(`/static/giscus/${GISCUS_THEME_FILES.dark}.css`);
    expect(giscusThemePath(false)).toBe(`/static/giscus/${GISCUS_THEME_FILES.light}.css`);
    expect(GISCUS_THEME_MODES[GISCUS_THEME_FILES.dark]).toBe('night');
    expect(GISCUS_THEME_MODES[GISCUS_THEME_FILES.light]).toBe('day');
  });
});

describe('Day accent contrast', () => {
  const MIXES = {
    'accent-fg': ['blue', 60],
    'danger-fg': ['red', 60],
    'attention-fg': ['yellow', 60],
    'success-fg': ['green', 70],
  };
  const day = giscusThemeCss('day');
  const night = giscusThemeCss('night');

  for (const [name, [token, percent]] of Object.entries(MIXES)) {
    test(`${name}: deepened toward --fg in Day, raw token in Night`, () => {
      const mix = `color-mix(in srgb, var(--tn-${token}) ${percent}%, var(--tn-fg))`;
      expect(DAY_OVERRIDES[name]).toBe(mix);
      expect(day).toContain(`--color-${name}: ${mix};`);
      expect(day).not.toContain(`--color-${name}: var(--tn-${token});`);
      expect(night).toContain(`--color-${name}: var(--tn-${token});`);
    });
  }
});
