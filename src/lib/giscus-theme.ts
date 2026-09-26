/**
 * Custom Giscus themes built only from the Tokyonight tokens mirrored in `src/styles/palette.ts`
 * (Day for light, Night for dark). Served as static CSS by `src/pages/static/giscus/[theme].css.ts`
 * and passed to Giscus as an absolute URL, so the iframe (which cannot read the page's CSS
 * variables) gets the exact site palette.
 *
 * Every colour below is a palette value, or a `color-mix(…, transparent)` alpha of one.
 * The variable names are Giscus's (Primer's), from giscus.app/themes/{light,transparent_dark}.css.
 */
import { type PaletteKey, palette } from '~/styles/palette';

export type GiscusThemeMode = keyof typeof palette;

/** File names (without `.css`) of the served themes, keyed by site scheme. */
export const GISCUS_THEME_FILES = { light: 'tokyonight-day', dark: 'tokyonight-night' } as const;

/** Maps a served theme file name back to its palette. */
export const GISCUS_THEME_MODES: Record<string, GiscusThemeMode> = {
  [GISCUS_THEME_FILES.light]: 'day',
  [GISCUS_THEME_FILES.dark]: 'night',
};

/** Absolute path of a served theme (Giscus needs an absolute URL; resolve it against `location.origin`). */
export const giscusThemePath = (dark: boolean) => `/static/giscus/${GISCUS_THEME_FILES[dark ? 'dark' : 'light']}.css`;

const t = (key: PaletteKey) => `var(--tn-${key})`;
const alpha = (key: PaletteKey, percent: number) => `color-mix(in srgb, ${t(key)} ${percent}%, transparent)`;
const NONE = '0 0 transparent';

/** Giscus/Primer variables → Tokyonight tokens. Identical mapping for both schemes. */
const VARS: Record<string, string> = {
  // Code in comments (Tokyonight syntax roles).
  'prettylights-syntax-comment': t('faint'),
  'prettylights-syntax-constant': t('orange'),
  'prettylights-syntax-entity': t('blue'),
  'prettylights-syntax-storage-modifier-import': t('fg'),
  'prettylights-syntax-entity-tag': t('red'),
  'prettylights-syntax-keyword': t('purple'),
  'prettylights-syntax-string': t('green'),
  'prettylights-syntax-variable': t('fg'),
  'prettylights-syntax-brackethighlighter-unmatched': t('red'),
  'prettylights-syntax-invalid-illegal-text': t('fg'),
  'prettylights-syntax-invalid-illegal-bg': alpha('red', 20),
  'prettylights-syntax-carriage-return-text': t('fg'),
  'prettylights-syntax-carriage-return-bg': alpha('red', 20),
  'prettylights-syntax-string-regexp': t('cyan'),
  'prettylights-syntax-markup-list': t('yellow'),
  'prettylights-syntax-markup-heading': t('blue'),
  'prettylights-syntax-markup-italic': t('fg'),
  'prettylights-syntax-markup-bold': t('fg'),
  'prettylights-syntax-markup-deleted-text': t('red'),
  'prettylights-syntax-markup-deleted-bg': alpha('red', 15),
  'prettylights-syntax-markup-inserted-text': t('green'),
  'prettylights-syntax-markup-inserted-bg': alpha('green', 15),
  'prettylights-syntax-markup-changed-text': t('yellow'),
  'prettylights-syntax-markup-changed-bg': alpha('yellow', 15),
  'prettylights-syntax-markup-ignored-text': t('fg'),
  'prettylights-syntax-markup-ignored-bg': alpha('blue', 20),
  'prettylights-syntax-meta-diff-range': t('purple'),
  'prettylights-syntax-brackethighlighter-angle': t('faint'),
  'prettylights-syntax-sublimelinter-gutter-mark': t('faint'),
  'prettylights-syntax-constant-other-reference-link': t('cyan'),
  // Buttons. Primary = `--heat-4` with `--surface-solid` text (AA in both schemes, see 00-overview notes).
  'btn-text': t('fg'),
  'btn-bg': t('surface'),
  'btn-border': t('lineStrong'),
  'btn-shadow': NONE,
  'btn-inset-shadow': NONE,
  'btn-hover-bg': t('heat0'),
  'btn-hover-border': t('blue'),
  'btn-active-bg': t('heat0'),
  'btn-active-border': t('blue'),
  'btn-selected-bg': t('heat0'),
  'btn-primary-text': t('surfaceSolid'),
  'btn-primary-bg': t('heat4'),
  'btn-primary-border': t('heat4'),
  'btn-primary-shadow': NONE,
  'btn-primary-inset-shadow': NONE,
  'btn-primary-hover-bg': t('heat4'),
  'btn-primary-hover-border': t('fg'),
  'btn-primary-selected-bg': t('heat4'),
  'btn-primary-selected-shadow': NONE,
  'btn-primary-disabled-text': t('fgSoft'),
  'btn-primary-disabled-bg': t('heat1'),
  'btn-primary-disabled-border': t('line'),
  'action-list-item-default-hover-bg': t('heat0'),
  'segmented-control-bg': t('heat0'),
  'segmented-control-button-bg': t('surfaceSolid'),
  'segmented-control-button-selected-border': t('lineStrong'),
  // Text: `--fg-soft` rather than `--muted` for meaningful small text (Day AA, see 00-overview notes).
  'fg-default': t('fg'),
  'fg-muted': t('fgSoft'),
  'fg-subtle': t('fgSoft'),
  // Surfaces: transparent canvas so the comments sit on the page background, glassy boxes.
  'canvas-default': 'transparent',
  'canvas-overlay': t('surfaceSolid'),
  'canvas-inset': t('surface'),
  'canvas-subtle': t('surface'),
  'border-default': t('lineStrong'),
  'border-muted': t('line'),
  'neutral-muted': t('heat0'),
  'neutral-subtle': t('heat0'),
  'accent-fg': t('blue'),
  'accent-emphasis': t('heat4'),
  'accent-muted': alpha('blue', 40),
  'accent-subtle': alpha('blue', 12),
  'success-fg': t('green'),
  'attention-fg': t('yellow'),
  'attention-muted': alpha('yellow', 40),
  'attention-subtle': alpha('yellow', 15),
  'danger-fg': t('red'),
  'danger-muted': alpha('red', 40),
  'danger-subtle': alpha('red', 12),
  'primer-shadow-inset': NONE,
  'social-reaction-bg-hover': t('heat0'),
  'social-reaction-bg-reacted-hover': alpha('blue', 20),
};

/** Mixes a Day accent toward `--fg` so it reaches AA (≥4.5:1) as small text on `--bg`. */
const deepen = (key: PaletteKey, percent: number) => `color-mix(in srgb, ${t(key)} ${percent}%, ${t('fg')})`;

/**
 * Day only: the raw Day accents are below AA as small text on `--bg`, so they are deepened toward
 * `--fg` (same approach as the Tag fix; ~4.6-5.2:1). Night keeps the raw tokens.
 */
export const DAY_OVERRIDES: Record<string, string> = {
  'accent-fg': deepen('blue', 60),
  'danger-fg': deepen('red', 60),
  'attention-fg': deepen('yellow', 60),
  'success-fg': deepen('green', 70),
};

/** Giscus's own loader images per scheme (URLs, not colours). */
const LOADERS: Record<GiscusThemeMode, { line: string; gif: string }> = {
  day: {
    line: 'https://github.com/images/modules/pulls/progressive-disclosure-line.svg',
    gif: 'https://github.githubassets.com/images/mona-loading-default.gif',
  },
  night: {
    line: 'https://github.com/images/modules/pulls/progressive-disclosure-line-dark.svg',
    gif: 'https://github.githubassets.com/images/mona-loading-dark.gif',
  },
};

/** The full theme stylesheet for one scheme. */
export function giscusThemeCss(mode: GiscusThemeMode): string {
  const colours = palette[mode];
  const overrides = mode === 'day' ? DAY_OVERRIDES : {};
  const tokens = (Object.keys(colours) as PaletteKey[]).map((key) => `  --tn-${key}: ${colours[key]};`);
  const vars = Object.entries({ ...VARS, ...overrides }).map(([name, value]) => `  --color-${name}: ${value};`);
  const scheme = mode === 'night' ? 'dark' : 'light';
  return `/* karhdo.dev Giscus theme: Tokyonight ${mode === 'night' ? 'Night' : 'Day'} (generated from src/styles/palette.ts). */
:root {
  color-scheme: ${scheme};
}

main {
${tokens.join('\n')}
${vars.join('\n')}
}

main .pagination-loader-container {
  background-image: url(${LOADERS[mode].line});
}

main .gsc-loading-image {
  background-image: url(${LOADERS[mode].gif});
}

.gsc-pagination-button {
  background-color: var(--color-btn-bg);
}
`;
}
