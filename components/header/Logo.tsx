import { clsx } from 'clsx';

import Link from '@/components/ui/Link';
import Image from '@/components/ui/Image';
import SITE_METADATA from '@/data/siteMetadata';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = (props) => {
  const { className } = props;

  return (
    <Link
      href="/"
      aria-label={SITE_METADATA.headerTitle}
      className={clsx([
        'rounded-xl p-0.5',
        'ring-1 ring-zinc-900/5 dark:ring-white/10',
        'shadow-lg shadow-zinc-800/5',
        className,
      ])}
    >
      <Image
        src="/static/images/avatar.jpg"
        alt={SITE_METADATA.headerTitle}
        width={100}
        height={100}
        className="h-10 w-10 rounded-xl"
        loading="eager"
      />
    </Link>
  );
};

export default Logo;
