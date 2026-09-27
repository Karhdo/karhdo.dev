/**
 * Palette lint (M-C): every colour must come from the Tokyonight tokens in src/styles/theme.css.
 * Fails, printing file:line, on any hex colour, rgb()/hsl()/hwb()/lab()/lch()/oklab()/oklch()/color() literal under src/,
 * outside the token file, its TS mirror, the vendored code theme and tests.
 *
 * Usage: bun run lint:palette
 */
import { Glob } from 'bun';

const ROOT = new URL('../', import.meta.url).pathname;

/** Paths (relative to the repo root) allowed to contain literal colours. */
const EXCLUDE = [
  new Glob('src/styles/theme.css'),
  new Glob('src/styles/palette.ts'),
  new Glob('src/styles/ec-tokyonight-day.json'),
  new Glob('**/*.test.ts'),
  new Glob('**/__fixtures__/**'),
];

/** Text files worth scanning (binary assets such as images and fonts are skipped). */
const SCAN = new Glob('src/**/*.{astro,ts,tsx,js,jsx,mjs,cjs,css,json,md,mdx,html,svg}');

// Colour functions: rgb(a), hsl(a), hwb, lab, lch, oklab, oklch, color().
// `#abc`, `#aabbcc`, `#aabbccdd` … but not HTML numeric entities such as `&#128075;`.
const COLOUR = /(?<!&)#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;

const violations: string[] = [];

for await (const file of SCAN.scan({ cwd: ROOT })) {
  if (EXCLUDE.some((glob) => glob.match(file))) continue;
  const lines = (await Bun.file(ROOT + file).text()).split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(COLOUR)) {
      violations.push(`${file}:${index + 1}:${(match.index ?? 0) + 1}  ${match[0]}  ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error(`lint:palette: ${violations.length} off-token colour literal(s). Use a theme.css token instead:\n`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log('lint:palette: OK (no colour literals outside the Tokyonight tokens)');
