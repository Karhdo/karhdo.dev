/** Tiny parser for the token blocks in `theme.css`, shared by theme/palette tests. */

export type TokenBlock = Map<string, string>;

export interface ThemeBlocks {
  /** `:root` — Tokyonight Day. */
  light: TokenBlock;
  /** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` — JS-off fallback. */
  darkMedia: TokenBlock;
  /** `:root[data-theme="dark"]` — Tokyonight Night. */
  dark: TokenBlock;
}

function blockAfter(css: string, selector: string): TokenBlock {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`theme.css: selector not found: ${selector}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close).replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens: TokenBlock = new Map();
  for (const decl of body.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const name = decl.slice(0, i).trim();
    const value = decl
      .slice(i + 1)
      .trim()
      .replace(/\s+/g, ' ');
    if (name) tokens.set(name, value);
  }
  return tokens;
}

export function parseThemeBlocks(css: string): ThemeBlocks {
  return {
    light: blockAfter(css, ':root'),
    darkMedia: blockAfter(css, ':root:not([data-theme="light"])'),
    dark: blockAfter(css, ':root[data-theme="dark"]'),
  };
}
