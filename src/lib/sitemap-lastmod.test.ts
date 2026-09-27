import { describe, expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { blogLastmod } from './sitemap-lastmod.mjs';

describe('blogLastmod', () => {
  test('equals the v1 sitemap lastmod (lastmod ?? date) for every post', () => {
    expect(blogLastmod()).toEqual({
      '/blog/exploring-module-in-nestjs': '2023-12-10',
      '/blog/how-to-prevent-overbooking-in-sql-with-multiple-methods': '2025-03-19',
      '/blog/problems-when-the-application-develops': '2023-12-03',
    });
  });

  test('falls back to date, skips drafts and non-MDX files', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lastmod-'));
    writeFileSync(join(dir, 'a.mdx'), "---\ntitle: A\ndate: '2024-01-02'\n---\nbody");
    writeFileSync(join(dir, 'b.mdx'), "---\ntitle: B\ndate: '2024-01-02'\nlastmod: 2024-02-03\n---\n");
    writeFileSync(join(dir, 'c.mdx'), "---\ntitle: C\ndate: '2024-01-02'\ndraft: true\n---\n");
    writeFileSync(join(dir, 'd.md'), "---\ntitle: D\ndate: '2024-01-02'\n---\n");
    expect(blogLastmod(dir)).toEqual({ '/blog/a': '2024-01-02', '/blog/b': '2024-02-03' });
  });
});
