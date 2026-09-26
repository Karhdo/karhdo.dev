// @ts-check
/**
 * Resolves the footer statusline's build-time facts (task 09). Called ONLY from astro.config.mjs at
 * build/dev start; the result is baked in with the Vite `define` `__BUILD_INFO__`, so no function
 * ever runs git or calls GitHub at runtime. Every git/network call is guarded: the build never fails
 * because of build info, the affected segment is just hidden.
 */
import { execFileSync } from 'node:child_process';

const REPO = 'Karhdo/karhdo.dev';
const TIMEOUT_MS = 5000;

/** @param {string[]} args */
function git(args) {
  try {
    const out = execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: TIMEOUT_MS,
    });
    return out.trim() || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} path
 * @param {string | undefined} token
 */
async function github(path, token) {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'karhdo.dev-build',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ githubToken?: string; network?: boolean }} [options] `network: false` (dev, check) skips GitHub:
 *   git-only facts, no stars.
 * @returns {Promise<import('../src/lib/build-info').BuildInfo>}
 */
export async function resolveBuildInfo({ githubToken, network = true } = {}) {
  const env = process.env;
  const sha = env.VERCEL_GIT_COMMIT_SHA || git(['rev-parse', 'HEAD']);
  const branch = env.VERCEL_GIT_COMMIT_REF || git(['branch', '--show-current']) || 'main';

  let committedAt = sha ? git(['log', '-1', '--format=%cI', sha]) : null;
  const [commit, repo] = await Promise.all([
    network && sha && !committedAt ? github(`/repos/${REPO}/commits/${sha}`, githubToken) : null,
    network ? github(`/repos/${REPO}`, githubToken) : null,
  ]);
  if (!committedAt && typeof commit?.commit?.committer?.date === 'string') committedAt = commit.commit.committer.date;
  const stars = typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : null;

  const info = { sha: sha || null, shortSha: sha ? sha.slice(0, 7) : null, committedAt, branch, stars };
  console.log(
    `[build-info] branch=${info.branch} sha=${info.shortSha ?? '∅'} committedAt=${info.committedAt ?? '∅'} stars=${info.stars ?? '∅'}`
  );
  return info;
}
