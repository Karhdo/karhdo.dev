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
  /** Git-graph branch name for education entries (e.g. `education/uit`). */
  branch?: string;
  /** Git-graph commit message override. */
  message?: string;
  /** Tokyonight tone for the dot, ruler bar and accents. */
  tone: PaletteToken;
  /** Named products from the details text. */
  projects?: { name: string; url?: string }[];
  stack: StackTool[];
}

export type ExperienceEvent = 'career-spartan' | 'career-msis' | 'career-younetmedia' | 'career-qkit' | 'career-uit';

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
      { name: 'LoanBud', url: 'https://loanbud.com/' },
      { name: 'Dealops', url: 'https://dealops.com/' },
      { name: 'Deep Sky Climate', url: 'https://www.deepskyclimate.com/' },
    ],
    stack: [
      { name: 'Go', icon: 'go' },
      { name: 'Scala', icon: 'scala' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'React', icon: 'react' },
      { name: 'tRPC', icon: 'trpc' },
      { name: 'Prisma', icon: 'prisma' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' },
      { name: 'Turborepo', icon: 'turborepo' },
      { name: 'Apache Spark', icon: 'apachespark' },
      { name: 'Apache Airflow', icon: 'apacheairflow' },
      { name: 'AWS Kinesis' },
      { name: 'AWS EMR' },
      { name: 'Redis', icon: 'redis' },
      { name: 'Twilio' },
      { name: 'Kubernetes', icon: 'kubernetes' },
      { name: 'Datadog', icon: 'datadog' },
    ],
  },
  {
    org: 'University of Information Technology',
    url: 'https://www.uit.edu.vn',
    logo: '/static/images/experiences/uit-logo.png',
    start: 'Dec 2024',
    end: 'Present',
    title: 'Master of Science in Information Systems',
    icon: 'student',
    event: 'career-msis',
    kind: 'education',
    branch: 'education/msis',
    message: 'init: start MSc in Information Systems',
    tone: 'orange',
    stack: [
      { name: 'Python', icon: 'python' },
      { name: 'PyTorch', icon: 'pytorch' },
      { name: 'Hugging Face', icon: 'huggingface' },
      { name: 'Apache Kafka', icon: 'apachekafka' },
      { name: 'Apache Spark', icon: 'apachespark' },
      { name: 'Delta Lake' },
      { name: 'Apache Airflow', icon: 'apacheairflow' },
      { name: 'AWS SageMaker' },
      { name: 'Terraform', icon: 'terraform' },
      { name: 'Streamlit', icon: 'streamlit' },
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
    branch: 'education/uit',
    tone: 'yellow',
    stack: [{ name: 'C++', icon: 'cplusplus' }],
  },
];
