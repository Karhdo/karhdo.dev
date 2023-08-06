import Image from '@/components/Image';
import ProfileInfo from '@/components/homepage/ProfileInfo';
import SpotifyNowPlaying from '@/components/homepage/SpotifyNowPlaying';

const ProfileCard = () => {
  return (
    <div className="overflow-hidden rounded shadow-lg shadow-slate-300 dark:shadow-sky-700/50">
      <Image
        src={'/static/images/avatar.jpg'}
        alt="avatar"
        width={550}
        height={350}
        style={{
          objectPosition: '50% 0%',
          objectFit: 'cover',
          width: '100%',
          aspectRatio: '20/16',
        }}
      />
      <SpotifyNowPlaying />
      <ProfileInfo />
      <div className="h-1.5 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></div>
    </div>
  );
};

export default ProfileCard;
