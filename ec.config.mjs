// @ts-check
/**
 * Expressive Code config (loaded by astro-expressive-code at build and by its <Code> component).
 *
 * Dark: Shiki's `tokyo-night`. Light: folke's Tokyonight Day, converted once from its tmTheme by
 * scripts/convert-tmtheme.ts. Every colour override below comes from src/styles/palette.ts (the
 * TS mirror of the Tokyonight tokens in theme.css); there are no inline colour literals here.
 */
import fs from 'node:fs';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { defineEcConfig, ExpressiveCodeTheme, setAlpha } from 'astro-expressive-code';
import { pluginLanguageBadge } from './src/plugins/ec-language-badge.mjs';
import { palette } from './src/styles/palette.ts';

const tokyoDay = ExpressiveCodeTheme.fromJSONString(
  fs.readFileSync(new URL('./src/styles/ec-tokyonight-day.json', import.meta.url), 'utf8')
);

/**
 * Per-theme overrides from one palette (Day or Night), so the light theme never shows a dark
 * frame and vice versa.
 * @param {typeof palette.day | typeof palette.night} p
 * @param {string} activeTab background of the filename tab
 */
const overridesFor = (p, activeTab) => ({
  codeBackground: p.codeBg,
  codeForeground: p.codeFg,
  frames: {
    editorBackground: p.codeBg,
    editorTabBarBackground: p.codeBg,
    editorTabBarBorderBottomColor: p.line,
    editorActiveTabBackground: activeTab,
    editorActiveTabForeground: p.fgSoft,
    editorActiveTabIndicatorTopColor: 'transparent',
    editorActiveTabIndicatorBottomColor: 'transparent',
    terminalBackground: p.codeBg,
    terminalTitlebarBackground: p.codeBg,
    terminalTitlebarForeground: p.muted,
    terminalTitlebarBorderBottomColor: p.line,
    inlineButtonForeground: p.fgSoft,
    inlineButtonBorder: p.lineStrong,
    tooltipSuccessBackground: p.green,
    tooltipSuccessForeground: p.bg,
  },
  textMarkers: {
    markBackground: setAlpha(p.blue, 0.12),
    markBorderColor: p.blue,
    insBackground: setAlpha(p.green, 0.13),
    insBorderColor: p.green,
    insDiffIndicatorColor: p.green,
    delBackground: setAlpha(p.red, 0.12),
    delBorderColor: p.red,
    delDiffIndicatorColor: p.red,
  },
  lineNumbers: {
    foreground: p.faint,
    highlightForeground: p.fgSoft,
  },
});

export default defineEcConfig({
  themes: ['tokyo-night', tokyoDay],
  themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
  useDarkModeMediaQuery: true, // JS-off fallback (m8); the attribute wins when set
  // Keep the exact Tokyonight Day/Night token colours (as v1 did). EC's default of 5.5 rewrites
  // low-contrast tokens, e.g. light `const` rendered #663da0 instead of Day --purple #9854f1.
  minSyntaxHighlightingColorContrast: 0,
  customizeTheme: (theme) => {
    theme.styleOverrides =
      theme.type === 'light'
        ? overridesFor(palette.day, palette.day.bg)
        : overridesFor(palette.night, palette.night.bg);
    return theme;
  },
  plugins: [pluginLineNumbers(), pluginLanguageBadge()],
  defaultProps: { showLineNumbers: false, wrap: false },
  frames: { showCopyToClipboardButton: true },
  styleOverrides: {
    borderRadius: '14px',
    borderColor: 'var(--line)',
    codeFontFamily: 'var(--font-mono)',
    codeFontSize: '0.875rem',
    codeLineHeight: '1.7',
    uiFontFamily: 'var(--font-mono)',
    uiFontSize: '0.78rem',
    frames: { shadowColor: 'transparent', frameBoxShadowCssValue: 'none' },
    textMarkers: { lineMarkerAccentWidth: '3px' },
  },
});
