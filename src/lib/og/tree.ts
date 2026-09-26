/**
 * The Open Graph card as a Satori element tree (plain `{ type, props }` objects, no React runtime).
 * Pure: no fs, no satori import, so `bun test` can check the layout rules. Colours come only from
 * the Tokyonight Night mirror in `palette.ts` (Satori cannot read CSS variables).
 */
import { palette } from '~/styles/palette';

const c = palette.night;

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCardInput {
  title: string;
  /** Shown under the title (the default card uses the site description). */
  subtitle?: string;
  /** Small caps label top right, e.g. "Blog post". */
  eyebrow?: string;
  /** Already formatted, e.g. "December 10, 2023". */
  date?: string;
  tags?: string[];
  readingMinutes?: number;
  author?: string;
}

export interface OgAssets {
  /** `data:` URI of the (downscaled) avatar. */
  avatar: string;
}

type Style = Record<string, string | number>;
export interface OgNode {
  type: string;
  props: { style?: Style; children?: OgChild | OgChild[]; src?: string; width?: number; height?: number };
}
type OgChild = OgNode | string;

function el(type: string, style: Style, children?: OgChild | OgChild[]): OgNode {
  return { type, props: children === undefined ? { style } : { style, children } };
}

const MAX_TAGS = 4;
export const TITLE_LONG = 60;

/** 64 px, dropping to 48 px for titles over 60 characters (spec 25). */
export function titleFontSize(title: string): number {
  return title.length > TITLE_LONG ? 48 : 64;
}

/** `date · 6 min read`, skipping whatever is missing. */
export function metaLine({ date, readingMinutes }: Pick<OgCardInput, 'date' | 'readingMinutes'>): string {
  const parts = [date, readingMinutes ? `${Math.max(1, Math.ceil(readingMinutes))} min read` : undefined];
  return parts.filter(Boolean).join('  ·  ');
}

function wordmark(): OgNode {
  return el('div', { display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }, [
    el('span', { color: c.fg }, 'karhdo'),
    el('span', { color: c.blue }, '.dev'),
  ]);
}

function chip(tag: string): OgNode {
  return el(
    'div',
    {
      display: 'flex',
      fontSize: 22,
      padding: '6px 14px',
      borderRadius: 10,
      border: `1px solid ${c.lineStrong}`,
      backgroundColor: c.surface,
      color: c.fgSoft,
    },
    [el('span', { color: c.purple }, '#'), el('span', {}, tag)]
  );
}

/** Tilted grid texture (v1 `tilted-grid.svg` pattern: 72 × 56 cells), faded towards the bottom. */
function grid(): OgNode {
  const line = c.line;
  return el('div', {
    position: 'absolute',
    top: -300,
    left: -200,
    width: OG_WIDTH + 400,
    height: OG_HEIGHT + 600,
    display: 'flex',
    transform: 'rotate(-10deg)',
    backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
    backgroundSize: '72px 56px',
    maskImage: `linear-gradient(to bottom, ${c.fg} 10%, transparent 75%)`,
  });
}

export function buildOgTree(input: OgCardInput, assets: OgAssets): OgNode {
  const tags = (input.tags ?? []).slice(0, MAX_TAGS);
  const meta = metaLine(input);

  const top = el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, [
    wordmark(),
    el(
      'div',
      { display: 'flex', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase', color: c.fgSoft },
      input.eyebrow ?? ''
    ),
  ]);

  const middle = el('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
    ...(tags.length > 0 ? [el('div', { display: 'flex', flexWrap: 'wrap', gap: 12 }, tags.map(chip))] : []),
    el(
      'div',
      {
        display: 'block',
        fontSize: titleFontSize(input.title),
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: -1,
        color: c.fg,
        lineClamp: 4,
      },
      input.title
    ),
    ...(input.subtitle
      ? [el('div', { display: 'block', fontSize: 28, lineHeight: 1.4, color: c.fgSoft, lineClamp: 2 }, input.subtitle)]
      : []),
  ]);

  const bottom = el('div', { display: 'flex', alignItems: 'center', gap: 20 }, [
    {
      type: 'img',
      props: {
        src: assets.avatar,
        width: 64,
        height: 64,
        style: { borderRadius: 999, border: `3px solid ${c.blue}` },
      },
    },
    el('div', { display: 'flex', flexDirection: 'column', gap: 2 }, [
      el('div', { display: 'flex', fontSize: 26, fontWeight: 700, color: c.fg }, input.author ?? ''),
      ...(meta ? [el('div', { display: 'flex', fontSize: 22, color: c.fgSoft }, meta)] : []),
    ]),
  ]);

  return el(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Outfit',
      backgroundColor: c.bg,
      backgroundImage: `radial-gradient(circle at 8% -10%, ${c.glowA}, transparent 55%), radial-gradient(circle at 98% 5%, ${c.glowB}, transparent 50%)`,
    },
    [
      grid(),
      el(
        'div',
        {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '60px 72px 64px',
        },
        [top, middle, bottom]
      ),
      // Accent strip along the bottom edge (blue → purple).
      el('div', {
        position: 'absolute',
        left: 0,
        bottom: 0,
        width: OG_WIDTH,
        height: 8,
        backgroundImage: `linear-gradient(to right, ${c.blue}, ${c.purple})`,
      }),
    ]
  );
}
