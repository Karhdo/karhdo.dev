import siteMetadata from '@/data/siteMetadata';

import Twemoji from '@/components/ui/Twemoji';

const Heading = () => {
  return (
    <h1 className="font-medium text-neutral-900 dark:text-neutral-200">
      I'm <span>{siteMetadata.fullName}</span> - a dedicated <span>Engineering Lead</span> in {siteMetadata.org}
      <span className="hidden">Jaipur, India</span>
      <span className="absolute ml-1.5 inline-flex pt-[3px]">
        <Twemoji emoji="twa-flag-india" />
      </span>
    </h1>
  );
};

export default Heading;
