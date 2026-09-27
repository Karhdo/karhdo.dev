/**
 * Pauses every infinite CSS animation tagged `.loop-anim` (marquee tracks, the hero name shine and
 * dot, live pulses, the Token burn flame, Spotify bars, shimmer skeletons, the typed caret) while it
 * is off-screen or the tab is hidden: toggles `data-paused`, and animations.css applies
 * `animation-play-state: paused` to the element and its descendants.
 *
 * One IntersectionObserver per page (100 px margin, so loops resume just before they scroll in).
 * `observeLoops` runs on `astro:page-load`, `disconnectLoops` on `astro:before-swap`.
 */

const SELECTOR = '.loop-anim';

let io: IntersectionObserver | undefined;
/** Last intersection state per element; missing = not reported yet (treated as visible). */
const inView = new WeakMap<Element, boolean>();

/** Whether a loop should be paused: tab hidden, or reported off-screen. */
export function shouldPause(hidden: boolean, visible: boolean | undefined): boolean {
  return hidden || visible === false;
}

function sync(el: HTMLElement): void {
  if (shouldPause(document.hidden, inView.get(el))) el.dataset.paused = 'true';
  else delete el.dataset.paused;
}

function syncAll(): void {
  for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) sync(el);
}

export function observeLoops(): void {
  disconnectLoops();
  if (typeof IntersectionObserver === 'undefined') return;
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        inView.set(entry.target, entry.isIntersecting);
        sync(entry.target as HTMLElement);
      }
    },
    { rootMargin: '100px' }
  );
  for (const el of document.querySelectorAll<HTMLElement>(SELECTOR)) io.observe(el);
  syncAll();
}

export function disconnectLoops(): void {
  io?.disconnect();
  io = undefined;
}

let registered = false;

/** Registers the page-lifecycle and visibility listeners once. */
export function initPauseOffscreen(): void {
  if (registered) return;
  registered = true;
  document.addEventListener('astro:page-load', observeLoops);
  document.addEventListener('astro:before-swap', disconnectLoops);
  document.addEventListener('visibilitychange', syncAll);
}
