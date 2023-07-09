import { useRouter } from 'next/router'
import clsx from 'clsx'

import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'

import Link from './Link'
import Image from './Image'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'

const Header = () => {
  const router = useRouter()

  return (
    <header className="flex items-center justify-between py-3">
      <Link href="/" aria-label={siteMetadata.headerTitle}>
        <Image
          src="/static/images/avatar.jpg"
          alt="Karhdo's Blog Logo"
          width={45}
          height={45}
          className="rounded-full"
        />
      </Link>
      <div className="flex items-center text-base leading-5">
        <div className="hidden sm:block">
          {
            headerNavLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className={clsx(
                  'rounded mx-1 px-2 py-1 font-medium text-gray-900 dark:text-gray-100 sm:px-3 sm:py-2',
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
  )
}

export default Header
