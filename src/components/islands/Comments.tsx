import Giscus from '@giscus/react';
import { useEffect, useState } from 'react';
import { GISCUS } from '~/config/site';
import { giscusThemePath } from '~/lib/giscus-theme';

export interface CommentsProps {
  repo?: string;
  repoId?: string;
  category?: string;
  categoryId?: string;
}

type Repo = `${string}/${string}`;

const isRepo = (value: string): value is Repo => /^[\w.-]+\/[\w.-]+$/.test(value);

/** Resolved site scheme: `<html data-theme>` (ThemeScript.astro), else the OS preference. */
function readDark(): boolean {
  const theme = document.documentElement.dataset.theme;
  if (theme === 'dark' || theme === 'light') return theme === 'dark';
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Absolute URL of the Tokyonight Giscus theme served from `/static/giscus/` (Giscus needs absolute URLs).
 * In `astro dev` the giscus.app iframe cannot fetch it (Chrome blocks public → localhost requests,
 * and Vite answers the private-network CORS preflight without `Access-Control-Allow-Origin`), so dev
 * uses the v1 built-in themes instead.
 */
const giscusTheme = (dark: boolean) =>
  import.meta.env.DEV ? (dark ? GISCUS.darkTheme : GISCUS.theme) : new URL(giscusThemePath(dark), location.origin).href;

/**
 * Giscus comments (v1 `components/ui/Comments.tsx`), hydrated `client:visible` by PostComments.astro.
 * Discussions stay mapped by page title (v1 `mapping: 'title'`, same `<title>` template).
 *
 * The theme follows the site live without remounting: a new `theme` prop makes the Giscus web
 * component post `{ giscus: { setConfig: { theme } } }` to the iframe. Listens to `theme-change`
 * (toggle, incl. the circular reveal) and observes `data-theme` (OS change under "system",
 * `astro:after-swap`).
 */
export default function Comments({ repo = '', repoId, category, categoryId }: CommentsProps) {
  // null until mounted: the theme URL needs `location`, and SSR renders nothing anyway.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setDark(readDark());
    sync();
    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: boolean }>).detail;
      setDark(typeof detail?.dark === 'boolean' ? detail.dark : readDark());
    };
    window.addEventListener('theme-change', onThemeChange);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      window.removeEventListener('theme-change', onThemeChange);
      observer.disconnect();
    };
  }, []);

  if (!isRepo(repo) || !repoId || !category || !categoryId) {
    return import.meta.env.DEV ? <p className="text-fg-soft text-sm">Comments are not configured.</p> : null;
  }

  // Always render the wrapper: `client:visible` observes the island's children, so an empty SSR
  // output would never hydrate. The min-height matches the Giscus iframe's and limits layout shift.
  return (
    <div className="min-h-[150px]">
      {dark !== null && (
        <Giscus
          id="comments-container"
          repo={repo}
          repoId={repoId}
          category={category}
          categoryId={categoryId}
          mapping={GISCUS.mapping}
          reactionsEnabled={GISCUS.reactions}
          emitMetadata={GISCUS.metadata}
          inputPosition={GISCUS.inputPosition}
          theme={giscusTheme(dark)}
          lang={GISCUS.lang}
          loading="lazy"
        />
      )}
    </div>
  );
}
