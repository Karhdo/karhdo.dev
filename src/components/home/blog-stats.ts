/**
 * Blog stats card script (task 30, bundled; no React). Fetches `GET /api/stats/summary` once when the
 * card nears the viewport and replaces the server-rendered skeleton with the same fixed-height rows
 * (views head 34, chart 56, bar 6, legend 20, most read 48), so no state shifts the layout.
 *
 * The chart is drawn at its measured pixel width (and updated in place on resize) instead of a
 * stretched `viewBox="0 0 300 56"` + `preserveAspectRatio="none"`: Chrome applies the dashes of a
 * `non-scaling-stroke` line in screen space, so a user-space `--len` stopped the draw-in short, and a
 * stretched circle turns into an ellipse. Unscaled, `--len` is exact and the dot stays round.
 */
import { emojiCodepoint, emojiSrc, TWEMOJI_SIZE_CLASS } from '~/lib/emoji';
import { formatCount, observeCounts } from '~/lib/motion/count-up';
import { REACTIONS } from '~/lib/stats/reactions';
import {
  type BlogStatsSummary,
  buildAreaPath,
  compactParts,
  formatCompact,
  reactionShares,
  unavailableSummary,
} from '~/lib/stats/summary';

const CHART_HEIGHT = 56;
const CACHE_MS = 5 * 60_000;

const BAR_COLOR = { loves: 'var(--red)', applauses: 'var(--orange)', ideas: 'var(--cyan)', bullseye: 'var(--green)' };

let cached: { at: number; data: BlogStatsSummary } | undefined;
let inflight: Promise<BlogStatsSummary> | undefined;
let observer: IntersectionObserver | undefined;
let resizer: ResizeObserver | undefined;

const esc = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function isSummary(value: unknown): value is BlogStatsSummary {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { posts?: unknown }).posts === 'number' &&
    Array.isArray((value as { series?: unknown }).series)
  );
}

function load(): Promise<BlogStatsSummary> {
  if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.data);
  inflight ??= fetch('/api/stats/summary', {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
    .then(async (res) => {
      // 503 / 500 still carry a summary (`views: null`), so the card can show the post count.
      const body: unknown = await res.json().catch(() => undefined);
      if (!isSummary(body)) throw new Error(String(res.status));
      if (res.ok) cached = { at: Date.now(), data: body }; // an error answer retries on the next visit
      return body;
    })
    .catch(() => unavailableSummary(0))
    .finally(() => {
      inflight = undefined;
    });
  return inflight;
}

/** A counter: the final text is rendered; `data-count` / `data-dec` / `data-suffix` replay it from 0. */
function compactCount(value: number): string {
  const { value: n, decimals, suffix } = compactParts(value);
  return `<b data-count="${n}"${decimals ? ` data-dec="${decimals}"` : ''}${suffix ? ` data-suffix="${esc(suffix)}"` : ''}>${formatCompact(value)}</b>`;
}

function deltaHtml(delta: BlogStatsSummary['delta']): string {
  if (!delta) return '';
  const arrow = delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '●';
  const said = delta.direction === 'flat' ? 'unchanged' : delta.direction;
  return `<span class="delta" data-direction="${delta.direction}"><span aria-hidden="true">${arrow}</span> <span class="sr-only">${said} vs. the previous 30 days: </span>${delta.pct}%</span>`;
}

function chartHtml(data: BlogStatsSummary): string {
  if (data.points >= 2) {
    const views = data.series.map((p) => p.views);
    const label = `Daily views over the last ${data.points} days: min ${formatCount(Math.min(...views))}, max ${formatCount(Math.max(...views))}`;
    // Geometry is filled by `drawChart` once the width is known.
    return `<div class="bs-chart" data-bs-chart><svg class="area" role="img" aria-label="${esc(label)}">
<defs><linearGradient id="bs-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--blue)" stop-opacity="0.35"/><stop offset="1" stop-color="var(--blue)" stop-opacity="0"/></linearGradient></defs>
<line class="grid" x1="0" y1="4" y2="4"/><line class="grid" x1="0" y1="35" y2="35"/><line class="grid" x1="0" y1="66" y2="66"/>
<path class="fill" fill="url(#bs-grad)"/><path class="line"/><circle class="dot" r="3.5"/></svg></div>`;
  }
  const note =
    data.views !== null
      ? `Collecting daily stats${data.since ? ` since ${shortDate(data.since)}` : ''}`
      : data.posts > 0
        ? `Live stats unavailable · ${data.posts} ${data.posts === 1 ? 'post' : 'posts'} published`
        : 'Live stats unavailable';
  return `<div class="bs-chart bs-note"><span>${esc(note)}</span></div>`;
}

function emojiHtml(name: string): string {
  const codepoint = emojiCodepoint(name);
  return codepoint
    ? `<img src="${emojiSrc(codepoint)}" alt="" width="36" height="36" decoding="async" class="twemoji inline-block ${TWEMOJI_SIZE_CLASS.base}">`
    : '';
}

/** The card body for a summary (pure string building; exported for tests). */
export function bodyHtml(data: BlogStatsSummary): string {
  const { reactions, mostRead } = data;
  const shares = reactions ? reactionShares(reactions) : null;
  const barLabel = reactions
    ? `Reactions: ${REACTIONS.map(({ key }) => `${formatCount(reactions[key])} ${key}`).join(', ')}`
    : 'Reactions unavailable';
  const bar = shares
    ? REACTIONS.filter(({ key }) => shares[key] > 0)
        .map(({ key }) => `<span style="--w: ${shares[key]}%; --c: ${BAR_COLOR[key]}"></span>`)
        .join('')
    : '';
  const legend = REACTIONS.map(
    ({ key, emoji }) =>
      `<span>${emojiHtml(emoji)} ${reactions ? `<b data-count="${reactions[key]}">${formatCount(reactions[key])}</b>` : '<b>—</b>'}</span>`
  ).join('');
  const most = mostRead
    ? `<a class="most-read" href="${esc(mostRead.url)}"><span class="mr-e">Most read</span><span class="mr-t">${esc(mostRead.title)}</span><span class="mr-v">${formatCompact(mostRead.views)}<span class="sr-only"> views</span></span></a>`
    : '<div class="most-read"><span class="mr-e">Most read</span><span class="mr-t">—</span><span class="mr-v"></span></div>';

  return `<div class="views-head"><div class="big">${data.views === null ? '<b>—</b>' : compactCount(data.views)}<span>total views</span></div>${deltaHtml(data.delta)}</div>
${chartHtml(data)}
<div class="react-bar" role="img" aria-label="${esc(barLabel)}">${bar}</div>
<div class="react-legend" aria-hidden="true">${legend}</div>
${most}`;
}

/** Sets the chart geometry for its current pixel width (in place, so the draw-in never replays). */
function drawChart(box: HTMLElement, data: BlogStatsSummary): void {
  // clientWidth is the layout width: getBoundingClientRect would include the `.rise` scale and tilt.
  const width = Math.max(1, box.clientWidth);
  const path = buildAreaPath(data.series, width, CHART_HEIGHT);
  const svg = box.querySelector('svg');
  if (!path || !svg) return;
  svg.setAttribute('viewBox', `0 0 ${width} ${CHART_HEIGHT}`);
  for (const line of svg.querySelectorAll('.grid')) line.setAttribute('x2', String(width));
  svg.querySelector('.fill')?.setAttribute('d', path.fill);
  const line = svg.querySelector<SVGPathElement>('.line');
  line?.setAttribute('d', path.line);
  line?.style.setProperty('--len', String(path.length));
  svg.querySelector('.dot')?.setAttribute('cx', String(path.end.x));
  svg.querySelector('.dot')?.setAttribute('cy', String(path.end.y));
}

function render(root: HTMLElement, data: BlogStatsSummary): void {
  root.innerHTML = bodyHtml(data);
  root.removeAttribute('aria-busy');
  const box = root.querySelector<HTMLElement>('[data-bs-chart]');
  if (box) {
    drawChart(box, data);
    resizer?.disconnect();
    resizer = new ResizeObserver(() => drawChart(box, data));
    resizer.observe(box);
  }
  // Pin each counter to its final width, so the narrower count-up frames never move the
  // "total views" label or the space-between legend (no layout shift while counting).
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.offsetWidth}px`; // layout width, unaffected by the card's scale / tilt
  }
  observeCounts(root);
}

export function mountBlogStats(): void {
  unmountBlogStats();
  const root = document.querySelector<HTMLElement>('[data-blog-stats]');
  if (!root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  const show = () => load().then((data) => root.isConnected && render(root, data));
  if (cached && Date.now() - cached.at < CACHE_MS) {
    render(root, cached.data);
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
  observer.observe(root);
}

export function unmountBlogStats(): void {
  observer?.disconnect();
  observer = undefined;
  resizer?.disconnect();
  resizer = undefined;
}
