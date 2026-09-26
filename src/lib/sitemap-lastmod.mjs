// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const BLOG_DIR = fileURLToPath(new URL('../content/blog/', import.meta.url));

/** @param {unknown} value */
function toDay(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * `{ '/blog/{id}': lastmod ?? date }` for every non-draft post, read straight from the MDX
 * frontmatter (`getCollection` is unavailable in `astro.config.mjs`). Values are the raw
 * frontmatter strings, as v1 `app/sitemap.ts` emitted them.
 *
 * @param {string} [dir]
 * @returns {Record<string, string>}
 */
export function blogLastmod(dir = BLOG_DIR) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.mdx')) continue;
    const source = readFileSync(join(dir, file), 'utf8');
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
    if (!match?.[1]) continue;
    const data = parse(match[1]) ?? {};
    if (data.draft === true) continue;
    const lastmod = toDay(data.lastmod) ?? toDay(data.date);
    if (lastmod) map[`/blog/${file.replace(/\.mdx$/, '')}`] = lastmod;
  }
  return map;
}
