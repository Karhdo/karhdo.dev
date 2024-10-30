import type { SpotifyNowPlayingData } from '@/types/index';
import { getSpotifyNowPlaying } from '@/servers/spotify.server';

export async function GET() {
  const response = await getSpotifyNowPlaying();

  if (response.status === 204 || response.status > 400) {
    return Response.json({ isPlaying: false });
  }

  const data = await response.json();

  if (data?.currently_playing_type === 'episode') {
    return Response.json({
      isPlaying: true,
      title: data.item.name,
      songUrl: data.item.external_urls.spotify,
    });
  }

  const songData: SpotifyNowPlayingData = {
    isPlaying: data.is_playing,
    title: data.item.name,
    artist: data.item.artists.map((art: { name: string }) => art.name).join(', '),
    album: data.item.album.name,
    albumImageUrl: data.item.album.images[0]?.url,
    songUrl: data.item.external_urls.spotify,
  };

  return Response.json(songData);
}
