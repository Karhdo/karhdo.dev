/**
 * `GET /api/github?repo=owner/name` (task 20): v1 API parity (repo data + last commit). Missing
 * `repo` → 400; `'undefined'`/`'null'` → `null` (v1); `repo` must be `owner/name` (400) and one of the
 * site's own repos (403), so the token can't be used as an open proxy. CDN-cached.
 */
import type { APIRoute } from 'astro';
import { PROJECTS } from '~/config/projects';
import { SITE } from '~/config/site';
import { parseRepoParam } from '~/lib/github-repo';
import { fetchRepoData } from '~/lib/services/github';

export const prerender = false;

const CACHE_OK = 'public, s-maxage=600, stale-while-revalidate=3600';
/** Upstream failures and rejections: cache briefly so a burst doesn't hit GitHub, but recover fast. */
const CACHE_SHORT = 'public, s-maxage=60';

const ALLOWED = [SITE.siteRepo, ...PROJECTS.flatMap((project) => (project.repo ? [project.repo] : []))];

const json = (body: unknown, status: number, cache: string) =>
  Response.json(body, { status, headers: { 'Cache-Control': cache } });

export const GET: APIRoute = async ({ url }) => {
  const param = parseRepoParam(url.searchParams.get('repo'), ALLOWED);
  switch (param.kind) {
    case 'missing':
      return json({ message: 'Missing repo parameter' }, 400, CACHE_SHORT);
    case 'nullish':
      return json(null, 200, CACHE_OK);
    case 'invalid':
      return json({ message: 'Invalid repo parameter' }, 400, CACHE_SHORT);
    case 'forbidden':
      return json({ message: 'Repository not allowed' }, 403, CACHE_SHORT);
  }
  const data = await fetchRepoData({ repo: param.repo, includeLastCommit: true });
  // v1 returned `null` (200) when GitHub failed; keep that, with a short cache.
  return json(data, 200, data ? CACHE_OK : CACHE_SHORT);
};
