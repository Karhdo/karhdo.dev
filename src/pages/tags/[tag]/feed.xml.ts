import type { APIRoute, GetStaticPaths } from 'astro';
import { getPostsByTag, getTagCounts } from '~/lib/content';
import { buildFeed } from '~/lib/rss';

export const prerender = true;

export const getStaticPaths = (async () => {
  const tags = Object.keys(await getTagCounts());
  return tags.map((tag) => ({ params: { tag } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const tag = params.tag as string;
  return buildFeed(await getPostsByTag(tag), `/tags/${tag}/feed.xml`);
};
