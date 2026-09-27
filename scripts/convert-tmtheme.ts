/**
 * One-off converter: folke's Tokyonight Day TextMate theme → VS Code theme JSON for Expressive Code.
 *
 * Not run at build time. The output (`src/styles/ec-tokyonight-day.json`) is committed; this script
 * is kept so the conversion can be reproduced or re-pinned to a newer upstream commit.
 *
 * Usage: bun scripts/convert-tmtheme.ts [path-or-url-to-tmTheme]
 *   (default: the pinned upstream URL below)
 */

const COMMIT = 'cdc07ac78467a233fd62c493de29a17e0cf2b2b6';
const SOURCE_URL = `https://raw.githubusercontent.com/folke/tokyonight.nvim/${COMMIT}/extras/sublime/tokyonight_day.tmTheme`;
const OUTPUT = new URL('../src/styles/ec-tokyonight-day.json', import.meta.url);

type PlistValue = string | boolean | number | PlistValue[] | { [key: string]: PlistValue };

/** Minimal XML plist parser: dict, array, key, string, integer, real, true, false. */
function parsePlist(xml: string): PlistValue {
  // Leaf elements carry their text; container tags are matched on their own so that
  // consecutive closing tags are never merged into one token.
  const tokens = [
    ...xml.matchAll(
      /<(key|string|integer|real)>([^<]*)<\/\1>|<(string|true|false|dict|array)\s*\/>|<(\/?)(dict|array)>/g
    ),
  ].map(([, leaf, text, empty, closing, container]) =>
    leaf
      ? { tag: leaf, text: text ?? '', closing: false, empty: false }
      : empty
        ? { tag: empty, text: '', closing: false, empty: true }
        : { tag: container ?? '', text: '', closing: closing === '/', empty: false }
  );
  let i = 0;

  const decode = (text: string) =>
    text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');

  function value(): PlistValue {
    const token = tokens[i++];
    if (!token) throw new Error('Unexpected end of plist');
    const { tag, text, closing, empty: selfClosing } = token;
    if (closing) throw new Error(`Unexpected </${tag}>`);
    switch (tag) {
      case 'string':
        return selfClosing ? '' : decode(text);
      case 'integer':
      case 'real':
        return Number(text);
      case 'true':
        return true;
      case 'false':
        return false;
      case 'array': {
        const items: PlistValue[] = [];
        if (selfClosing) return items;
        while (tokens[i] && !(tokens[i]?.closing && tokens[i]?.tag === 'array')) items.push(value());
        i++;
        return items;
      }
      case 'dict': {
        const dict: Record<string, PlistValue> = {};
        if (selfClosing) return dict;
        while (tokens[i] && !(tokens[i]?.closing && tokens[i]?.tag === 'dict')) {
          const key = tokens[i++];
          if (key?.tag !== 'key') throw new Error(`Expected <key>, got <${key?.tag}>`);
          dict[decode(key.text)] = value();
        }
        i++;
        return dict;
      }
      default:
        throw new Error(`Unexpected <${tag}>`);
    }
  }

  // The first token is the root <dict> (the <plist> wrapper is not tokenised).
  return value();
}

type TmSetting = { name?: string; scope?: string; settings: Record<string, string> };

const input = process.argv[2] ?? SOURCE_URL;
const xml = /^https?:\/\//.test(input) ? await (await fetch(input)).text() : await Bun.file(input).text();
const root = parsePlist(xml) as { settings: TmSetting[] };

const [globals, ...rules] = root.settings;
if (!globals || globals.scope) throw new Error('Expected the first settings entry to be the global settings');
const g = globals.settings;

const theme = {
  $comment: [
    `Converted by scripts/convert-tmtheme.ts from ${SOURCE_URL}`,
    `(folke/tokyonight.nvim @ ${COMMIT}).`,
    'Tokyonight by Folke Lemaitre, licensed under the Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0); converted to VS Code theme JSON, colours unchanged.',
  ].join(' '),
  name: 'Tokyonight Day (folke)',
  type: 'light',
  colors: {
    'editor.background': g.background,
    'editor.foreground': g.foreground,
    'editor.selectionBackground': g.selection,
    'editorLineNumber.foreground': g.gutterForeground,
  },
  tokenColors: rules
    .filter((rule) => rule.scope && (rule.settings.foreground || rule.settings.fontStyle !== undefined))
    .map((rule) => ({
      ...(rule.name ? { name: rule.name } : {}),
      scope: (rule.scope as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      settings: {
        ...(rule.settings.foreground ? { foreground: rule.settings.foreground } : {}),
        ...(rule.settings.fontStyle !== undefined ? { fontStyle: rule.settings.fontStyle } : {}),
      },
    })),
};

await Bun.write(OUTPUT, `${JSON.stringify(theme, null, 2)}\n`);
// Match the repo's formatter so a re-run produces no diff when upstream is unchanged.
Bun.spawnSync(['bunx', 'biome', 'format', '--write', OUTPUT.pathname], { stdout: 'ignore', stderr: 'inherit' });
console.log(`Wrote ${theme.tokenColors.length} token rules to ${OUTPUT.pathname}`);
