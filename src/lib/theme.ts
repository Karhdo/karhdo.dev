/**
 * Client-side theme preference, shared by the header ThemeToggle (task 09) and the ⌘K palette (task 23).
 *
 * `localStorage.theme` holds the preference (`light | dark | system`); `<html data-theme>` holds the
 * resolved scheme and is written by `window.__theme.apply()` (ThemeScript.astro). `setTheme` also
 * syncs every `[data-theme-toggle]` button and dispatches `theme-change` ({ detail: { dark } }).
 */
export type ThemePref = 'light' | 'dark' | 'system';

/** Toggle cycle: light → dark → system → light. */
export const NEXT_THEME: Record<ThemePref, ThemePref> = { light: 'dark', dark: 'system', system: 'light' };

/** Stored preference; `system` when absent, invalid or storage is blocked. */
export function getTheme(): ThemePref {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

/** The scheme a preference resolves to right now. */
export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  return pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';
}

/** Reflects a preference on a header toggle button (icon + label naming the next step). */
export function renderThemeToggle(button: HTMLElement, pref: ThemePref): void {
  button.dataset.pref = pref;
  button.setAttribute('aria-label', `Switch to ${NEXT_THEME[pref]} theme`);
}

/** Stores and applies a preference, syncs the toggles and notifies listeners (Giscus). */
export function setTheme(pref: ThemePref): void {
  try {
    localStorage.setItem('theme', pref);
  } catch {
    // Storage blocked: still switch for this page view.
  }
  window.__theme?.apply();
  const root = document.documentElement;
  const resolved = resolveTheme(pref);
  if (root.dataset.theme !== resolved) root.dataset.theme = resolved;
  for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) renderThemeToggle(button, pref);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { dark: resolved === 'dark' } }));
}

// View transitions must not overlap a ClientRouter navigation (the reveal would fight the page swap).
let navigating = false;
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-preparation', () => {
    navigating = true;
  });
  for (const type of ['astro:after-swap', 'astro:page-load']) {
    document.addEventListener(type, () => {
      navigating = false;
    });
  }
}

/** Centre of an element, else of the header theme toggle, else of the viewport. */
function revealOrigin(origin?: Element | null): { x: number; y: number } {
  const el = origin ?? document.querySelector('[data-theme-toggle]');
  const rect = el?.getBoundingClientRect();
  if (rect && rect.width > 0) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

/**
 * `setTheme` with the circular reveal (task 09): with View Transitions and motion allowed, and only
 * when the resolved scheme changes, the new theme grows as a circle from `origin` (default: the header
 * toggle). The reveal CSS is scoped to `html[data-theme-switching]` (ThemeToggle.astro).
 */
export function switchTheme(pref: ThemePref, origin?: Element | null): void {
  const root = document.documentElement;
  const changesColours = resolveTheme(pref) !== root.dataset.theme;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!changesColours || !document.startViewTransition || reduce || navigating) {
    setTheme(pref);
    return;
  }

  const { x, y } = revealOrigin(origin);
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  root.dataset.themeSwitching = '';
  try {
    const transition = document.startViewTransition(() => setTheme(pref));
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }
        );
      })
      .catch(() => {});
    transition.finished.catch(() => {}).finally(() => delete root.dataset.themeSwitching);
  } catch {
    delete root.dataset.themeSwitching;
    setTheme(pref);
  }
}
