import rss from '@astrojs/rss';
import { SITE } from '~/config/site';
import { type Post, postUrl } from './content';

const AUTHOR = `${SITE.email} (${SITE.author})`;

/**
 * RSS 2.0 feed with the v1 `scripts/rss.mjs` structure: channel link `/blog`, items linked
 * (and guid'd) at `https://karhdo.dev/blog/{id}`, original tag labels as categories.
 * `posts` must already be published-only and sorted newest first.
 */
export function buildFeed(posts: readonly Post[], selfPath: string): Promise<Response> {
  const newest = posts[0]?.data.date;
  return rss({
    title: SITE.title,
    description: SITE.description,
    // `site` is the channel <link>; item links are absolute so they don't resolve against it.
    site: `${SITE.siteUrl}/blog`,
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: [
      `<language>${SITE.language}</language>`,
      `<managingEditor>${AUTHOR}</managingEditor>`,
      `<webMaster>${AUTHOR}</webMaster>`,
      newest ? `<lastBuildDate>${newest.toUTCString()}</lastBuildDate>` : '',
      `<atom:link href="${SITE.siteUrl}${selfPath}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    items: posts.map((post) => ({
      title: post.data.title,
      link: `${SITE.siteUrl}${postUrl(post)}`,
      pubDate: post.data.date,
      description: post.data.summary,
      categories: post.data.tags,
      author: AUTHOR,
    })),
  });
}
