import { SITE } from '~/config/site';

export type NavLink = { readonly href: string; readonly title: string };

export const HEADER_NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/career', title: 'Career' },
  { href: '/about', title: 'About' },
] as const satisfies readonly NavLink[];

export type FooterColumn = { readonly title: 'Site' | 'Personal' | 'Elsewhere'; readonly links: readonly NavLink[] };

/** Footer top-row link columns (task 09, v1 parity: FooterNav + personal stuff + socials). */
export const FOOTER_COLUMNS = [
  {
    title: 'Site',
    links: [
      { href: '/blog', title: 'Blog' },
      { href: '/projects', title: 'Projects' },
      { href: '/tags', title: 'Tags' },
      { href: '/feed.xml', title: 'RSS feed' },
    ],
  },
  {
    title: 'Personal',
    links: [
      { href: '/about', title: 'About' },
      { href: '/career', title: 'Career' },
      { href: '/static/resume.pdf', title: 'Resume' },
      { href: SITE.analyticsURL, title: 'Analytics' },
    ],
  },
  {
    title: 'Elsewhere',
    links: [
      { href: SITE.github, title: 'GitHub' },
      { href: SITE.linkedin, title: 'LinkedIn' },
      { href: SITE.twitter, title: 'Twitter' },
    ],
  },
] as const satisfies readonly FooterColumn[];
