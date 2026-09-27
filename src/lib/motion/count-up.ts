/**
 * Count-up numbers (mockup "motion: numbers count up when they come into view").
 *
 * The final value is always server-rendered in the element's text; this only replays it from 0 once,
 * when motion is allowed and the element scrolls into view, so no-JS and reduced-motion visitors see
 * the real number immediately. Shared by the static `[data-count]` markup (wired by
 * `src/components/motion/CountUp.astro`) and the homepage islands (tasks 19, 20, 30, 31).
 */

export type CountOptions = {
  /** Fixed decimal places of every frame (default 0). */
  decimals?: number;
  /** Animation length in ms (default 1100). */
  duration?: number;
  /** Text appended to every frame, e.g. `k` or `M`. */
  suffix?: string;
};

export const COUNT_DURATION = 1100;
const FRAME_MS = 1000 / 60;

export function easeOutCubic(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - (1 - clamped) ** 3;
}

/** Value at elapsed time `ms`: eased from 0 to `to`, rounded to `decimals`, exactly `to` at the end. */
export function countValue(to: number, ms: number, { decimals = 0, duration = COUNT_DURATION }: CountOptions = {}) {
  if (ms >= duration) return to;
  const factor = 10 ** decimals;
  return Math.round(to * easeOutCubic(ms / duration) * factor) / factor;
}

/** Pure frame generator (about 60 fps) for tests: monotonic, and the last frame is exactly `to`. */
export function countFrames(to: number, options: CountOptions = {}): number[] {
  const duration = options.duration ?? COUNT_DURATION;
  const frames: number[] = [];
  for (let ms = 0; ms < duration; ms += FRAME_MS) frames.push(countValue(to, ms, options));
  frames.push(to);
  return frames;
}

/** `1234` → `1,234`; fixed `decimals`; `suffix` appended (`12.4k`). Matches the server-rendered text. */
export function formatCount(value: number, { decimals = 0, suffix = '' }: CountOptions = {}): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
}

const reduceMotion = () =>
  typeof matchMedia === 'function' && !matchMedia('(prefers-reduced-motion: no-preference)').matches;

/** Animates `el.textContent` from 0 to `to` once (about 1.1 s, ease-out cubic). No-op under reduced motion. */
export function countUp(el: HTMLElement, to: number, options: CountOptions = {}): void {
  if (!Number.isFinite(to) || reduceMotion()) return;
  const final = formatCount(to, options);
  const duration = options.duration ?? COUNT_DURATION;
  const start = performance.now();
  const step = (now: number) => {
    const elapsed = now - start;
    el.textContent = elapsed >= duration ? final : formatCount(countValue(to, elapsed, options), options);
    if (elapsed < duration) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

let observer: IntersectionObserver | undefined;

/** Reads `data-count` (a raw number, e.g. `1234`; the text shows `1,234`) / `data-dec` / `data-suffix` and counts up once the element is in view. */
function countUpFromDataset(el: HTMLElement): void {
  const to = Number.parseFloat(el.dataset.count ?? '');
  countUp(el, to, { decimals: Number(el.dataset.dec ?? 0), suffix: el.dataset.suffix ?? '' });
}

/** Observes every not-yet-counted `[data-count]` under `root` with one shared, one-shot IntersectionObserver. */
export function observeCounts(root: ParentNode = document): void {
  if (reduceMotion() || typeof IntersectionObserver === 'undefined') return;
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer?.unobserve(entry.target);
        countUpFromDataset(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 }
  );
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    if (el.dataset.counted === 'true') continue;
    el.dataset.counted = 'true';
    observer.observe(el);
  }
}

/** Stops observing (before a view-transition swap); elements of the next page are observed afresh. */
export function disconnectCounts(): void {
  observer?.disconnect();
  observer = undefined;
}
