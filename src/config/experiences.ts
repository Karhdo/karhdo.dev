/**
 * Career timeline entries, ported verbatim from v1 `components/about/CareerTimeline.tsx`.
 * The rich `details` bodies live in `src/components/career/experiences/*.astro`, keyed by `event`.
 * `kind`, `tone`, `projects` and `stack` feed /career.
 */
import type { PaletteToken } from '~/config/site';
import type { EmojiName } from '~/lib/emoji';
import type { SimpleIconSlug } from '~/lib/simple-icons';

/** A tool used in a role; `icon` only when simple-icons has the exact logo. */
export type StackTool = { name: string; icon?: SimpleIconSlug };

export interface Experience {
  org: string;
  url: string;
  /** `public/static/images/experiences/` path (v1 URL); rendered from its `src/assets/experiences/` twin. */
  logo: string;
  start: string;
  end: string;
  title: string;
  icon: EmojiName;
  /** Umami event prefix (`${event} expand` / `${event} collapse`); also the details partial key. */
  event: ExperienceEvent;
  /** `work` sits on the git graph's main lane; `education` on its own branch that merges back. */
  kind: 'work' | 'education';
  /** Tokyonight tone for the dot, ruler bar and accents. */
  tone: PaletteToken;
  /** Named products from the details text. */
  projects?: { name: string; url?: string }[];
  stack: StackTool[];
}

export type ExperienceEvent = 'career-spartan' | 'career-younetmedia' | 'career-qkit' | 'career-uit';

export const EXPERIENCES: Experience[] = [
  {
    org: 'Spartan',
    url: 'https://hirespartan.io/',
    logo: '/static/images/experiences/spartan-logo.jpeg',
    start: 'Mar 2025',
    end: 'Present',
    title: 'Software Engineer',
    icon: 'man-technologist',
    event: 'career-spartan',
    kind: 'work',
    tone: 'blue',
    projects: [
      { name: 'Dealops', url: 'https://dealops.com/' },
      { name: 'Deepsky', url: 'https://www.deepskyclimate.com/' },
    ],
    stack: [
      { name: 'React', icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' },
      { name: 'React Hook Form', icon: 'reacthookform' },
      { name: 'Ant Design', icon: 'antdesign' },
      { name: 'Turborepo', icon: 'turborepo' },
      { name: 'Apache Spark', icon: 'apachespark' },
      { name: 'Delta Lake' },
      { name: 'Databricks', icon: 'databricks' },
      { name: 'AWS S3' },
      { name: 'AWS EMR' },
    ],
  },
  {
    org: 'Younet Media',
    url: 'https://younetmedia.com',
    logo: '/static/images/experiences/younetmedia-logo.png',
    start: 'Mar 2022',
    end: 'Mar 2025',
    title: 'Junior Software Engineer',
    icon: 'man-technologist',
    event: 'career-younetmedia',
    kind: 'work',
    tone: 'purple',
    projects: [{ name: 'Ecomheat', url: 'https://ecomheat.youneteci.com' }, { name: 'AppCore' }],
    stack: [
      { name: 'NestJS', icon: 'nestjs' },
      { name: 'Redis', icon: 'redis' },
      { name: 'npm', icon: 'npm' },
    ],
  },
  {
    org: 'QKIT Software',
    url: 'https://qkit.vn',
    logo: '/static/images/experiences/qkit-logo.png',
    start: 'Jan 2021',
    end: 'Dec 2022',
    title: 'Fresher Backend Developer',
    icon: 'man-technologist',
    event: 'career-qkit',
    kind: 'work',
    tone: 'green',
    stack: [
      { name: 'NestJS', icon: 'nestjs' },
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'Prisma', icon: 'prisma' },
    ],
  },
  {
    org: 'University of Information Technology',
    url: 'https://en.uit.edu.vn',
    logo: '/static/images/experiences/uit-logo.png',
    start: 'Aug 2019',
    end: 'Jun 2023',
    title: 'Student at UIT – HCMC (School of Computer Science)',
    icon: 'student',
    event: 'career-uit',
    kind: 'education',
    tone: 'yellow',
    stack: [{ name: 'C++', icon: 'cplusplus' }],
  },
];
