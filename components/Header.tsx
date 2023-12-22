import { useRouter } from 'next/router';
import clsx from 'clsx';

import siteMetadata from '@/data/siteMetadata';
import headerNavLinks from '@/data/headerNavLinks';

import Logo from 'public/static/images/logo.svg';

import Link from './Link';
import MobileNav from './MobileNav';
import ThemeSwitch from './ThemeSwitch';
import AnalyticsLink from './AnalyticsLink';

const Header = () => {
  const router = useRouter();

  return (
    <header className="supports-backdrop-blur fixed left-0 right-0 top-0 z-40 bg-white/75 py-4 backdrop-blur dark:bg-dark/75">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-3 xl:max-w-5xl xl:px-0">
        <Link href="/" aria-label={siteMetadata.headerTitle} className="flex items-center">
          <div className="animate-wave">
            <Logo className="fill-dark dark:fill-white" />
          </div>
          <div className="group ml-2 text-xl font-bold transition duration-300">
            Karhdo.dev
            <span className="block h-0.5 max-w-0 bg-black transition-all duration-500 group-hover:max-w-[85%] dark:bg-white"></span>
          </div>
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
                    ? 'bg-gray-200 dark:bg-primary'
                    : 'hover:bg-gray-200 dark:hover:bg-primary'
                )}
                data-umami-event={`nav-${link.href.replace('/', '')}`}
              >
                {link.title}
              </Link>
            ))}
          </div>
          <AnalyticsLink />
          <ThemeSwitch />
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
