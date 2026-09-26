/**
 * Non-CSS mirror of the colour tokens in `theme.css`, for places that cannot read CSS variables:
 * Satori OG images, the `theme-color` meta / web manifest, and Expressive Code `styleOverrides`.
 *
 * Tokyonight Day (light) and Tokyonight Night (dark) only. `palette.test.ts` asserts every value
 * here equals its CSS token, so the two cannot drift.
 */

export type PaletteKey = keyof typeof day;

/** Maps each mirrored key to the CSS custom property it mirrors in theme.css. */
export const tokenNames = {
  bg: '--bg',
  bg2: '--bg-2',
  surface: '--surface',
  surfaceSolid: '--surface-solid',
  line: '--line',
  lineStrong: '--line-strong',
  fg: '--fg',
  fgSoft: '--fg-soft',
  muted: '--muted',
  faint: '--faint',
  blue: '--blue',
  purple: '--purple',
  cyan: '--cyan',
  green: '--green',
  orange: '--orange',
  red: '--red',
  teal: '--teal',
  yellow: '--yellow',
  blue1: '--blue1',
  shine: '--shine',
  codeBg: '--code-bg',
  codeFg: '--code-fg',
  glowA: '--glow-a',
  glowB: '--glow-b',
  snow: '--snow-c',
  heat0: '--heat-0',
  heat1: '--heat-1',
  heat2: '--heat-2',
  heat3: '--heat-3',
  heat4: '--heat-4',
} as const;

/** Tokyonight Day (light theme, `:root`). */
const day = {
  bg: '#e1e2e7',
  bg2: '#d5d6db',
  surface: 'rgba(255, 255, 255, 0.55)',
  surfaceSolid: '#eceef3',
  line: 'rgba(55, 96, 191, 0.14)',
  lineStrong: 'rgba(55, 96, 191, 0.28)',
  fg: '#343b58',
  fgSoft: '#4c5578',
  muted: '#6172b0',
  faint: '#8990b3',
  blue: '#2e7de9',
  purple: '#9854f1',
  cyan: '#007197',
  green: '#587539',
  orange: '#b15c00',
  red: '#f52a65',
  teal: '#118c74',
  yellow: '#8c6c3e',
  blue1: '#188092',
  shine: 'rgba(225, 226, 231, 0.75)',
  codeBg: '#e9e9ed',
  codeFg: '#3760bf',
  glowA: 'rgba(46, 125, 233, 0.2)',
  glowB: 'rgba(152, 84, 241, 0.16)',
  snow: '#6172b0',
  heat0: 'rgba(55, 96, 191, 0.08)',
  heat1: '#b7c7ee',
  heat2: '#7ea1ea',
  heat3: '#4d80e4',
  heat4: '#2e62c9',
} as const;

/** Tokyonight Night (dark theme, `[data-theme="dark"]` and the OS-dark fallback). */
const night = {
  bg: '#16161e',
  bg2: '#1a1b26',
  surface: 'rgba(36, 40, 59, 0.55)',
  surfaceSolid: '#1f2335',
  line: 'rgba(122, 162, 247, 0.12)',
  lineStrong: 'rgba(122, 162, 247, 0.26)',
  fg: '#c0caf5',
  fgSoft: '#a9b1d6',
  muted: '#7982a9',
  faint: '#565f89',
  blue: '#7aa2f7',
  purple: '#bb9af7',
  cyan: '#7dcfff',
  green: '#9ece6a',
  orange: '#ff9e64',
  red: '#f7768e',
  teal: '#73daca',
  yellow: '#e0af68',
  blue1: '#2ac3de',
  shine: 'rgba(192, 202, 245, 0.75)',
  codeBg: '#1a1b26',
  codeFg: '#c0caf5',
  glowA: 'rgba(122, 162, 247, 0.18)',
  glowB: 'rgba(187, 154, 247, 0.14)',
  snow: '#c0caf5',
  heat0: 'rgba(122, 162, 247, 0.07)',
  heat1: '#2a3a66',
  heat2: '#3d59a1',
  heat3: '#5a7ed6',
  heat4: '#7aa2f7',
} as const satisfies Record<PaletteKey, string>;

export const palette = { day, night } as const;

/** `--spotify` is `var(--green)` in every theme (Tokyonight green, not the brand colour). */
export const spotify = { day: day.green, night: night.green } as const;

/** `<meta name="theme-color">` / web manifest values: the page background per scheme. */
export const themeColor = { light: day.bg, dark: night.bg } as const;
