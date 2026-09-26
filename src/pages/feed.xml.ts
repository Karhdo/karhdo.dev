import type { APIRoute } from 'astro';
import { getPublishedPosts } from '~/lib/content';
import { buildFeed } from '~/lib/rss';

export const prerender = true;

export const GET: APIRoute = async () => buildFeed(await getPublishedPosts(), '/feed.xml');
