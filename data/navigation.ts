import SITE_METADATA from '@/data/siteMetadata';

export const HEADER_NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  // { href: '/tags', title: 'Tags' },
  { href: '/projects', title: 'Projects' },
  { href: '/about', title: 'About' },
  // { href: '/resume', title: 'Resume' },
];

export const FOOTER_NAV_LINKS = [
  { href: '/blog', title: 'Blog' },
  { href: '/projects', title: 'Projects' },
  { href: '/tags', title: 'Tags' },
  { href: '/feed.xml', title: 'RSS Feed' },
];

export const FOOTER_PERSONAL_STUFF = [
  { href: '/about', title: 'About' },
  { href: '/static/resume.pdf', title: 'Resume' },
  { href: SITE_METADATA.analyticsURL, title: 'Analytics' },
];
