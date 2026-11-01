import { describe, expect, test } from 'bun:test';
import lastPlayed from './__fixtures__/last-played.json';
import nowPlaying from './__fixtures__/now-playing.json';
import { recentTracksUrl, toLastfmNowPlaying } from './recent-tracks';

const AT = 1_790_000_100_000;

describe('recentTracksUrl', () => {
  test('asks for the latest scrobble as JSON', () => {
    const url = new URL(recentTracksUrl('karhdo', 'k&y'));
    expect(url.origin + url.pathname).toBe('https://ws.audioscrobbler.com/2.0/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      method: 'user.getrecenttracks',
      user: 'karhdo',
      api_key: 'k&y',
      format: 'json',
      limit: '1',
    });
  });
});

describe('toLastfmNowPlaying', () => {
  test('the playing track maps to the card payload, without timing', () => {
    expect(toLastfmNowPlaying(200, nowPlaying, AT)).toEqual({
      isPlaying: true,
      title: 'Midnight City',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      albumImageUrl: 'https://lastfm.freetls.fastly.net/i/u/64s/abc123.jpg',
      albumImageSrcset: [
        'https://lastfm.freetls.fastly.net/i/u/34s/abc123.jpg 34w',
        'https://lastfm.freetls.fastly.net/i/u/64s/abc123.jpg 64w',
        'https://lastfm.freetls.fastly.net/i/u/174s/abc123.jpg 174w',
        'https://lastfm.freetls.fastly.net/i/u/300x300/abc123.jpg 300w',
      ].join(', '),
      songUrl: 'https://www.last.fm/music/M83/_/Midnight+City',
      fetchedAt: AT,
    });
  });

  test('a single (non-array) last scrobble becomes "last played"; placeholder art and empty album are dropped', () => {
    expect(toLastfmNowPlaying(200, lastPlayed, AT)).toEqual({
      isPlaying: false,
      title: 'Let It Happen',
      artist: 'Tame Impala',
      album: undefined,
      albumImageUrl: undefined,
      albumImageSrcset: undefined,
      songUrl: 'https://www.last.fm/music/Tame+Impala/_/Let+It+Happen',
      playedAt: '2026-09-21T14:13:20.000Z',
      fetchedAt: AT,
    });
  });

  test('errors, an empty history and malformed bodies are "not playing"', () => {
    expect(toLastfmNowPlaying(403, { error: 10, message: 'Invalid API key' })).toEqual({ isPlaying: false });
    expect(toLastfmNowPlaying(200, { error: 6, message: 'User not found' })).toEqual({ isPlaying: false });
    expect(toLastfmNowPlaying(200, { recenttracks: { track: [] } })).toEqual({ isPlaying: false });
    expect(toLastfmNowPlaying(200, undefined)).toEqual({ isPlaying: false });
    expect(toLastfmNowPlaying(200, { recenttracks: { track: [{ name: 'No date', date: { uts: 'x' } }] } })).toEqual({
      isPlaying: false,
    });
  });
});
