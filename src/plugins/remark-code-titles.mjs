/**
 * Turns v1 `lang:title` fences into Expressive Code titles:
 *
 *   ```ts:src/app.ts {2-3} ins={4} showLineNumbers
 *   → lang `ts`, meta `title="src/app.ts" {2-3} ins={4} showLineNumbers`
 *
 * The lang/title split happens on the first `:` only. The rest of the meta string is passed
 * through byte-for-byte after the prepended title. Fences without `:` are left unchanged.
 * `"` and `\` in the title are backslash-escaped (Expressive Code's meta parser unescapes them).
 */
import { visit } from 'unist-util-visit';

/** @param {string} title */
const quote = (title) => `"${title.replace(/[\\"]/g, '\\$&')}"`;

/** @returns {(tree: import('mdast').Root) => void} */
export default function remarkCodeTitles() {
  return (tree) => {
    visit(tree, 'code', (node) => {
      const colon = node.lang?.indexOf(':') ?? -1;
      if (!node.lang || colon <= 0 || colon === node.lang.length - 1) return;
      const title = node.lang.slice(colon + 1);
      node.lang = node.lang.slice(0, colon);
      node.meta = node.meta ? `title=${quote(title)} ${node.meta}` : `title=${quote(title)}`;
    });
  };
}
