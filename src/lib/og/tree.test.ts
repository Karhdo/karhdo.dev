import { describe, expect, test } from 'bun:test';
import { palette } from '~/styles/palette';
import { buildOgTree, metaLine, OG_HEIGHT, OG_WIDTH, type OgNode, titleFontSize } from './tree';

const assets = { avatar: 'data:image/png;base64,AAAA' };

/** Every string leaf of the tree, in order. */
function texts(node: OgNode | string): string[] {
  if (typeof node === 'string') return [node];
  const { children } = node.props;
  if (children === undefined) return [];
  return (Array.isArray(children) ? children : [children]).flatMap(texts);
}

/** Every colour-ish style value in the tree. */
function styleValues(node: OgNode | string): string[] {
  if (typeof node === 'string') return [];
  const own = Object.values(node.props.style ?? {}).filter((v): v is string => typeof v === 'string');
  const { children } = node.props;
  const kids = children === undefined ? [] : Array.isArray(children) ? children : [children];
  return [...own, ...kids.flatMap(styleValues)];
}

describe('titleFontSize', () => {
  test('64 px, 48 px over 60 characters', () => {
    expect(titleFontSize('Exploring module in NestJS')).toBe(64);
    expect(titleFontSize('x'.repeat(60))).toBe(64);
    expect(titleFontSize('x'.repeat(61))).toBe(48);
    expect(titleFontSize('x'.repeat(120))).toBe(48);
  });
});

describe('metaLine', () => {
  test('date and rounded-up reading time', () => {
    expect(metaLine({ date: 'December 10, 2023', readingMinutes: 7.2 })).toBe('December 10, 2023  ·  8 min read');
  });
  test('skips what is missing', () => {
    expect(metaLine({ date: 'December 10, 2023' })).toBe('December 10, 2023');
    expect(metaLine({})).toBe('');
  });
});

describe('buildOgTree', () => {
  const tree = buildOgTree(
    {
      title: 'Hello',
      eyebrow: 'Blog post',
      date: 'May 1, 2024',
      readingMinutes: 3,
      tags: ['a', 'b', 'c', 'd', 'e'],
      author: 'Trong Khanh',
    },
    assets
  );

  test('is 1200 × 630', () => {
    expect(tree.props.style).toMatchObject({ width: OG_WIDTH, height: OG_HEIGHT });
    expect([OG_WIDTH, OG_HEIGHT]).toEqual([1200, 630]);
  });

  test('has the wordmark with .dev, title, meta, at most 4 tags', () => {
    const t = texts(tree);
    expect(t).toContain('karhdo');
    expect(t).toContain('.dev');
    expect(t).toContain('Hello');
    expect(t).toContain('May 1, 2024  ·  3 min read');
    expect(t.filter((s) => s === '#')).toHaveLength(4);
    expect(t).not.toContain('e');
  });

  test('uses only Tokyonight Night colours', () => {
    const night: string[] = Object.values(palette.night);
    const values = styleValues(tree).join(' ');
    const hexes = values.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    const rgbas = values.match(/rgba\([^)]*\)/g) ?? [];
    for (const colour of [...hexes, ...rgbas]) expect(night).toContain(colour);
    expect(hexes.length).toBeGreaterThan(0);
  });

  test('omits the subtitle and tag row when not given', () => {
    const t = texts(buildOgTree({ title: 'Site' }, assets));
    expect(t).not.toContain('#');
    expect(t).toContain('Site');
  });
});
