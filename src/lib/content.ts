import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { countTags, type TagCount, tagSlug } from './tags';

export { getReadingTime } from './reading-time';

export type Post = CollectionEntry<'blog'>;
export type Author = CollectionEntry<'authors'>;

/** Posts sorted by `date` desc (v1 `sortPosts`); drafts are excluded in production builds. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', (post) => (import.meta.env.PROD ? !post.data.draft : true));
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** v1 semantics: `prev` = older post (index + 1), `next` = newer post (index - 1). */
export async function getPostNeighbours(id: string): Promise<{ prev: Post | undefined; next: Post | undefined }> {
  const posts = await getPublishedPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return { prev: undefined, next: undefined };
  return { prev: posts[index + 1], next: index > 0 ? posts[index - 1] : undefined };
}

/** Tag slug → `{ label, count }` over published posts (replaces v1 `app/tag-data.json`). */
export async function getTagCounts(): Promise<Record<string, TagCount>> {
  // getPublishedPosts() already applies the draft rule (drafts visible in dev only).
  return countTags(await getPublishedPosts(), { includeDrafts: true });
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => post.data.tags.some((tag) => tagSlug(tag) === slug));
}

export async function getAuthor(id = 'default'): Promise<Author | undefined> {
  return getEntry('authors', id);
}

export function postUrl(post: Pick<Post, 'id'>): string {
  return `/blog/${post.id}`;
}
