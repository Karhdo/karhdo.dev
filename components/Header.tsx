import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';

import Link from './Link';
import Image from './Image';
import MobileNav from './MobileNav';
import ThemeSwitch from './ThemeSwitch';

const Header = () => {
  const router = useRouter();

  const { theme } = useTheme();

  const logoPath = theme === 'dark' ? '/static/images/logo-white.svg' : '/static/images/logo-black.svg';

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-white/75 py-4 backdrop-blur dark:bg-dark/75">
      <Link href="/" aria-label={siteMetadata.headerTitle} className="duration-y transform  transition hover:scale-95">
        <Image src={logoPath} alt="Karhdo's Logo" width={180} height={180} />
      </Link>
      <div className="flex items-center text-base leading-5">
        <div className="hidden sm:block">
          {headerNavLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={clsx(
                'mx-1 rounded px-2 py-1 font-medium text-gray-900 dark:text-gray-100 sm:px-3 sm:py-2',
                router.pathname.startsWith(link.href)
                  ? 'bg-gray-200 dark:bg-blue-950'
                  : 'hover:bg-gray-200 dark:hover:bg-blue-950'
              )}
              data-umami-event={`nav-${link.href.replace('/', '')}`}
            >
              {link.title}
            </Link>
          ))}
        </div>
        <ThemeSwitch />
        <MobileNav />
      </div>
    </header>
  );
};

export default Header;
