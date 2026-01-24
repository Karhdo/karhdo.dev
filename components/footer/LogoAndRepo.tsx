import SITE_METADATA from '@/data/siteMetadata';

import GrowingUnderline from '@/components/ui/GrowingUnderline';
import Link from '@/components/ui/Link';
import Logo from '@/components/header/Logo';

const LogoAndRepo: React.FC = () => {
  return (
    <div className="flex items-center">
      <Logo className="mr-4" />

      <Link href={SITE_METADATA.siteRepo} rel="noreferrer">
        <GrowingUnderline data-umami-event="footer-view-source" className="flex items-center gap-2 font-medium">
          {SITE_METADATA.headerTitle}
        </GrowingUnderline>
      </Link>
    </div>
  );
};

export default LogoAndRepo;
