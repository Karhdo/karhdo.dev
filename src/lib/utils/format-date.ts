import { SITE } from '~/config/site';

/**
 * v1 pliny `formatDate`: `December 10, 2023`.
 * Frontmatter dates are date-only strings parsed as UTC midnight, so format in UTC
 * to avoid an off-by-one day in time zones west of UTC.
 */
export function formatDate(date: Date | string | number, locale: string = SITE.locale): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
