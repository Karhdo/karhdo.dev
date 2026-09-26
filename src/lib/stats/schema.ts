/**
 * Input validation for `/api/stats` (pure: plain `zod`, no Astro virtual modules, so `bun test` loads it).
 *
 * POST takes DELTAS, not absolute values: `views` must be exactly 1 and each reaction an integer 1–5.
 * A stale v1 bundle posting absolute values (`{ views: 1235 }`, `{ loves: 9 }`) is rejected with 400
 * instead of being added. `type: 'snippet'` exists in the DB enum but v2 has no snippets, so it's 400 too.
 */
import { z } from 'zod';

export const MAX_REACTIONS = 5;

export const SLUG_PATTERN = /^[a-z0-9-]{1,255}$/;

const type = z.literal('blog');
const slug = z.string().regex(SLUG_PATTERN);
const reaction = z.int().min(1).max(MAX_REACTIONS).optional();

export const statsQuerySchema = z.object({ type, slug });

export const statsPostSchema = z
  .strictObject({
    type,
    slug,
    views: z.literal(1).optional(),
    loves: reaction,
    applauses: reaction,
    ideas: reaction,
    bullseye: reaction,
  })
  .refine(
    ({ views, loves, applauses, ideas, bullseye }) =>
      [views, loves, applauses, ideas, bullseye].some((v) => v !== undefined),
    { message: 'At least one counter is required' }
  );

export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type StatsPost = z.infer<typeof statsPostSchema>;
