import { describe, expect, test } from 'bun:test';
import { languageTone, normalizeRepo, parseRepoParam } from './github-repo';

const ALLOWED = ['Karhdo/karhdo.dev', 'https://github.com/Karhdo/geometry-simulation', 'Karhdo/Website-Selling-Food'];

describe('normalizeRepo', () => {
  test('accepts owner/name and GitHub URLs', () => {
    expect(normalizeRepo('Karhdo/karhdo.dev')).toBe('karhdo/karhdo.dev');
    expect(normalizeRepo('https://github.com/Karhdo/karhdo.dev')).toBe('karhdo/karhdo.dev');
    expect(normalizeRepo('https://github.com/Karhdo/karhdo.dev.git')).toBe('karhdo/karhdo.dev');
  });
  test('rejects anything else', () => {
    expect(normalizeRepo('karhdo')).toBeNull();
    expect(normalizeRepo('a/b/c')).toBeNull();
    expect(normalizeRepo('https://gitlab.com/a/b')).toBeNull();
  });
});

describe('parseRepoParam', () => {
  test('missing → missing', () => {
    expect(parseRepoParam(null, ALLOWED)).toEqual({ kind: 'missing' });
    expect(parseRepoParam('', ALLOWED)).toEqual({ kind: 'missing' });
  });
  test("'undefined' / 'null' → nullish (v1 parity)", () => {
    expect(parseRepoParam('undefined', ALLOWED)).toEqual({ kind: 'nullish' });
    expect(parseRepoParam('null', ALLOWED)).toEqual({ kind: 'nullish' });
  });
  test('malformed → invalid', () => {
    for (const bad of ['karhdo', 'a/b/c', '../etc', 'a b/c', 'https://github.com/Karhdo/karhdo.dev']) {
      expect(parseRepoParam(bad, ALLOWED)).toEqual({ kind: 'invalid' });
    }
  });
  test('not in the allowlist → forbidden', () => {
    expect(parseRepoParam('torvalds/linux', ALLOWED)).toEqual({ kind: 'forbidden' });
  });
  test('allowed, case-insensitively, keeping the casing', () => {
    expect(parseRepoParam('karhdo/KARHDO.dev', ALLOWED)).toEqual({ kind: 'ok', repo: 'karhdo/KARHDO.dev' });
    expect(parseRepoParam('Karhdo/geometry-simulation', ALLOWED)).toEqual({
      kind: 'ok',
      repo: 'Karhdo/geometry-simulation',
    });
  });
});

describe('languageTone', () => {
  test('known languages map to fixed tones', () => {
    expect(languageTone('TypeScript')).toBe('blue');
    expect(languageTone('PHP')).toBe('purple');
  });
  test('matches the tech chip tones where they overlap', () => {
    expect(languageTone('JavaScript')).toBe('yellow');
    expect(languageTone('Astro')).toBe('orange');
    expect(languageTone('Vue')).toBe('green');
  });
  test('unknown languages fall back to fg-soft', () => {
    expect(languageTone('Zig')).toBe('fg-soft');
  });
});
