/**
 * Pure helpers for GitHub repo data (task 20): the `/api/github` repo allowlist (so the token can't
 * be used as an open proxy) and Tokyonight tones for language dots (GitHub's language colours are
 * brand hexes, which the palette rule forbids).
 */
import { techIcon } from '~/components/projects/tech';

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
/** `.` / `..` segments are never valid GitHub names. */
const DOT_SEGMENT = /(^|\/)\.+(\/|$)/;
const isRepo = (value: string) => REPO_PATTERN.test(value) && !DOT_SEGMENT.test(value);

/** `https://github.com/Owner/name(.git)` or `Owner/name` → `owner/name` (lower case), else null. */
export function normalizeRepo(value: string): string | null {
  const trimmed = value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/$/, '');
  return isRepo(trimmed) ? trimmed.toLowerCase() : null;
}

export type RepoParam =
  | { kind: 'missing' }
  | { kind: 'nullish' }
  | { kind: 'invalid' }
  | { kind: 'forbidden' }
  | { kind: 'ok'; repo: string };

/**
 * Classifies the `repo` query param (v1 parity: missing → 400, `'undefined'`/`'null'` → `null`),
 * then requires `owner/name` and membership of `allowed` (case-insensitive). `ok.repo` keeps the
 * caller's casing.
 */
export function parseRepoParam(value: string | null, allowed: Iterable<string>): RepoParam {
  if (!value) return { kind: 'missing' };
  if (value === 'undefined' || value === 'null') return { kind: 'nullish' };
  if (!isRepo(value)) return { kind: 'invalid' };
  const allow = new Set<string>();
  for (const entry of allowed) {
    const normalized = normalizeRepo(entry);
    if (normalized) allow.add(normalized);
  }
  return allow.has(value.toLowerCase()) ? { kind: 'ok', repo: value } : { kind: 'forbidden' };
}

/** Tokyonight token name (theme.css) for a GitHub language dot. */
export type LanguageTone =
  | 'blue'
  | 'blue1'
  | 'cyan'
  | 'fg'
  | 'fg-soft'
  | 'green'
  | 'orange'
  | 'purple'
  | 'red'
  | 'teal'
  | 'yellow';

/** Languages without a `tech.ts` entry. Anything that is in `tech.ts` takes its chip tone from there. */
const LANGUAGE_TONES: Record<string, LanguageTone> = {
  html: 'orange',
  css: 'purple',
  scss: 'purple',
  less: 'blue1',
  blade: 'red',
  vue: 'green',
  shell: 'green',
  mdx: 'yellow',
};

/**
 * Same tone as the project's tech chips (`src/components/projects/tech.ts`) when the language is
 * there, then the table above, else `--fg-soft`.
 */
export function languageTone(name: string): LanguageTone {
  const chipTone = techIcon(name)?.tone.replace(/^text-/, '') as LanguageTone | undefined;
  return chipTone ?? LANGUAGE_TONES[name.toLowerCase()] ?? 'fg-soft';
}
