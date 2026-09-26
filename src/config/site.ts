/**
 * Site-wide configuration, ported from v1 `data/siteMetadata.js`.
 *
 * Environment-dependent values (Umami website id, Giscus ids, …) are NOT here:
 * they are declared in the `astro:env` schema in `astro.config.mjs` and read
 * from `astro:env/server` where they are needed.
 */
/** `'december'` shows snow only in December (visitor's local month). Filled by task 29. */
export type SnowfallMode = boolean | 'december';

/** An entry of the footer version switcher. Filled by task 09. */
export type SiteVersion = { branch: string; stack: string; url: string; current?: boolean };

/**
 * A "Daily stack" badge. Loosely typed for now: task 15 narrows `icon` to a
 * simple-icons slug and `tone` to a Tokyonight palette token (task 06).
 */
export type StackItem = { name: string; icon: string; tone: string };

export type SiteConfig = {
  title: string;
  author: string;
  fullName: string;
  headerTitle: string;
  description: string;
  language: string;
  locale: string;
  siteUrl: string;
  siteRepo: string;
  analyticsURL: string;
  siteLogo: string;
  image: string;
  socialBanner: string;
  email: string;
  github: string;
  facebook: string;
  linkedin: string;
  twitter: string;
  socialAccounts: { github: string; linkedin: string; facebook: string };
  /** IANA time zone. */
  timezone: string;
  location: string;
  postsPerPage: number;
  // Added by later tasks: snowfall (29), versions (09), stack and nowLearning (15).
  snowfall?: SnowfallMode;
  versions?: readonly SiteVersion[];
  stack?: readonly StackItem[];
  nowLearning?: { readonly items: readonly string[]; readonly text: string };
};

export const SITE = {
  title: "Karhdo's Blog - Coding Adventure",
  author: 'Trong Khanh',
  fullName: 'Do Trong Khanh',
  headerTitle: "Karhdo's Blog",
  description: 'My desire to practice my skills and share my acquired knowledge fuels my endeavors.',
  language: 'en-us',
  locale: 'en-US',
  siteUrl: 'https://karhdo.dev',
  siteRepo: 'https://github.com/Karhdo/karhdo.dev',
  analyticsURL: 'https://analytics.karhdo.dev/share/Z3eSINRnbzydz1gK/karhdo.dev',
  siteLogo: '/static/images/avatar.jpg',
  image: '/static/images/avatar.jpg',
  socialBanner: '/static/images/projects/karhdo-blog.png',
  email: 'dotrongkhanh.dev@gmail.com',
  github: 'https://github.com/Karhdo',
  facebook: 'https://www.facebook.com/karhdo.dev',
  linkedin: 'https://www.linkedin.com/in/karhdo',
  twitter: 'https://twitter.com/karhdo',
  socialAccounts: {
    github: 'Karhdo',
    linkedin: 'karhdo',
    facebook: 'karhdo.dev',
  },
  timezone: 'Asia/Ho_Chi_Minh',
  location: 'Ho Chi Minh, Viet Nam',
  postsPerPage: 5,
  /** Footer version switcher (task 09). `v1.karhdo.dev` goes live after v2 ships (task 28). */
  versions: [
    { branch: 'main', stack: 'Astro × Bun', url: 'https://karhdo.dev', current: true },
    { branch: 'v1', stack: 'Next.js 16 × pnpm', url: 'https://v1.karhdo.dev' },
  ] satisfies SiteVersion[],
} as const satisfies SiteConfig;

/**
 * Giscus defaults (v1 `siteMetadata.comments.giscusConfig`). The repo/category
 * ids come from the `NEXT_PUBLIC_GISCUS_*` env vars via `astro:env/server`.
 */
export const GISCUS = {
  mapping: 'title',
  reactions: '1',
  metadata: '0',
  theme: 'light',
  darkTheme: 'transparent_dark',
  lang: 'en',
  inputPosition: 'bottom',
} as const;
