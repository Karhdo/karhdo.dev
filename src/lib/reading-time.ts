import readingTime from 'reading-time';

export type ReadingTime = { text: string; minutes: number; words: number };

/** Reading time of a raw MDX/markdown body (v1: `reading-time` via contentlayer computed field). */
export function getReadingTime(body: string): ReadingTime {
  const { text, minutes, words } = readingTime(body);
  return { text, minutes, words };
}
