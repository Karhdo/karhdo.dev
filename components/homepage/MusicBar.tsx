import React from 'react';

const MusicBar = () => {
  return (
    <div className="m-auto flex h-5 items-end pb-0.5">
      <div className="h-full w-0.5 animate-music-bar-1 bg-spotify"></div>
      <div className="mx-0.5 h-1/2 w-0.5 animate-music-bar-2 bg-spotify"></div>
      <div className="h-full w-0.5 animate-music-bar-3 bg-spotify"></div>
      <div className="mx-0.5 h-1/2 w-0.5 animate-music-bar-4 bg-spotify"></div>
    </div>
  );
};

export default MusicBar;
