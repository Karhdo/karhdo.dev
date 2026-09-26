import { slug } from 'github-slugger';

export type TagCount = { label: string; count: number };

type TaggedPost = { data: { tags: string[]; draft?: boolean } };

/** URL slug of a tag label (v1: `github-slugger`), e.g. `design patterns` → `design-patterns`. */
export function tagSlug(label: string): string {
  return slug(label);
}

/**
 * Counts posts per tag slug (replaces v1 `createTagCount` / `app/tag-data.json`).
 * `label` is the first label seen for that slug.
 */
export function countTags(posts: readonly TaggedPost[], { includeDrafts = false } = {}): Record<string, TagCount> {
  const counts: Record<string, TagCount> = {};
  for (const post of posts) {
    if (!includeDrafts && post.data.draft === true) continue;
    for (const label of post.data.tags) {
      const key = tagSlug(label);
      const entry = counts[key];
      if (entry) entry.count += 1;
      else counts[key] = { label, count: 1 };
    }
  }
  return counts;
}
