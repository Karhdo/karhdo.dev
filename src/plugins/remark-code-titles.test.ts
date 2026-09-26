import { describe, expect, test } from 'bun:test';
import type { Code, Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import remarkCodeTitles from './remark-code-titles.mjs';

/** Parses one fenced block, runs the plugin, and returns the resulting code node. */
function run(info: string): Code {
  const processor = unified().use(remarkParse).use(remarkCodeTitles);
  const tree = processor.runSync(processor.parse(`\`\`\`${info}\nx\n\`\`\`\n`)) as Root;
  const node = tree.children[0];
  if (node?.type !== 'code') throw new Error('expected a code node');
  return node;
}

describe('remark-code-titles', () => {
  test('lang:file → lang + title', () => {
    const node = run('ts:a/b.ts');
    expect(node.lang).toBe('ts');
    expect(node.meta).toBe('title="a/b.ts"');
  });

  test('passes the remaining meta through byte-for-byte', () => {
    const node = run('ts:a.ts {2-3} ins={4} showLineNumbers');
    expect(node.lang).toBe('ts');
    expect(node.meta).toBe('title="a.ts" {2-3} ins={4} showLineNumbers');
  });

  test('keeps unusual spacing in the meta untouched', () => {
    expect(run('ts:a.ts {1}   del={2}  "x y"').meta).toBe('title="a.ts" {1}   del={2}  "x y"');
  });

  test('a fence without ":" is unchanged', () => {
    const node = run('sql');
    expect(node.lang).toBe('sql');
    expect(node.meta).toBeNull();
    expect(run('sql showLineNumbers').meta).toBe('showLineNumbers');
  });

  test('bash:.env → lang bash, title .env', () => {
    const node = run('bash:.env');
    expect(node.lang).toBe('bash');
    expect(node.meta).toBe('title=".env"');
  });

  test('splits only on the first ":"', () => {
    const node = run('ts:C:/x/y.ts');
    expect(node.lang).toBe('ts');
    expect(node.meta).toBe('title="C:/x/y.ts"');
  });

  test('escapes " and \\ in the title', () => {
    expect(run('ts:say"hi".ts').meta).toBe('title="say\\"hi\\".ts"');
    expect(run('txt:a\\b').meta).toBe('title="a\\\\b"');
  });

  test('leaves a leading or trailing ":" alone', () => {
    expect(run(':x').lang).toBe(':x');
    expect(run('ts:').lang).toBe('ts:');
  });
});
