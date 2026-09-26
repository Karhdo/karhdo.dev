/**
 * Live statusline values (task 09): the HCMC clock + "same time / Nh ahead / Nh behind" relative to
 * the visitor, and the commit age. Ticks every 30 s, skips ticks while the tab is hidden (catching
 * up when it becomes visible), and stops on `astro:before-swap`.
 */
import { SITE } from '~/config/site';
import { describeOffset, formatHcmTime, getZoneOffsetMinutes } from '~/lib/utils/local-time';
import { formatRelative } from '~/lib/utils/relative-time';

const TICK_MS = 30_000;
let timer: ReturnType<typeof setInterval> | undefined;

function tick(): void {
  const now = new Date();
  const time = formatHcmTime(now, SITE.timezone);
  const diff = `· ${describeOffset(-now.getTimezoneOffset(), getZoneOffsetMinutes(now, SITE.timezone))}`;
  for (const el of document.querySelectorAll<HTMLTimeElement>('[data-hcm-time]')) {
    el.textContent = time;
    el.dateTime = now.toISOString();
  }
  for (const el of document.querySelectorAll('[data-hcm-diff]')) el.textContent = diff;
  for (const el of document.querySelectorAll<HTMLElement>('[data-committed-at]')) {
    const relative = formatRelative(el.dataset.committedAt ?? '', now);
    if (relative) el.textContent = `· committed ${relative}`;
  }
}

function stop(): void {
  clearInterval(timer);
  timer = undefined;
}

function start(): void {
  stop();
  if (!document.querySelector('[data-hcm-time]')) return;
  tick();
  timer = setInterval(() => {
    if (!document.hidden) tick();
  }, TICK_MS);
}

document.addEventListener('astro:page-load', start);
document.addEventListener('astro:before-swap', stop);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && timer !== undefined) tick();
});
