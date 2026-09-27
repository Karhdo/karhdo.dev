/**
 * Build-time OG image renderer: Satori (element tree → SVG) + resvg (SVG → PNG). Only the
 * prerendered `/og/[...slug].png` route imports this, so the native resvg binary never reaches a
 * Vercel function. Fonts and the avatar are loaded once per build and reused for every image.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import type { ReactNode } from 'react';
import satori, { type Font } from 'satori';
import { buildOgTree, OG_HEIGHT, OG_WIDTH, type OgAssets, type OgCardInput } from './tree';

export type { OgCardInput } from './tree';

const ROOT = process.cwd();
/** Satori reads TTF/OTF/WOFF, not WOFF2: the static `@fontsource/outfit` weights. */
const fontFile = (weight: 400 | 700) =>
  join(ROOT, 'node_modules/@fontsource/outfit/files', `outfit-latin-${weight}-normal.woff`);
const AVATAR = join(ROOT, 'public/static/images/avatar.jpg');
const AVATAR_PX = 128; // 2× the 64 px it is drawn at

let cached: Promise<{ fonts: Font[]; assets: OgAssets }> | undefined;

/** The 349 kB / 1505 px avatar, cropped square and downscaled once so every card embeds ~10 kB. */
async function loadAvatar(): Promise<string> {
  const jpeg = (await readFile(AVATAR)).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_PX}" height="${AVATAR_PX}"><image href="data:image/jpeg;base64,${jpeg}" width="${AVATAR_PX}" height="${AVATAR_PX}" preserveAspectRatio="xMidYMid slice"/></svg>`;
  const png = new Resvg(svg).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
}

function load() {
  cached ??= (async () => {
    const [regular, bold, avatar] = await Promise.all([readFile(fontFile(400)), readFile(fontFile(700)), loadAvatar()]);
    const fonts: Font[] = [
      { name: 'Outfit', data: regular, weight: 400, style: 'normal' },
      { name: 'Outfit', data: bold, weight: 700, style: 'normal' },
    ];
    return { fonts, assets: { avatar } };
  })();
  return cached;
}

/** A 1200 × 630 PNG for one card (a plain `ArrayBuffer`-backed view, so it is a valid `BodyInit`). */
export async function renderOgImage(input: OgCardInput): Promise<Uint8Array<ArrayBuffer>> {
  const { fonts, assets } = await load();
  const tree = buildOgTree(input, assets) as unknown as ReactNode;
  const svg = await satori(tree, { width: OG_WIDTH, height: OG_HEIGHT, fonts });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng());
}
