/**
 * Career timeline entries, ported verbatim from v1 `components/about/CareerTimeline.tsx`.
 * The rich `details` bodies live in `src/components/about/experiences/*.astro`, keyed by `event`.
 */
import type { EmojiName } from '~/lib/emoji';

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
  },
];
