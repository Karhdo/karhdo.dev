import { map, kebabCase, capitalize } from 'lodash';
import { getAllTags } from 'pliny/utils/contentlayer';
import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';

import siteMetadata from '@/data/siteMetadata';
import { PageSEO } from '@/components/SEO';
import ListLayoutWithTags from '@/layouts/ListLayoutWithTags';
import { TagCounts } from '@/types/server';

export async function getStaticPaths() {
  const tags = await getAllTags(allBlogs);

  const tagNames = Object.keys(tags);

  const paths = map(tagNames, (tag) => ({
    params: { tag },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { tag: string } }) {
  const filteredBlogs = allBlogs.filter(
    (blog) => blog.draft !== true && blog.tags.map((tag) => kebabCase(tag)).includes(params.tag)
  );

  const tagCounts = await getAllTags(filteredBlogs);

  return {
    props: {
      blogs: filteredBlogs,
      tag: params.tag,
      tagCounts,
    },
  };
}

export default function Tag({ blogs, tag, tagCounts }: { blogs: Blog[]; tag: string; tagCounts: TagCounts }) {
  if (!tag) {
    return <div>No tags found.</div>;
  }

  const { title, headerTitle, description } = siteMetadata;

  return (
    <>
      <PageSEO title={`Blog - ${headerTitle} - ${title}`} description={description} />

      <ListLayoutWithTags posts={blogs} tagCounts={tagCounts} title={`Tag: ${capitalize(tag)}`} />
    </>
  );
}
