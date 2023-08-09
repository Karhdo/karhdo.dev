import useSWR from 'swr';

import { fetcher } from '@/utils/fetcher';
import type { SpotifyNowPlayingData } from '@/types/index';

import MusicBar from '@/components/homepage/MusicBar';

import Spotify from 'public/static/favicons/spotify.svg';

const SpotifyNowPlaying = () => {
  const response = useSWR('/api/spotify', fetcher);

  const { songUrl, title, artist } = (response.data as SpotifyNowPlayingData) || {};

  return (
    <div className="flex items-center gap-2 bg-slate-700/20 px-3 py-2 dark:bg-sky-700/20">
      <Spotify className="w-6 flex-shrink-0 text-spotify" />

      <div className="inline-flex truncate">
        {songUrl ? (
          <>
            <MusicBar />
            <a
              className="ml-2 font-medium dark:text-gray-200 "
              href={songUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${title} - ${artist || 'Spotify'}`}
            >
              {title}
            </a>
          </>
        ) : (
          <p className="font-medium dark:text-gray-200">Not Playing</p>
        )}
        <span className="mx-2 dark:text-gray-300">{' – '}</span>
        <p className="max-w-max truncate dark:text-gray-300">{artist || 'Spotify'}</p>
      </div>
    </div>
  );
};

export default SpotifyNowPlaying;
