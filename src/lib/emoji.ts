/**
 * Twemoji: emoji name (the v1 `twa-*` class names) → Twemoji codepoint (the SVG file name).
 *
 * SVGs are vendored in `public/static/twemoji/{codepoint}.svg` from jdecked/twemoji (the
 * maintained fork, CC-BY 4.0), pinned to TWEMOJI_VERSION. Only the emoji the site uses are
 * vendored; to add one, add its name here and download
 * `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/svg/{codepoint}.svg`.
 */
export const TWEMOJI_VERSION = '17.0.3';

export const EMOJI_CODEPOINTS = {
  'atom-symbol': '269b',
  'bar-chart': '1f4ca',
  briefcase: '1f4bc',
  bullseye: '1f3af',
  calendar: '1f4c5',
  'clapping-hands': '1f44f',
  'clinking-beer-mugs': '1f37b',
  dog: '1f415',
  eye: '1f441',
  eyes: '1f440',
  'face-with-monocle': '1f9d0',
  'flag-vietnam': '1f1fb-1f1f3',
  'hammer-and-wrench': '1f6e0',
  'hourglass-not-done': '23f3',
  'inbox-tray': '1f4e5',
  'light-bulb': '1f4a1',
  'man-technologist': '1f468-200d-1f4bb',
  memo: '1f4dd',
  'musical-keyboard': '1f3b9',
  'page-facing-up': '1f4c4',
  'party-popper': '1f389',
  'soccer-ball': '26bd',
  'sparkling-heart': '1f496',
  student: '1f9d1-200d-1f393',
  tennis: '1f3be',
  'video-game': '1f3ae',
  'viet-nam-vietnam-flag': '1f1fb-1f1f3',
  'waving-hand': '1f44b',
} as const satisfies Record<string, string>;

export type EmojiName = keyof typeof EMOJI_CODEPOINTS;

/** Codepoint for an emoji name, or `undefined` when the name isn't mapped. */
export function emojiCodepoint(name: string): string | undefined {
  return Object.hasOwn(EMOJI_CODEPOINTS, name) ? EMOJI_CODEPOINTS[name as EmojiName] : undefined;
}

/** Public URL of the vendored SVG for a codepoint. */
export function emojiSrc(codepoint: string): string {
  return `/static/twemoji/${codepoint}.svg`;
}

/** Accessible label for an emoji name (`clinking-beer-mugs` → `clinking beer mugs`). */
export function emojiLabel(name: string): string {
  return name.replaceAll('-', ' ');
}

export type TwemojiSize = 'base' | 'lg' | '2x' | '3x';

/** Size classes shared by the Astro component and its React twin (v1 `twa`, `twa-lg`, … metrics). */
export const TWEMOJI_SIZE_CLASS: Record<TwemojiSize, string> = {
  base: 'mx-[0.1em] size-[1em] align-[-0.1em]',
  lg: 'mr-[0.0665em] ml-[0.133em] size-[1.33em] align-[-0.133em]',
  '2x': 'mr-[0.1em] ml-[0.2em] size-[2em] align-[-0.2em]',
  '3x': 'mr-[0.15em] ml-[0.3em] size-[3em] align-[-0.3em]',
};
