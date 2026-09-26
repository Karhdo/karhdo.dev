import { describe, expect, test } from 'bun:test';
import { assertAllowedOrigin, isAllowedOrigin, isAllowedRequest } from './origin';

const VERCEL = {
  VERCEL: '1',
  VERCEL_URL: 'karhdo-dev-abc123-karhdo.vercel.app',
  VERCEL_BRANCH_URL: 'karhdo-dev-git-v2-karhdo.vercel.app',
};

describe('isAllowedOrigin', () => {
  test('allows production (± www) and localhost:4321', () => {
    for (const origin of [
      'https://karhdo.dev',
      'https://www.karhdo.dev',
      'http://localhost:4321',
      'http://127.0.0.1:4321',
    ]) {
      expect(isAllowedOrigin(origin)).toBe(true);
    }
  });

  test('allows this deployment’s VERCEL_URL and VERCEL_BRANCH_URL on Vercel', () => {
    expect(isAllowedOrigin('https://karhdo-dev-abc123-karhdo.vercel.app', VERCEL)).toBe(true);
    expect(isAllowedOrigin('https://karhdo-dev-git-v2-karhdo.vercel.app', VERCEL)).toBe(true);
  });

  test('ignores VERCEL_URL when not running on Vercel', () => {
    expect(isAllowedOrigin('https://karhdo-dev-abc123-karhdo.vercel.app', { ...VERCEL, VERCEL: undefined })).toBe(
      false
    );
  });

  test('has no *.vercel.app wildcard and no suffix/prefix tricks', () => {
    for (const origin of [
      'https://evil.vercel.app',
      'https://karhdo.dev.evil.com',
      'https://evilkarhdo.dev',
      'http://karhdo.dev',
      'https://karhdo.dev:8443',
      'https://karhdo-dev-abc123-karhdo.vercel.app.evil.com',
      'null',
      '',
      'karhdo.dev',
      'https://karhdo.dev/path',
    ]) {
      expect(isAllowedOrigin(origin, VERCEL)).toBe(false);
    }
  });

  test('other localhost ports only in dev', () => {
    expect(isAllowedOrigin('http://localhost:4322')).toBe(false);
    expect(isAllowedOrigin('http://localhost:4322', { DEV: true })).toBe(true);
    expect(isAllowedOrigin('https://evil.com', { DEV: true })).toBe(false);
  });
});

describe('isAllowedRequest', () => {
  test('missing Origin is allowed for GET only', () => {
    expect(isAllowedRequest('GET', null)).toBe(true);
    expect(isAllowedRequest('POST', null)).toBe(false);
    expect(isAllowedRequest('POST', 'https://karhdo.dev')).toBe(true);
    expect(isAllowedRequest('GET', 'https://evil.vercel.app')).toBe(false);
  });
});

describe('assertAllowedOrigin', () => {
  test('returns a 403 response for a forbidden origin, undefined otherwise', async () => {
    const bad = new Request('https://karhdo.dev/api/stats', {
      method: 'POST',
      headers: { origin: 'https://evil.vercel.app' },
    });
    const res = assertAllowedOrigin(bad, {});
    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ message: 'Forbidden origin!' });

    const good = new Request('https://karhdo.dev/api/stats', {
      method: 'POST',
      headers: { origin: 'https://karhdo.dev' },
    });
    expect(assertAllowedOrigin(good, {})).toBeUndefined();
  });
});
