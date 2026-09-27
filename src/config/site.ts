import type { SimpleIconSlug } from '~/lib/simple-icons';

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

/** A Tokyonight colour token usable as `var(--{tone})` (see `src/styles/theme.css`). */
export type PaletteToken = 'fg' | 'blue' | 'blue1' | 'cyan' | 'teal' | 'green' | 'yellow' | 'orange' | 'red' | 'purple';

/** A "Daily stack" badge: the exact simple-icons logo, tinted with a Tokyonight token (never a brand hex). */
export type StackItem = { name: string; icon: SimpleIconSlug; tone: PaletteToken };

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
  /** Homepage snowfall (task 29): `true` always (v1), `false` never, `'december'` in December only. */
  snowfall: true as SnowfallMode,
  /** Footer version switcher (task 09). `v1.karhdo.dev` goes live after v2 ships (task 28). */
  versions: [
    { branch: 'main', stack: 'Astro × Bun', url: 'https://karhdo.dev', current: true },
    { branch: 'v1', stack: 'Next.js 16 × pnpm', url: 'https://v1.karhdo.dev' },
  ] satisfies SiteVersion[],
  /** Homepage "Daily stack" marquee (task 15): first 7 on the top row, the rest on the reversed row. */
  stack: [
    { name: 'TypeScript', icon: 'typescript', tone: 'blue' },
    { name: 'NestJS', icon: 'nestjs', tone: 'red' },
    { name: 'React', icon: 'react', tone: 'cyan' },
    { name: 'Node.js', icon: 'nodedotjs', tone: 'green' },
    { name: 'Next.js', icon: 'nextdotjs', tone: 'fg' },
    { name: 'Astro', icon: 'astro', tone: 'orange' },
    { name: 'PostgreSQL', icon: 'postgresql', tone: 'blue1' },
    { name: 'Bun', icon: 'bun', tone: 'yellow' },
    { name: 'Tailwind CSS', icon: 'tailwindcss', tone: 'cyan' },
    { name: 'Drizzle', icon: 'drizzle', tone: 'green' },
    { name: 'RabbitMQ', icon: 'rabbitmq', tone: 'orange' },
    { name: 'Docker', icon: 'docker', tone: 'blue' },
    { name: 'Vue.js', icon: 'vuedotjs', tone: 'teal' },
    { name: 'Redis', icon: 'redis', tone: 'red' },
  ] satisfies StackItem[],
  /** Daily stack footer: "Now learning **Astro** & **Bun** by rebuilding this site". */
  nowLearning: { items: ['Astro', 'Bun'], text: 'by rebuilding this site' },
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
