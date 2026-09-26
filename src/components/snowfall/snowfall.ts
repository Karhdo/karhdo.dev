/**
 * Homepage snowfall: a fixed canvas of round flakes, plain TS with no dependency.
 * Starts when the browser is idle, pauses while the tab is hidden, never runs under reduced
 * motion (stops and resumes when that preference changes), and is torn down on every view
 * transition swap and re-initialised on `astro:page-load`.
 */
import { CONFIG, type Flake, makeFlake, stepFlake } from './model';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = matchMedia('(prefers-color-scheme: dark)');

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let flakes: Flake[] = [];
let W = 0;
let H = 0;
let color = '';
let raf = 0;
let running = false;
let pending: (() => void) | undefined; // cancels a scheduled start
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
let observer: MutationObserver | undefined;

function readColor() {
  color = getComputedStyle(document.documentElement).getPropertyValue('--snow-c').trim() || color;
}

function size() {
  if (!canvas || !ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  for (const f of flakes) {
    stepFlake(f, W, H, Math.random);
    ctx.globalAlpha = f.opacity;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
  raf = requestAnimationFrame(frame);
}

function start() {
  pending = undefined;
  if (running || !canvas) return;
  running = true;
  size();
  readColor();
  if (flakes.length === 0) flakes = Array.from({ length: CONFIG.count }, () => makeFlake(W, H, Math.random));
  if (!document.hidden) raf = requestAnimationFrame(frame);
}

function schedule() {
  if (running || pending) return;
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(start, { timeout: 2000 });
    pending = () => cancelIdleCallback(id);
  } else {
    const id = setTimeout(start, 200);
    pending = () => clearTimeout(id);
  }
}

/** Cancels the loop and any scheduled start and clears the canvas; listeners stay bound. */
function stop() {
  pending?.();
  pending = undefined;
  cancelAnimationFrame(raf);
  raf = 0;
  running = false;
  ctx?.clearRect(0, 0, W, H);
}

const onReducedMotion = (e: MediaQueryListEvent) => (e.matches ? stop() : schedule());
const onVisibility = () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else if (running && !raf) raf = requestAnimationFrame(frame);
};
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => running && size(), 150);
};

function cleanup() {
  stop();
  clearTimeout(resizeTimer);
  reducedMotion.removeEventListener('change', onReducedMotion);
  darkScheme.removeEventListener('change', readColor);
  document.removeEventListener('visibilitychange', onVisibility);
  window.removeEventListener('resize', onResize);
  observer?.disconnect();
  observer = undefined;
  canvas = ctx = null;
  flakes = [];
}

function init() {
  cleanup(); // double-start guard: one loop and one set of listeners per page
  const el = document.querySelector<HTMLCanvasElement>('[data-snowfall]');
  if (!el) return;
  if (el.dataset.snowfallMode === 'december' && new Date().getMonth() !== 11) return;
  canvas = el;
  ctx = el.getContext('2d');
  reducedMotion.addEventListener('change', onReducedMotion);
  darkScheme.addEventListener('change', readColor);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', onResize);
  observer = new MutationObserver(readColor);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (!reducedMotion.matches) schedule();
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
