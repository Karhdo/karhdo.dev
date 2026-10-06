/**
 * Spotify refresh-token flow (port of v1 `lib/services/spotify.ts`), free of `astro:*` imports so it
 * is testable: `btoa` instead of `Buffer`, the access token cached until `expires_in − 60 s`, and a
 * 5 s timeout on every upstream call. Never logs or returns a secret.
 */
export const SPOTIFY_TOKEN_API = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_NOW_PLAYING_API = 'https://api.spotify.com/v1/me/player/currently-playing';
/** Needs the `user-read-recently-played` scope; without it Spotify answers 403. */
export const SPOTIFY_RECENTLY_PLAYED_API = 'https://api.spotify.com/v1/me/player/recently-played';

export const UPSTREAM_TIMEOUT_MS = 5000;
/** Refresh this long before Spotify's own expiry. */
const EXPIRY_MARGIN_MS = 60_000;
/** After the token endpoint rejects the credentials (400/401, e.g. a revoked refresh token), don't retry for this long. */
export const AUTH_BACKOFF_MS = 5 * 60_000;

export interface SpotifyCredentials {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export interface SpotifyClientDeps {
  fetch?: typeof fetch;
  now?: () => number;
}

export interface SpotifyClient {
  /** The raw currently-playing response (status + body read by the caller). */
  nowPlaying(): Promise<Response>;
  /** The raw recently-played response, limited to the last track. */
  recentlyPlayed(): Promise<Response>;
}

export class SpotifyAuthError extends Error {
  override readonly name = 'SpotifyAuthError';
}

/** `null` when any credential is missing: the endpoint then answers "not playing". */
export function createSpotifyClient(creds: SpotifyCredentials, deps: SpotifyClientDeps = {}): SpotifyClient | null {
  const { clientId, clientSecret, refreshToken } = creds;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const doFetch = deps.fetch ?? fetch;
  const now = deps.now ?? Date.now;
  const basic = btoa(`${clientId}:${clientSecret}`);

  let cached: { token: string; expiresAt: number } | undefined;
  let pending: Promise<string> | undefined;
  /** Backoff after a rejected refresh token; the service keeps one client per warm instance (module scope). */
  let authBlockedUntil = 0;

  async function requestToken(): Promise<string> {
    if (now() < authBlockedUntil)
      throw new SpotifyAuthError('Spotify token request skipped (backing off after a rejection)');
    const response = await doFetch(SPOTIFY_TOKEN_API, {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken as string }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 400 || response.status === 401) authBlockedUntil = now() + AUTH_BACKOFF_MS;
      throw new SpotifyAuthError(`Spotify token request failed (${response.status})`);
    }
    const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof data.access_token !== 'string') throw new SpotifyAuthError('Spotify token response had no access_token');
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in * 1000 : 3_600_000;
    cached = { token: data.access_token, expiresAt: now() + expiresIn - EXPIRY_MARGIN_MS };
    return data.access_token;
  }

  async function accessToken(): Promise<string> {
    if (cached && now() < cached.expiresAt) return cached.token;
    // Concurrent requests on a warm instance share one refresh.
    pending ??= requestToken().finally(() => {
      pending = undefined;
    });
    return pending;
  }

  function get(url: URL, token: string): Promise<Response> {
    return doFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  }

  async function withToken(url: URL): Promise<Response> {
    const response = await get(url, await accessToken());
    if (response.status !== 401) return response;
    // Token revoked or expired early: refresh once and retry.
    await response.body?.cancel();
    cached = undefined;
    return get(url, await accessToken());
  }

  return {
    nowPlaying() {
      const url = new URL(SPOTIFY_NOW_PLAYING_API);
      url.searchParams.set('additional_types', 'track,episode');
      return withToken(url);
    },
    recentlyPlayed() {
      const url = new URL(SPOTIFY_RECENTLY_PLAYED_API);
      url.searchParams.set('limit', '1');
      return withToken(url);
    },
  };
}
