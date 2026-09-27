/**
 * Lazily imported by CommandPaletteLoader.astro on the first open: this module (and everything it
 * imports: React, react-dom, cmdk, the palette CSS) is its own Vite chunk. One root per page life;
 * `#cmdk-root` is `transition:persist`ed, so the root survives ClientRouter navigations.
 */
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import CommandPalette from './CommandPalette';
import type { PaletteData } from './palette-data';
import './palette.css';

let root: Root | undefined;

export function mountPalette(el: HTMLElement, data: PaletteData, opener: HTMLElement | null): void {
  if (root) return;
  root = createRoot(el);
  root.render(
    <StrictMode>
      <CommandPalette data={data} initialOpener={opener} />
    </StrictMode>
  );
}
