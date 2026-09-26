import { SITE } from '~/config/site';

export type NavLink = { readonly href: string; readonly title: string };

export const HEADER_NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
] as const satisfies readonly NavLink[];

export const FOOTER_NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/tags', title: 'Tags' },
  { href: '/feed.xml', title: 'RSS Feed' },
] as const satisfies readonly NavLink[];

export const FOOTER_PERSONAL_STUFF = [
  { href: '/about', title: 'About' },
  { href: '/static/resume.pdf', title: 'Resume' },
  { href: SITE.analyticsURL, title: 'Analytics' },
] as const satisfies readonly NavLink[];
