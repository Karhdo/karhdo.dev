/** Mirrors the Postgres enum `"StatsType"` (v1 Prisma `StatsType`). */
export type StatsType = 'blog' | 'snippet';

/** Mirrors a row of the existing `stats` table (v1 Prisma `Stats` model). */
export type Stats = {
  type: StatsType;
  slug: string;
  views: number;
  loves: number;
  applauses: number;
  ideas: number;
  bullseye: number;
};
