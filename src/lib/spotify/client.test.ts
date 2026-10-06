import { describe, expect, test } from 'bun:test';
import {
  AUTH_BACKOFF_MS,
  createSpotifyClient,
  SPOTIFY_NOW_PLAYING_API,
  SPOTIFY_RECENTLY_PLAYED_API,
  SPOTIFY_TOKEN_API,
} from './client';

const CREDS = { clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh' };

function fakeSpotify(opts: { tokenStatus?: number; playingStatuses?: number[]; expiresIn?: number } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  let tokens = 0;
  const statuses = [...(opts.playingStatuses ?? [200])];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === SPOTIFY_TOKEN_API) {
      tokens += 1;
      return Response.json(
        opts.tokenStatus && opts.tokenStatus !== 200
          ? { error: 'invalid_grant' }
          : { access_token: `tok${tokens}`, expires_in: opts.expiresIn ?? 3600 },
        { status: opts.tokenStatus ?? 200 }
      );
    }
    const status = statuses.length > 1 ? (statuses.shift() as number) : (statuses[0] as number);
    return status === 204 ? new Response(null, { status }) : Response.json({ ok: true }, { status });
  }) as typeof fetch;
  return { fetchImpl, calls, tokenCalls: () => calls.filter((c) => c.url === SPOTIFY_TOKEN_API).length };
}

describe('createSpotifyClient', () => {
  test('null when any credential is missing', () => {
    expect(createSpotifyClient({})).toBeNull();
    expect(createSpotifyClient({ ...CREDS, refreshToken: '' })).toBeNull();
    expect(createSpotifyClient({ ...CREDS, clientSecret: undefined })).toBeNull();
  });

  test('refresh-token grant with Basic auth, then currently-playing with the bearer token', async () => {
    const spotify = fakeSpotify();
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl });
    const response = await client?.nowPlaying();
    expect(response?.status).toBe(200);
    const [token, playing] = spotify.calls;
    expect(token?.init?.method).toBe('POST');
    expect(new Headers(token?.init?.headers).get('authorization')).toBe(`Basic ${btoa('id:secret')}`);
    expect(String(token?.init?.body)).toBe('grant_type=refresh_token&refresh_token=refresh');
    expect(token?.init?.signal).toBeInstanceOf(AbortSignal);
    expect(playing?.url).toBe(`${SPOTIFY_NOW_PLAYING_API}?additional_types=track%2Cepisode`);
    expect(new Headers(playing?.init?.headers).get('authorization')).toBe('Bearer tok1');
    expect(playing?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  test('caches the access token until expires_in − 60 s', async () => {
    let now = 0;
    const spotify = fakeSpotify({ expiresIn: 3600 });
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl, now: () => now });
    await client?.nowPlaying();
    now = 3_539_000; // 1 s before the refresh point
    await client?.nowPlaying();
    expect(spotify.tokenCalls()).toBe(1);
    now = 3_540_000;
    await client?.nowPlaying();
    expect(spotify.tokenCalls()).toBe(2);
  });

  test('concurrent calls share one token refresh', async () => {
    const spotify = fakeSpotify();
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl });
    await Promise.all([client?.nowPlaying(), client?.nowPlaying(), client?.nowPlaying()]);
    expect(spotify.tokenCalls()).toBe(1);
  });

  test('recently-played asks for the last track and shares the cached token', async () => {
    const spotify = fakeSpotify();
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl });
    await client?.nowPlaying();
    await client?.recentlyPlayed();
    expect(spotify.calls.at(-1)?.url).toBe(`${SPOTIFY_RECENTLY_PLAYED_API}?limit=1`);
    expect(new Headers(spotify.calls.at(-1)?.init?.headers).get('authorization')).toBe('Bearer tok1');
    expect(spotify.tokenCalls()).toBe(1);
  });

  test('a 401 drops the cached token and retries once', async () => {
    const spotify = fakeSpotify({ playingStatuses: [401, 204] });
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl });
    const response = await client?.nowPlaying();
    expect(response?.status).toBe(204);
    expect(spotify.tokenCalls()).toBe(2);
  });

  test('a rejected token request throws without leaking credentials, then backs off for 5 minutes', async () => {
    let now = 0;
    const spotify = fakeSpotify({ tokenStatus: 400 });
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl, now: () => now });
    const error = await client?.nowPlaying().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Spotify token request failed (400)');
    expect((error as Error).message).not.toContain('secret');
    now = AUTH_BACKOFF_MS - 1;
    await expect(client?.nowPlaying()).rejects.toThrow('backing off');
    expect(spotify.tokenCalls()).toBe(1);
    now = AUTH_BACKOFF_MS;
    await client?.nowPlaying().catch(() => undefined);
    expect(spotify.tokenCalls()).toBe(2);
  });

  test('a token server error (5xx) does not back off', async () => {
    const spotify = fakeSpotify({ tokenStatus: 503 });
    const client = createSpotifyClient(CREDS, { fetch: spotify.fetchImpl });
    await client?.nowPlaying().catch(() => undefined);
    await client?.nowPlaying().catch(() => undefined);
    expect(spotify.tokenCalls()).toBe(2);
  });
});
