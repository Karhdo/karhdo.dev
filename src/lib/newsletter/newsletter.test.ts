import { describe, expect, mock, test } from 'bun:test';
import {
  BUTTONDOWN_API_BASE,
  type ButtondownClient,
  createButtondownClient,
  isValidIp,
  mapError,
} from './buttondown-client';
import { handleNewsletterPost, parseStatus, redirectLocation, safeReturnPath } from './handler';

const KEY = 'test-key-not-real';

function fakeFetch(status: number, body?: unknown) {
  return mock(async (_url: string | URL | Request, _init?: RequestInit) =>
    body === undefined ? new Response(null, { status }) : Response.json(body, { status })
  );
}

function clientWith(fetchImpl: ReturnType<typeof fakeFetch>) {
  const log = { warn: mock(() => {}) };
  const client = createButtondownClient({ apiKey: KEY, fetch: fetchImpl as unknown as typeof fetch, log });
  if (!client) throw new Error('expected a client');
  return { client, log };
}

describe('createButtondownClient', () => {
  test('returns null without a key', () => {
    expect(createButtondownClient({ apiKey: undefined })).toBeNull();
    expect(createButtondownClient({ apiKey: '   ' })).toBeNull();
  });

  test('POSTs the current API shape: Token auth, email_address, no type', async () => {
    const f = fakeFetch(201, { id: 'x', type: 'unactivated' });
    const { client } = clientWith(f);
    expect(await client.subscribe('a@example.com', { ipAddress: '203.0.113.7' })).toEqual({
      kind: 'subscribed',
      pending: true,
    });
    const [url, init] = f.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BUTTONDOWN_API_BASE}/subscribers`);
    expect(url).toBe('https://api.buttondown.com/v1/subscribers');
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toBe(`Token ${KEY}`);
    expect(headers.get('content-type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ email_address: 'a@example.com', ip_address: '203.0.113.7' });
  });

  test('regular subscriber (no double opt-in) is not pending', async () => {
    const { client } = clientWith(fakeFetch(201, { type: 'regular' }));
    expect(await client.subscribe('a@example.com')).toEqual({ kind: 'subscribed', pending: false });
  });

  test('drops a malformed ip_address', async () => {
    const f = fakeFetch(201, { type: 'regular' });
    const { client } = clientWith(f);
    await client.subscribe('a@example.com', { ipAddress: 'not an ip' });
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      email_address: 'a@example.com',
    });
    await client.subscribe('a@example.com', { ipAddress: '::1' });
    expect(JSON.parse(String((f.mock.calls[1] as [string, RequestInit])[1].body)).ip_address).toBe('::1');
  });

  test.each([
    [400, 'email_already_exists', 'already'],
    [400, 'subscriber_already_exists', 'already'],
    [409, undefined, 'already'],
    [400, 'email_invalid', 'invalid'],
    [400, 'email_empty', 'invalid'],
    [422, undefined, 'invalid'],
    [400, 'email_blocked', 'rejected'],
    [400, 'subscriber_blocked', 'rejected'],
    [400, 'subscriber_suppressed', 'rejected'],
    [400, 'ip_address_spammy', 'rejected'],
    [400, 'rate_limited', 'rate_limited'],
    [429, undefined, 'rate_limited'],
    [400, 'newsletter_not_accepting_subscribers', 'closed'],
    [401, undefined, 'upstream_error'],
    [403, 'feature_disabled', 'upstream_error'],
    [500, undefined, 'upstream_error'],
    [400, 'something_new', 'upstream_error'],
  ] as const)('maps %i %s → %s', async (status, code, kind) => {
    expect(mapError(status, code).kind).toBe(kind);
    const { client } = clientWith(fakeFetch(status, code ? { code, detail: 'x', metadata: {} } : undefined));
    expect((await client.subscribe('a@example.com')).kind).toBe(kind);
  });

  test('network failure → upstream_error, and the key is never logged', async () => {
    const f = mock(async () => {
      throw new TypeError('fetch failed');
    });
    const { client, log } = clientWith(f as unknown as ReturnType<typeof fakeFetch>);
    expect(await client.subscribe('a@example.com')).toEqual({ kind: 'upstream_error' });
    const logged = JSON.stringify(log.warn.mock.calls);
    expect(logged).toContain('fetch failed');
    expect(logged).not.toContain(KEY);
  });

  test('unexpected status is logged without the key', async () => {
    const { client, log } = clientWith(fakeFetch(401, { detail: 'bad token' }));
    await client.subscribe('a@example.com');
    const logged = JSON.stringify(log.warn.mock.calls);
    expect(logged).toContain('401');
    expect(logged).not.toContain(KEY);
  });
});

function stubClient(kind: Awaited<ReturnType<ButtondownClient['subscribe']>>) {
  return { subscribe: mock(async () => kind) };
}

describe('handleNewsletterPost', () => {
  test('invalid email → 400 without calling Buttondown', async () => {
    const client = stubClient({ kind: 'subscribed', pending: true });
    for (const input of [
      { email: 'bad' },
      { email: '' },
      {},
      null,
      'x',
      { email: 42 },
      { email: `${'a'.repeat(250)}@x.io` },
    ]) {
      const result = await handleNewsletterPost(input, { client });
      expect(result.http).toBe(400);
      expect(result.body).toEqual({ status: 'invalid', error: 'Please enter a valid email address.' });
    }
    expect(client.subscribe).not.toHaveBeenCalled();
  });

  test('missing key → 503 (after validation)', async () => {
    expect((await handleNewsletterPost({ email: 'a@example.com' }, { client: null })).http).toBe(503);
    expect((await handleNewsletterPost({ email: 'bad' }, { client: null })).http).toBe(400);
  });

  test('success → 201 with the spec message; trims the email and forwards the IP', async () => {
    const client = stubClient({ kind: 'subscribed', pending: false });
    const result = await handleNewsletterPost({ email: '  a@example.com ' }, { client, ipAddress: '203.0.113.7' });
    expect(result.http).toBe(201);
    expect(result.body).toEqual({ status: 'subscribed', message: 'Successfully subscribed! 🎉' });
    expect(client.subscribe).toHaveBeenCalledWith('a@example.com', { ipAddress: '203.0.113.7' });
  });

  test('double opt-in → 201 pending', async () => {
    const result = await handleNewsletterPost(
      { email: 'a@example.com' },
      { client: stubClient({ kind: 'subscribed', pending: true }) }
    );
    expect(result).toMatchObject({ status: 'pending', http: 201 });
  });

  test.each([
    ['already', 200, 'already'],
    ['invalid', 400, 'invalid'],
    ['rejected', 400, 'rejected'],
    ['rate_limited', 429, 'rate_limited'],
    ['closed', 503, 'unavailable'],
    ['upstream_error', 502, 'error'],
  ] as const)('outcome %s → %i %s', async (kind, http, status) => {
    const result = await handleNewsletterPost(
      { email: 'a@example.com' },
      { client: stubClient({ kind } as Awaited<ReturnType<ButtondownClient['subscribe']>>) }
    );
    expect(result.http).toBe(http);
    expect(result.status).toBe(status);
  });

  test('a throwing client → 502', async () => {
    const client = {
      subscribe: mock(async () => {
        throw new Error('boom');
      }),
    };
    expect((await handleNewsletterPost({ email: 'a@example.com' }, { client })).http).toBe(502);
  });

  test('honeypot → 200 success-looking answer, nothing subscribed (even with a bad email or no key)', async () => {
    const client = stubClient({ kind: 'subscribed', pending: false });
    for (const input of [
      { email: 'a@example.com', hp_url: 'http://spam.example' },
      { email: 'bad', hp_url: 'x' },
    ]) {
      const result = await handleNewsletterPost(input, { client });
      expect(result.http).toBe(200);
      expect(result.status).toBe('subscribed');
    }
    expect((await handleNewsletterPost({ email: 'a@example.com', hp_url: 'x' }, { client: null })).http).toBe(200);
    expect(client.subscribe).not.toHaveBeenCalled();
  });

  test('an empty honeypot is ignored', async () => {
    const client = stubClient({ kind: 'subscribed', pending: false });
    expect((await handleNewsletterPost({ email: 'a@example.com', hp_url: '' }, { client })).http).toBe(201);
  });
});

describe('no-JS redirect helpers', () => {
  test('safeReturnPath keeps same-site paths only', () => {
    expect(safeReturnPath('/blog/some-post')).toBe('/blog/some-post');
    expect(safeReturnPath('/')).toBe('/');
    for (const bad of [
      '//evil.com',
      '/\\evil.com',
      'https://evil.com',
      'javascript:alert(1)',
      '/a?b=1',
      '/a b',
      '',
      7,
    ]) {
      expect(safeReturnPath(bad)).toBe('/');
    }
  });

  test('redirectLocation', () => {
    expect(redirectLocation('pending', '/blog/x')).toBe('/newsletter?status=pending&from=%2Fblog%2Fx');
    expect(redirectLocation('invalid', '//evil.com')).toBe('/newsletter?status=invalid');
  });

  test('parseStatus', () => {
    expect(parseStatus('already')).toBe('already');
    expect(parseStatus('nope')).toBeUndefined();
    expect(parseStatus(null)).toBeUndefined();
  });
});

describe('hardening', () => {
  test('isValidIp is strict', () => {
    for (const ok of ['203.0.113.7', '::1', '2001:db8::1', '::ffff:192.0.2.1']) expect(isValidIp(ok)).toBe(true);
    for (const bad of ['999.1.1.1', '1.2.3', ':::', 'abc:', '1.2.3.4.5', 'fe80::1%en0x', ''])
      expect(isValidIp(bad)).toBe(false);
  });

  test('an invalid IP is never sent', async () => {
    const f = fakeFetch(201, { type: 'regular' });
    const { client } = clientWith(f);
    await client.subscribe('a@example.com', { ipAddress: '999.1.1.1' });
    expect(JSON.parse(String((f.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      email_address: 'a@example.com',
    });
  });

  test('422 with an IP → one retry without ip_address', async () => {
    let call = 0;
    const f = mock(async (_url: string | URL | Request, _init?: RequestInit) =>
      ++call === 1
        ? Response.json({ detail: [] }, { status: 422 })
        : Response.json({ type: 'unactivated' }, { status: 201 })
    );
    const { client } = clientWith(f as unknown as ReturnType<typeof fakeFetch>);
    expect(await client.subscribe('a@example.com', { ipAddress: '203.0.113.7' })).toEqual({
      kind: 'subscribed',
      pending: true,
    });
    expect(f.mock.calls.length).toBe(2);
    const bodies = f.mock.calls.map((c) => JSON.parse(String((c[1] as RequestInit).body)));
    expect(bodies[0].ip_address).toBe('203.0.113.7');
    expect(bodies[1]).toEqual({ email_address: 'a@example.com' });
  });

  test('422 without an IP → no retry, invalid', async () => {
    const f = fakeFetch(422, { detail: [] });
    const { client } = clientWith(f);
    expect(await client.subscribe('a@example.com')).toEqual({ kind: 'invalid' });
    expect(f.mock.calls.length).toBe(1);
  });

  test('a second 422 after the retry → invalid', async () => {
    const f = fakeFetch(422, { detail: [] });
    const { client } = clientWith(f);
    expect(await client.subscribe('a@example.com', { ipAddress: '203.0.113.7' })).toEqual({ kind: 'invalid' });
    expect(f.mock.calls.length).toBe(2);
  });

  test('safeReturnPath rejects percent-encoded slashes/backslashes in any case', () => {
    for (const bad of [
      '/%2F%2Fevil.com',
      '/%2f%2fevil.com',
      '/%2F%2fevil.com',
      '/%5Cevil.com',
      '/%5cevil.com',
      '/blog/%2F',
    ]) {
      expect(safeReturnPath(bad)).toBe('/');
    }
    expect(safeReturnPath('/blog/caf%C3%A9')).toBe('/blog/caf%C3%A9');
  });
});
