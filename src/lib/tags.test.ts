import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import v1TagData from './__fixtures__/v1-tag-data.json';
import { countTags, tagSlug } from './tags';

const BLOG_DIR = join(import.meta.dir, '../content/blog');

/** Frontmatter of every blog MDX file, parsed without Astro. */
function loadPosts() {
  return readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const source = readFileSync(join(BLOG_DIR, file), 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
      if (!match?.[1]) throw new Error(`No frontmatter in ${file}`);
      const data = Bun.YAML.parse(match[1]) as { tags?: string[]; draft?: boolean };
      return { id: file.replace(/\.mdx$/, ''), data: { tags: data.tags ?? [], draft: data.draft ?? false } };
    });
}

describe('countTags', () => {
  test('equals v1 app/tag-data.json', () => {
    const counts = countTags(loadPosts());
    const flat = Object.fromEntries(Object.entries(counts).map(([slug, { count }]) => [slug, count]));
    expect(flat).toEqual(v1TagData);
  });

  test('entry ids equal the v1 slugs', () => {
    expect(
      loadPosts()
        .map((post) => post.id)
        .sort()
    ).toEqual([
      'exploring-module-in-nestjs',
      'how-to-prevent-overbooking-in-sql-with-multiple-methods',
      'problems-when-the-application-develops',
    ]);
  });

  test('skips drafts unless includeDrafts', () => {
    const posts = [{ data: { tags: ['a'], draft: true } }, { data: { tags: ['a'] } }];
    expect(countTags(posts)).toEqual({ a: { label: 'a', count: 1 } });
    expect(countTags(posts, { includeDrafts: true })).toEqual({ a: { label: 'a', count: 2 } });
  });
});

describe('tagSlug', () => {
  test('`design patterns` and `design-patterns` share a slug', () => {
    expect(tagSlug('design patterns')).toBe('design-patterns');
    expect(tagSlug('design-patterns')).toBe('design-patterns');
  });
});
