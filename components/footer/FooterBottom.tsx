'use client';

import { clsx } from 'clsx';

import { Link } from '@/components/ui';
import SITE_METADATA from '@/data/siteMetadata';
import MadeInVietNam from '@/icons/miv.svg';

import { LastCommit } from './LastCommit';

const FooterBottom: React.FC = () => {
  return (
    <div
      className={clsx([
        'pt-5 md:my-2',
        'flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between md:gap-16',
        'border-t border-gray-200 dark:border-gray-700',
      ])}
    >
      <LastCommit />
      <Link href={SITE_METADATA.siteRepo}>
        <span data-umami-event="made-in-vietnam">
          <MadeInVietNam />
        </span>
      </Link>
    </div>
  );
};

export default FooterBottom;
