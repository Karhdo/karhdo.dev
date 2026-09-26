import type { BuildInfo } from '~/lib/build-info';

declare global {
  interface Window {
    /** Set by the head theme script (ThemeScript.astro): re-resolves `localStorage.theme` onto `<html data-theme>`. */
    __theme?: { apply(): void };
  }

  /** Vite `define` from `astro.config.mjs` (scripts/build-info.mjs); undefined outside Vite (bun test). */
  const __BUILD_INFO__: BuildInfo | undefined;
}
