/**
 * `/og/{slug}.png` for every published post plus `/og/default.png`: 1200 × 630 Open Graph cards,
 * rendered once at build (prerendered static files; never a function).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { SITE } from '~/config/site';
import { getPublishedPosts, getReadingTime, type Post } from '~/lib/content';
import { type OgCardInput, renderOgImage } from '~/lib/og/render';
import { formatDate } from '~/lib/utils/format-date';

export const prerender = true;

export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  if (posts.some((post) => post.id === 'default')) {
    throw new Error('A published post has the id "default", which collides with the site card /og/default.png.');
  }
  return [
    ...posts.map((post) => ({ params: { slug: post.id }, props: { post } })),
    { params: { slug: 'default' }, props: { post: undefined } },
  ];
}) satisfies GetStaticPaths;

function cardFor(post: Post | undefined): OgCardInput {
  if (!post) {
    return { title: SITE.headerTitle, subtitle: SITE.description, eyebrow: 'Coding adventure', author: SITE.fullName };
  }
  return {
    title: post.data.title,
    eyebrow: 'Blog post',
    date: formatDate(post.data.date),
    readingMinutes: getReadingTime(post.body ?? '').minutes,
    tags: post.data.tags,
    author: SITE.author,
  };
}

export const GET: APIRoute<{ post: Post | undefined }> = async ({ props }) => {
  const png = await renderOgImage(cardFor(props.post));
  // No Cache-Control: prerendered files are served by the CDN, and unhashed /og/<slug>.png must not be immutable.
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
