/**
 * Token burn card script (task 31, bundled; no React). Fetches `GET /api/token-burn` once when the card
 * scrolls into view and fills the server-rendered markup in place (fixed layout, so no layout shift).
 * The response is kept in a module variable for 5 minutes, so view-transition navigations back to the
 * homepage render straight away. Only the pure formatters are imported, never the server fetch code.
 */
import { barHeights, countParts, formatTokens, formatUsd } from '~/lib/anthropic-usage-format';
import { countUp } from '~/lib/motion/count-up';

type Payload =
  | {
      available: true;
      today: { date: string; tokens: number; costUsd: number };
      days: { date: string; tokens: number }[];
      month: { tokens: number; costUsd: number };
      split: { cache: number; input: number; output: number };
    }
  | { available: false };

const CACHE_MS = 5 * 60_000;
const SPLIT_KEYS = ['cache', 'input', 'output'] as const;

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
        body?.available === true && Array.isArray(body.days) && body.split ? body : { available: false };
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

  if (!data.available) {
    if (today) today.textContent = '–';
    if (cost) cost.textContent = '';
    if (month) month.textContent = '–';
    for (const bar of barEls) bar.removeAttribute('title');
    bars?.setAttribute('aria-label', 'No API usage data for the last 14 days');
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
    if (day) bar.title = `${day.date} UTC: ${day.tokens.toLocaleString('en-US')} tokens`;
  });
  bars?.setAttribute(
    'aria-label',
    `Tokens per day over the last 14 days, UTC; today ${formatTokens(data.today.tokens)}`
  );

  for (const key of SPLIT_KEYS) {
    const pct = data.split[key];
    card.querySelector<HTMLElement>(`[data-burn-split] [data-part="${key}"]`)?.style.setProperty('--w', `${pct}%`);
    const label = card.querySelector<HTMLElement>(`[data-burn-pct="${key}"]`);
    if (label) label.textContent = `${pct}%`;
  }
  if (legend) legend.hidden = false;
  if (empty) empty.hidden = true;

  if (cost) cost.textContent = formatUsd(data.today.costUsd);
  if (cost)
    cost.title = `Cost today (UTC): ${formatUsd(data.today.costUsd)}; this month: ${formatUsd(data.month.costUsd)}`;
  // A zero month is real data but nothing is burning: keep the cost pill, skip the flicker and grow-in.
  if (data.month.tokens === 0) card.dataset.quiet = 'true';
  else delete card.dataset.quiet;
  card.dataset.state = 'ready';
  card.removeAttribute('aria-busy');
  setTokens(today, data.today.tokens);
  setTokens(month, data.month.tokens);
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
