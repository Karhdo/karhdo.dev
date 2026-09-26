/** Career details partials keyed by `Experience.event` (see `src/config/experiences.ts`). */
import type { ExperienceEvent } from '~/config/experiences';
import Qkit from './Qkit.astro';
import Spartan from './Spartan.astro';
import Uit from './Uit.astro';
import YounetMedia from './YounetMedia.astro';

export const EXPERIENCE_DETAILS: Record<ExperienceEvent, typeof Spartan> = {
  'career-spartan': Spartan,
  'career-younetmedia': YounetMedia,
  'career-qkit': Qkit,
  'career-uit': Uit,
};
