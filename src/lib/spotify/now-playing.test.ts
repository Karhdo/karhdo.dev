import { describe, expect, test } from 'bun:test';
import ad from './__fixtures__/ad.json';
import episode from './__fixtures__/episode.json';
import track from './__fixtures__/track.json';
import {
  albumSrcset,
  formatTime,
  payloadAgeMs,
  pickAlbumImage,
  positionAt,
  SPOTIFY_CACHE_HEADERS,
  toNowPlaying,
} from './now-playing';

const AT = 1_790_000_000_500;

describe('toNowPlaying', () => {
  test('204 and upstream errors are "not playing"', () => {
    expect(toNowPlaying(204, undefined)).toEqual({ isPlaying: false });
    expect(toNowPlaying(401, track)).toEqual({ isPlaying: false });
    expect(toNowPlaying(429, track)).toEqual({ isPlaying: false });
    expect(toNowPlaying(503, undefined)).toEqual({ isPlaying: false });
  });

  test('a track maps to the full payload with progress and duration', () => {
    expect(toNowPlaying(200, track, AT)).toEqual({
      isPlaying: true,
      title: 'Midnight City',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      albumImageUrl: 'https://i.scdn.co/image/ab67616d00004851fff2cb485c36a6d8f639bdba',
      albumImageSrcset:
        'https://i.scdn.co/image/ab67616d00004851fff2cb485c36a6d8f639bdba 64w, https://i.scdn.co/image/ab67616d00001e02fff2cb485c36a6d8f639bdba 300w, https://i.scdn.co/image/ab67616d0000b273fff2cb485c36a6d8f639bdba 640w',
      songUrl: 'https://open.spotify.com/track/1eyzqe2QqGZUmfcPZtrIyt',
      progressMs: 103000,
      durationMs: 243960,
      fetchedAt: AT,
    });
  });

  test('a paused track keeps its data with isPlaying false; several artists are joined', () => {
    const paused = {
      ...track,
      is_playing: false,
      item: { ...track.item, artists: [{ name: 'A' }, { name: 'B' }] },
    };
    const data = toNowPlaying(200, paused, AT);
    expect(data.isPlaying).toBe(false);
    expect(data.artist).toBe('A, B');
    expect(data.progressMs).toBe(103000);
  });

  test('a paused episode is not playing', () => {
    expect(toNowPlaying(200, { ...episode, is_playing: false }, AT).isPlaying).toBe(false);
  });

  test('an episode is playing with title, link, show and timing', () => {
    const data = toNowPlaying(200, episode, AT);
    expect(data).toMatchObject({
      isPlaying: true,
      title: 'Episode 42: Shipping small',
      songUrl: 'https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ',
      artist: 'Some Podcast',
      albumImageUrl: 'https://i.scdn.co/image/ep64',
      progressMs: 1800000,
      durationMs: 3725000,
    });
  });

  test('no item (ads, private sessions) or junk is "not playing"', () => {
    expect(toNowPlaying(200, ad)).toEqual({ isPlaying: false });
    expect(toNowPlaying(200, null)).toEqual({ isPlaying: false });
    expect(toNowPlaying(200, 'nope')).toEqual({ isPlaying: false });
    expect(toNowPlaying(200, { item: { name: '' } })).toEqual({ isPlaying: false });
  });

  test('bad timing values are dropped, not passed through', () => {
    const odd = { ...track, progress_ms: -5, item: { ...track.item, duration_ms: 'x' } };
    const data = toNowPlaying(200, odd, AT);
    expect(data.progressMs).toBeUndefined();
    expect(data.durationMs).toBeUndefined();
  });
});

describe('album art', () => {
  const images = track.item.album.images;
  test('smallest image at least 64 px wide', () => {
    expect(pickAlbumImage(images)).toBe(images[2]?.url);
    expect(pickAlbumImage(images, 100)).toBe(images[1]?.url);
    expect(pickAlbumImage(images, 1000)).toBe(images[0]?.url); // none large enough: the largest
    expect(pickAlbumImage([])).toBeUndefined();
    expect(pickAlbumImage([{ url: 'u' }])).toBe('u'); // unsized
  });
  test('srcset needs at least two sized images', () => {
    expect(albumSrcset([{ url: 'a', width: 64 }])).toBeUndefined();
    expect(
      albumSrcset([
        { url: 'b', width: 300 },
        { url: 'a', width: 64 },
      ])
    ).toBe('a 64w, b 300w');
  });
});

describe('formatTime', () => {
  test('m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(103_999)).toBe('1:43');
    expect(formatTime(243_960)).toBe('4:03');
    expect(formatTime(600_000)).toBe('10:00');
  });
  test('h:mm:ss from one hour; junk is 0:00', () => {
    expect(formatTime(3_725_000)).toBe('1:02:05');
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });
});

describe('payloadAgeMs', () => {
  test('prefers the CDN Age header', () => {
    expect(payloadAgeMs('12', AT - 99_000, AT)).toBe(12_000);
    expect(payloadAgeMs('0', undefined, AT)).toBe(0);
    expect(payloadAgeMs('9999', undefined, AT)).toBe(120_000); // capped
  });
  test('falls back to fetchedAt only when plausible', () => {
    expect(payloadAgeMs(null, AT - 1500, AT)).toBe(1500);
    expect(payloadAgeMs(null, AT + 5000, AT)).toBe(0); // client clock behind the server
    expect(payloadAgeMs(null, AT - 3_600_000, AT)).toBe(0); // client clock far ahead
    expect(payloadAgeMs('junk', undefined, AT)).toBe(0);
  });
});

describe('positionAt', () => {
  const playing = { isPlaying: true, progressMs: 100_000, durationMs: 240_000 };
  test('advances while playing and clamps to the duration', () => {
    expect(positionAt(playing, 0)).toBe(100_000);
    expect(positionAt(playing, 5_000)).toBe(105_000);
    expect(positionAt(playing, 1_000_000)).toBe(240_000);
    expect(positionAt(playing, -50)).toBe(100_000);
  });
  test('frozen while paused; zero without progress', () => {
    expect(positionAt({ ...playing, isPlaying: false }, 5_000)).toBe(100_000);
    expect(positionAt({ isPlaying: true }, 5_000)).toBe(5_000);
    expect(positionAt({ isPlaying: false }, 5_000)).toBe(0);
  });
});

describe('SPOTIFY_CACHE_HEADERS', () => {
  test('browsers always revalidate; only the Vercel CDN caches (30 s + 30 s SWR)', () => {
    expect(SPOTIFY_CACHE_HEADERS).toEqual({
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=30, stale-while-revalidate=30',
    });
    expect(SPOTIFY_CACHE_HEADERS['Cache-Control']).not.toMatch(/s-maxage|stale-while-revalidate/);
  });
});
