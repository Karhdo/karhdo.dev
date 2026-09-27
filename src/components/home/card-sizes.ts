/**
 * Natural heights (px) of the live bento cards in the mockup, measured at one-column width
 * (padding and border included). Each stub reserves its height with `min-height` so the owning
 * task (19, 20, 30, 31) fills it without layout shift. Keep the value when filling a card.
 */
export const CARD_MIN_HEIGHT = {
  spotify: 140,
  tokenBurn: 240,
  github: 238,
  blogStats: 281,
} as const;
