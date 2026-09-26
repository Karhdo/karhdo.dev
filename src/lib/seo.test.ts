import { describe, expect, test } from 'bun:test';
import { absoluteUrl, buildBlogPostingJsonLd, buildWebsiteJsonLd, pageTitle, serializeJsonLd } from './seo';

describe('absoluteUrl', () => {
  test('home has no trailing slash', () => {
    expect(absoluteUrl('/')).toBe('https://karhdo.dev');
  });
  test('paths are resolved against the site', () => {
    expect(absoluteUrl('/static/images/projects/karhdo-blog.png')).toBe(
      'https://karhdo.dev/static/images/projects/karhdo-blog.png'
    );
  });
  test('absolute URLs are kept', () => {
    expect(absoluteUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
  });
});

describe('pageTitle', () => {
  test('uses the v1 template', () => {
    expect(pageTitle()).toBe("Karhdo's Blog - Coding Adventure");
    expect(pageTitle('About')).toBe("About | Karhdo's Blog - Coding Adventure");
  });
});

describe('JSON-LD', () => {
  const post = {
    id: 'hello-world',
    data: {
      title: 'Hello',
      date: new Date('2024-01-02T00:00:00Z'),
      lastmod: undefined,
      summary: 'Sum',
      images: ['/static/images/a.png'],
    },
  };

  test('BlogPosting ports v1 structuredData with Person authors', () => {
    expect(buildBlogPostingJsonLd(post, { data: { name: 'Do Trong Khanh' } })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello',
      datePublished: '2024-01-02T00:00:00.000Z',
      dateModified: '2024-01-02T00:00:00.000Z',
      description: 'Sum',
      image: 'https://karhdo.dev/static/images/a.png',
      url: 'https://karhdo.dev/blog/hello-world',
      author: [{ '@type': 'Person', name: 'Do Trong Khanh' }],
    });
  });

  test('BlogPosting falls back to the site banner and author', () => {
    const ld = buildBlogPostingJsonLd({ ...post, data: { ...post.data, images: undefined } });
    expect(ld.image).toBe('https://karhdo.dev/static/images/projects/karhdo-blog.png');
    expect(ld.author).toEqual([{ '@type': 'Person', name: 'Trong Khanh' }]);
  });

  test('WebSite', () => {
    expect(buildWebsiteJsonLd()).toMatchObject({ '@type': 'WebSite', url: 'https://karhdo.dev' });
  });

  test('serialisation cannot close the script tag', () => {
    expect(serializeJsonLd({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}');
  });
});
