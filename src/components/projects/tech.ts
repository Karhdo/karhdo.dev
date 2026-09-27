/**
 * Project tech chips (task 17): `builtWith` label → simple-icons slug + Tokyonight tone.
 * Labels without a simple-icons logo (e.g. FeathersJS) are absent and render as text-only chips.
 */
import type { SimpleIconSlug } from '~/lib/simple-icons';

/** Literal tone classes so Tailwind generates them. */
export type ChipTone =
  | 'text-blue'
  | 'text-blue1'
  | 'text-cyan'
  | 'text-fg'
  | 'text-green'
  | 'text-orange'
  | 'text-purple'
  | 'text-red'
  | 'text-teal'
  | 'text-yellow';

const TECH: Record<string, { slug: SimpleIconSlug; tone: ChipTone }> = {
  react: { slug: 'react', tone: 'text-cyan' },
  bootstrap: { slug: 'bootstrap', tone: 'text-purple' },
  mysql: { slug: 'mysql', tone: 'text-blue1' },
  rabbitmq: { slug: 'rabbitmq', tone: 'text-orange' },
  nestjs: { slug: 'nestjs', tone: 'text-red' },
  postgresql: { slug: 'postgresql', tone: 'text-blue1' },
  jwt: { slug: 'jsonwebtokens', tone: 'text-purple' },
  vuejs: { slug: 'vuedotjs', tone: 'text-green' },
  tailwind: { slug: 'tailwindcss', tone: 'text-cyan' },
  astro: { slug: 'astro', tone: 'text-orange' },
  bun: { slug: 'bun', tone: 'text-yellow' },
  drizzle: { slug: 'drizzle', tone: 'text-green' },
  typescript: { slug: 'typescript', tone: 'text-blue' },
  umami: { slug: 'umami', tone: 'text-fg' },
  php: { slug: 'php', tone: 'text-purple' },
  laravel: { slug: 'laravel', tone: 'text-red' },
  javascript: { slug: 'javascript', tone: 'text-yellow' },
  jquery: { slug: 'jquery', tone: 'text-blue' },
  threejs: { slug: 'threedotjs', tone: 'text-fg' },
};

export function techIcon(label: string): { slug: SimpleIconSlug; tone: ChipTone } | undefined {
  return TECH[label.toLowerCase().replace(/[^a-z0-9]/g, '')];
}
