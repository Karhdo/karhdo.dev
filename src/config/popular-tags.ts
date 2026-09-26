/**
 * Brand icon names: the v1 `BrandIconsMap` keys plus `Astro`, `Drizzle` and
 * `Bun` for v2. Task 08 builds the icon map (`BrandIcon.astro`) against it.
 */
export type BrandIconName =
  | 'React'
  | 'Remix'
  | 'Git'
  | 'GitHub'
  | 'Javascript'
  | 'Typescript'
  | 'Node'
  | 'Bash'
  | 'Liquid'
  | 'Markdown'
  | 'NextJS'
  | 'TailwindCSS'
  | 'Prisma'
  | 'Umami'
  | 'Vercel'
  | 'Railway'
  | 'Spotify'
  | 'NestJS'
  | 'Docker'
  | 'Postgres'
  | 'Mongodb'
  | 'Astro'
  | 'Drizzle'
  | 'Bun';

export type PopularTag = {
  href: string;
  iconType: BrandIconName;
  slug: string;
  title: string;
};

export const POPULAR_TAGS = [
  {
    href: '/tags/javascript',
    iconType: 'Javascript',
    slug: 'javascript',
    title: 'Javascript',
  },
  {
    href: '/tags/typescript',
    iconType: 'Typescript',
    slug: 'typescript',
    title: 'Typescript',
  },
  {
    href: '/tags/nestjs',
    iconType: 'NestJS',
    slug: 'nestjs',
    title: 'NestJS',
  },
  {
    href: '/tags/react',
    iconType: 'React',
    slug: 'react',
    title: 'React',
  },
  {
    href: '/tags/database',
    iconType: 'Mongodb',
    slug: 'database',
    title: 'Database',
  },
  {
    href: '/tags/devops',
    iconType: 'Docker',
    slug: 'devops',
    title: 'Devops',
  },
] as const satisfies readonly PopularTag[];
