import siteMetadata from '@/data/siteMetadata';
import Twemoji from '@/components/Twemoji';

import Briefcase from 'public/static/favicons/briefcase.svg';
import MapPin from 'public/static/favicons/map-pin.svg';
import Envelope from 'public/static/favicons/envelope.svg';
import ArrowTopRightOnSquare from 'public/static/favicons/arrow-top-right-on-square.svg';

const ProfileCardInfo = () => {
  return (
    <div className="p-3">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white">Trong Khanh (Karhdo) Do</h3>
      <h5 className="text-gray-700 dark:text-gray-400">Learner | Builder</h5>
      <div className="mb-2 mt-2 space-y-3">
        <div className="flex items-center">
          <Briefcase className="w-5" />
          <p className="px-2">
            Fullstack Engineer @{' '}
            <a className="hover:underline" target="_blank" href="https://younetmedia.com/" rel="noreferrer">
              YouNet Media
            </a>
          </p>
        </div>
        <div className="flex items-center">
          <MapPin className="w-5" />
          <p className="px-2">
            Binh Thanh - Ho Chi Minh, <Twemoji emoji="viet-nam-vietnam-flag" />
          </p>
        </div>
        <div className="flex items-center">
          <Envelope className="w-5" />
          <p className="px-2">
            <a href={`mailto:${siteMetadata.email}`}>{siteMetadata.email}</a>
          </p>
        </div>
        <div className="flex items-center">
          <ArrowTopRightOnSquare className="w-5" />
          <p className="space-x-1.5 px-2">
            <a
              target="_blank"
              href={siteMetadata.github}
              rel="noreferrer"
              className="hover:underline"
              data-umami-event="profile-card-github"
            >
              gh/{siteMetadata.socialAccounts.github}
            </a>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <a
              target="_blank"
              href={siteMetadata.linkedin}
              rel="noreferrer"
              className="hover:underline"
              data-umami-event="profile-card-linkedin"
            >
              in/{siteMetadata.socialAccounts.linkedin}
            </a>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <a
              target="_blank"
              href={siteMetadata.facebook}
              rel="noreferrer"
              className="hover:underline"
              data-umami-event="profile-card-facebook"
            >
              fb/{siteMetadata.socialAccounts.facebook}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCardInfo;
