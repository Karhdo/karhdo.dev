import useSWR from 'swr';

import { fetcher } from '@/lib/utils';

import type { SpotifyNowPlayingData } from '@/types/index';

// SWR configuration for Spotify API (client-swr-dedup)
const SWR_CONFIG = {
  // Revalidate every 30 seconds while playing, or every 5 minutes when idle
  refreshInterval: 30000,
  // Don't revalidate on focus to reduce API calls
  revalidateOnFocus: false,
  // Don't revalidate on reconnect
  revalidateOnReconnect: false,
  // Dedupe requests within 10 seconds
  dedupingInterval: 10000,
};

export default function useNowPlaying() {
  const { data } = useSWR<SpotifyNowPlayingData>('/api/spotify', fetcher, SWR_CONFIG);

  return data || { isPlaying: false };
}
