/**
 * Spotify service (task 19): the refresh-token client wired to the `astro:env` server secrets.
 * Module scope, so a warm function instance reuses the cached access token.
 * Both getters resolve to `null` when the credentials are not configured.
 */
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } from 'astro:env/server';
import { createSpotifyClient } from '~/lib/spotify/client';

const client = createSpotifyClient({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  refreshToken: SPOTIFY_REFRESH_TOKEN,
});

export async function getSpotifyNowPlaying(): Promise<Response | null> {
  return client ? client.nowPlaying() : null;
}

export async function getSpotifyRecentlyPlayed(): Promise<Response | null> {
  return client ? client.recentlyPlayed() : null;
}
