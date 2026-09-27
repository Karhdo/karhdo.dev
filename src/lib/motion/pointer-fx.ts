/**
 * Spotlight + 3D card tilt (mockup "motion: card tilt" and "spotlight"), driven by ONE delegated,
 * passive, rAF-throttled `pointermove` listener on `document`.
 *
 * - Spotlight: `--mx` / `--my` (px) on the closest `[data-card]`; the CSS glow shows on hover.
 * - Tilt: `--rx` / `--ry` + `.tilting` on the closest `[data-tilt]`; max 4° for cards ≤ 500 px wide,
 *   2° for wider ones. Leaving a card (or moving to another one) resets it.
 *
 * Both run only while `html[data-fx="on"]`: a hover-capable fine pointer AND motion allowed. The CSS
 * is gated on the same attribute, so with `off` (touch, reduced motion, no JS) nothing is transformed.
 * Module scripts run once under `<ClientRouter />`, so the listeners are registered exactly once;
 * `astro:page-load` only re-evaluates `data-fx` and drops stale custom properties.
 */

const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';
/** Cards wider than this tilt at most `TILT_WIDE`°, others `TILT_SMALL`° (mockup `k`). */
const WIDE_CARD_PX = 500;
const TILT_SMALL = 4;
const TILT_WIDE = 2;

/** Max tilt (degrees) for a card of this layout width. */
export function maxTilt(width: number): number {
  return width > WIDE_CARD_PX ? TILT_WIDE : TILT_SMALL;
}

/**
 * Tilt angles for a pointer at (`x`, `y`) inside a `width` × `height` box (box-relative px). Pointer
 * right → positive `ry` (turns right), pointer down → negative `rx` (bottom edge tilts away).
 * Values are clamped, so a pointer just outside the box (rounding) never over-tilts. `layoutWidth`
 * (untransformed width) picks the limit; it defaults to `width`.
 */
export function tiltAngles(
  x: number,
  y: number,
  width: number,
  height: number,
  layoutWidth = width
): { rx: number; ry: number } {
  if (width <= 0 || height <= 0) return { rx: 0, ry: 0 };
  // -1…1 from edge to edge, so an edge reaches the full limit (the spec's 4° / 2°; the mockup's
  // `(x - .5) * k` only reached half of k).
  const clamp = (v: number) => Math.min(1, Math.max(-1, v));
  const k = maxTilt(layoutWidth);
  const px = clamp((x / width - 0.5) * 2);
  const py = clamp((y / height - 0.5) * 2);
  const round = (v: number) => Math.round(v * 100) / 100 + 0; // `+ 0` turns -0 into 0
  return { rx: round(-py * k), ry: round(px * k) };
}

let hoverMq: MediaQueryList | undefined;
let motionMq: MediaQueryList | undefined;
let tilted: HTMLElement | null = null;
let pending: PointerEvent | null = null;
let frame = 0;

const fxOn = () => document.documentElement.dataset.fx === 'on';

function resetTilt(): void {
  if (!tilted) return;
  tilted.classList.remove('tilting');
  tilted.style.removeProperty('--rx');
  tilted.style.removeProperty('--ry');
  tilted = null;
}

/** Clears every leftover tilt/spotlight property (after a swap, persisted cards may carry them). */
function clearAll(): void {
  tilted = null;
  for (const el of document.querySelectorAll<HTMLElement>('[data-tilt], [data-card]')) {
    el.classList.remove('tilting');
    for (const prop of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(prop);
  }
}

function applyFx(): void {
  const on = Boolean(hoverMq?.matches && motionMq?.matches);
  document.documentElement.dataset.fx = on ? 'on' : 'off';
  if (!on) clearAll();
}

function flush(): void {
  frame = 0;
  const event = pending;
  pending = null;
  if (!event || !fxOn()) return;
  const target = event.target instanceof Element ? event.target : null;

  const card = target?.closest<HTMLElement>('[data-card]');
  if (card) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${Math.round(event.clientX - r.left)}px`);
    card.style.setProperty('--my', `${Math.round(event.clientY - r.top)}px`);
  }

  const tilt = target?.closest<HTMLElement>('[data-tilt]') ?? null;
  if (tilt !== tilted) resetTilt();
  if (!tilt) return;
  // Pointer position from the (slightly projected) visual box; the tilt limit from the layout width,
  // which a transform does not change (00-overview: clientWidth, not getBoundingClientRect).
  const r = tilt.getBoundingClientRect();
  const { rx, ry } = tiltAngles(event.clientX - r.left, event.clientY - r.top, r.width, r.height, tilt.offsetWidth);
  tilted = tilt;
  tilt.classList.add('tilting');
  tilt.style.setProperty('--rx', `${rx}deg`);
  tilt.style.setProperty('--ry', `${ry}deg`);
}

function onPointerMove(event: PointerEvent): void {
  if (event.pointerType === 'touch' || !fxOn()) return;
  pending = event;
  if (!frame) frame = requestAnimationFrame(flush);
}

function onLeave(): void {
  pending = null;
  resetTilt();
}

/** Registers the listeners once; safe to call again (no-op). */
export function initPointerFx(): void {
  if (hoverMq) return;
  hoverMq = matchMedia(HOVER_QUERY);
  motionMq = matchMedia(MOTION_QUERY);
  hoverMq.addEventListener('change', applyFx);
  motionMq.addEventListener('change', applyFx);
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  // The pointer left the window, or the page is being swapped: no card stays tilted.
  document.documentElement.addEventListener('pointerleave', onLeave, { passive: true });
  document.addEventListener('astro:before-swap', onLeave);
  document.addEventListener('astro:page-load', () => {
    clearAll();
    applyFx();
  });
  applyFx();
}
