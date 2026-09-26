/**
 * Wordmark motion (task 09, mockup "wordmark: decode on load, wave on hover"). Vanilla, no React.
 *
 * - Decode: header only, once per browser session (`sessionStorage['wm-decoded']`, at most once per
 *   page load if storage throws), never on ClientRouter navigations (the header is persisted and
 *   each element is bound once via `data-wm-bound`).
 * - Wave: on pointerenter/focus of any wordmark, header and footer.
 * Nothing runs under `prefers-reduced-motion: reduce`.
 */

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789<>/_#$%&*';
const SETTLE_BASE_MS = 180;
const SETTLE_STEP_MS = 55;
const SAFETY_MARGIN_MS = 400;

let decodeClaimed = false;

/** True the first time it is called in this session (or page load, when storage is unavailable). */
function claimDecode(): boolean {
  if (decodeClaimed) return false;
  decodeClaimed = true;
  try {
    if (sessionStorage.getItem('wm-decoded')) return false;
    sessionStorage.setItem('wm-decoded', '1');
  } catch {
    // Storage blocked: the module-level flag limits it to once per page load.
  }
  return true;
}

function decode(brand: HTMLElement): void {
  const chars = Array.from(brand.querySelectorAll<HTMLElement>('.ch'));
  const finals = chars.map((c) => c.textContent ?? '');
  // Lock each glyph box to its final width so the proportional font doesn't jitter.
  const widths = chars.map((c) => c.getBoundingClientRect().width);
  chars.forEach((c, i) => {
    c.style.width = `${widths[i]}px`;
  });

  let finished = false;
  const restore = () => {
    finished = true;
    clearTimeout(safety);
    chars.forEach((c, i) => {
      c.textContent = finals[i] ?? '';
      c.classList.remove('scr');
      c.style.removeProperty('width');
    });
  };
  // Safety net: always land on the real text, even when rAF is throttled or never fires.
  const safety = setTimeout(restore, SETTLE_BASE_MS + chars.length * SETTLE_STEP_MS + SAFETY_MARGIN_MS);

  // Wall-clock timing (not the rAF timestamp), so a late frame can't outlive the safety net.
  const t0 = performance.now();
  const step = () => {
    if (finished) return;
    const elapsed = performance.now() - t0;
    let done = true;
    chars.forEach((c, i) => {
      if (elapsed < SETTLE_BASE_MS + i * SETTLE_STEP_MS) {
        done = false;
        c.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '';
        c.classList.add('scr');
      } else if (c.classList.contains('scr') || c.textContent !== finals[i]) {
        c.textContent = finals[i] ?? '';
        c.classList.remove('scr');
      }
    });
    if (done) restore();
    else requestAnimationFrame(step);
  };
  step();
}

function wave(brand: HTMLElement): void {
  brand.classList.remove('wave');
  void brand.offsetWidth; // restart the animation
  brand.classList.add('wave');
}

export function initWordmarks(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const brand of document.querySelectorAll<HTMLElement>('[data-wm]')) {
    if (brand.dataset.wmBound) continue;
    brand.dataset.wmBound = '';
    if (brand.dataset.wm === 'header' && claimDecode()) decode(brand);
    brand.addEventListener('pointerenter', () => wave(brand));
    brand.addEventListener('focus', () => wave(brand));
    brand.addEventListener('animationend', (event) => {
      if (event.target === brand.querySelector('.ch:last-child')) brand.classList.remove('wave');
    });
  }
}
