import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge taught the custom theme keys from src/styles/theme.css, so e.g. `rounded-card`
 * and `rounded-xl` (or `animate-rise` and `animate-none`) are recognised as conflicting.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['card'],
      shadow: ['card'],
      ease: ['spring'],
      animate: ['wave', 'music-bar-1', 'music-bar-2', 'music-bar-3', 'music-bar-4', 'scale-up', 'rise', 'shimmer'],
    },
  },
});

/** Join class names (clsx) and resolve conflicting Tailwind utilities (tailwind-merge): the last one wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
