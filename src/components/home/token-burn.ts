/**
 * Token burn card script (bundled; no React). Fetches `GET /api/token-burn` once when the card scrolls
 * into view and fills the fixed server-rendered layout in place. Cached in memory for 5 minutes.
 */

import { countUp } from '~/lib/motion/count-up';
import { barHeights, countParts, formatTokens, formatUsd } from '~/lib/token-burn-format';

type Payload =
  | {
      available: true;
      today: { date: string; tokens: number; costUsd: number };
      days: { date: string; tokens: number }[];
      month: { tokens: number; costUsd: number };
      allTime: { tokens: number; costUsd: number };
      models: { model: string; share: number }[];
    }
  | { available: false };

const CACHE_MS = 5 * 60_000;

let cached: { at: number; data: Payload } | undefined;
let inflight: Promise<Payload> | undefined;
let observer: IntersectionObserver | undefined;

function load(): Promise<Payload> {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.data);
  inflight ??= fetch('/api/token-burn', { headers: { accept: 'application/json' } })
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as Payload;
      const data: Payload =
        body?.available === true && Array.isArray(body.days) && Array.isArray(body.models)
          ? body
          : { available: false };
      cached = { at: Date.now(), data }; // only a real answer is cached; a network blip retries next visit
      return data;
    })
    .catch((): Payload => ({ available: false }))
    .finally(() => {
      inflight = undefined;
    });
  return inflight;
}

/** Sets the formatted token text and replays it from 0 once (no-op under reduced motion). */
function setTokens(el: HTMLElement | null, tokens: number): void {
  if (!el) return;
  const text = formatTokens(tokens);
  el.textContent = text;
  const parts = countParts(text);
  if (parts && parts.value > 0) countUp(el, parts.value, { decimals: parts.decimals, suffix: parts.suffix });
}

function render(card: HTMLElement, data: Payload): void {
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => card.querySelector<T>(selector);
  const bars = $('[data-burn-bars]');
  const barEls = bars ? Array.from(bars.querySelectorAll<HTMLElement>('i')) : [];
  const legend = $('[data-burn-legend]');
  const empty = $('[data-burn-empty]');
  const today = $('[data-burn-today]');
  const cost = $('[data-burn-cost]');
  const month = $('[data-burn-month]');
  const allTime = $('[data-burn-alltime]');

  if (!data.available) {
    if (today) today.textContent = '–';
    if (cost) cost.textContent = '';
    if (month) month.textContent = '–';
    if (allTime) allTime.textContent = '–';
    for (const bar of barEls) bar.removeAttribute('title');
    bars?.setAttribute('aria-label', 'No Claude Code usage data for the last 14 days');
    if (legend) legend.hidden = true;
    if (empty) empty.hidden = false;
    card.dataset.state = 'empty';
    card.removeAttribute('aria-busy');
    return;
  }

  const heights = barHeights(data.days.map((d) => d.tokens));
  barEls.forEach((bar, i) => {
    const day = data.days[i];
    bar.style.setProperty('--h', ((heights[i] ?? 0) / 100).toFixed(3));
    if (day) bar.title = `${day.date}: ${day.tokens.toLocaleString('en-US')} tokens`;
  });
  bars?.setAttribute(
    'aria-label',
    `Claude Code tokens per day over the last 14 days; today ${formatTokens(data.today.tokens)}`
  );

  // Model split (month to date): fixed slots, unused ones collapse to 0 width and hide.
  card.querySelectorAll<HTMLElement>('[data-burn-split] [data-slot]').forEach((seg, i) => {
    seg.style.setProperty('--w', `${data.models[i]?.share ?? 0}%`);
  });
  card.querySelectorAll<HTMLElement>('[data-burn-legend] [data-slot]').forEach((item, i) => {
    const model = data.models[i];
    item.hidden = !model;
    const name = item.querySelector<HTMLElement>('[data-name]');
    const pct = item.querySelector<HTMLElement>('[data-pct]');
    if (name) name.textContent = model?.model ?? '';
    if (pct) pct.textContent = model ? `${model.share}%` : '';
  });
  if (legend) legend.hidden = data.models.length === 0;
  if (empty) empty.hidden = true;

  if (cost) cost.textContent = formatUsd(data.today.costUsd);
  if (cost)
    cost.title = `Estimated at API prices. Today: ${formatUsd(data.today.costUsd)}; this month: ${formatUsd(data.month.costUsd)}; all-time: ${formatUsd(data.allTime.costUsd)}`;
  // A zero month is real data but nothing is burning: keep the cost pill, skip the flicker and grow-in.
  if (data.month.tokens === 0) card.dataset.quiet = 'true';
  else delete card.dataset.quiet;
  card.dataset.state = 'ready';
  card.removeAttribute('aria-busy');
  setTokens(today, data.today.tokens);
  setTokens(month, data.month.tokens);
  setTokens(allTime, data.allTime.tokens);
}

export function mountTokenBurn(): void {
  unmountTokenBurn();
  const card = document.querySelector<HTMLElement>('[data-token-burn]');
  if (!card || card.dataset.bound === 'true') return;
  card.dataset.bound = 'true';

  const show = () => load().then((data) => card.isConnected && render(card, data));

  if (cached && Date.now() - cached.at < CACHE_MS) {
    render(card, cached.data);
    return;
  }
  if (typeof IntersectionObserver === 'undefined') {
    show();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      observer = undefined;
      show();
    },
    { rootMargin: '100px' }
  );
  observer.observe(card);
}

export function unmountTokenBurn(): void {
  observer?.disconnect();
  observer = undefined;
}
