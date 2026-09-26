/**
 * Build-time repo facts for the footer statusline (task 09): commit sha/date, branch and star count.
 *
 * Resolved once by `scripts/build-info.mjs` inside `astro.config.mjs` and baked in through the Vite
 * `define` `__BUILD_INFO__` (declared in `src/env.d.ts`), so nothing runs git or calls GitHub at
 * runtime. Under `bun test` the define does not exist, hence the `typeof` guard and the fallback.
 */
export type BuildInfo = {
  sha: string | null;
  shortSha: string | null;
  committedAt: string | null;
  branch: string;
  stars: number | null;
};

export const FALLBACK_BUILD_INFO: BuildInfo = {
  sha: null,
  shortSha: null,
  committedAt: null,
  branch: 'main',
  stars: null,
};

export const BUILD_INFO: BuildInfo = typeof __BUILD_INFO__ !== 'undefined' ? __BUILD_INFO__ : FALLBACK_BUILD_INFO;
