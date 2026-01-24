import { ReactNode } from 'react';
import { CoreContent } from 'pliny/utils/contentlayer';
import type { Blog, Authors } from 'contentlayer/generated';

import { StatsType } from '@/types/prisma';

import siteMetadata from '@/data/siteMetadata';
import BlogTags from '@/components/blog/BlogTags';
import BlogMeta from '@/components/blog/BlogMeta';
import BlogNav from '@/components/blog/BlogNav';
import TableOfContents from '@/components/blog/TableOfContents';
import Reactions from '@/components/blog/Reactions';
import Comments from '@/components/ui/Comments';
import PageTitle from '@/components/ui/PageTitle';
import SectionContainer from '@/components/ui/SectionContainer';
import ScrollTopAndComment from '@/components/ui/ScrollTopAndComment';

interface LayoutProps {
  content: CoreContent<Blog>;
  authorDetails: CoreContent<Authors>[];
  next?: { path: string; title: string };
  prev?: { path: string; title: string };
  children: ReactNode;
}

export default function PostLayout(props: LayoutProps) {
  const { content, next, prev, children } = props;
  const { slug, toc, date, title, tags, readingTime, type } = content;

  return (
    <SectionContainer>
      <ScrollTopAndComment />

      <article>
        {/*START: Header*/}
        <header>
          <div className="dark:border-gray space-y-1 border-b border-gray-200 pb-10">
            <div className="space-y-6">
              <PageTitle>{title}</PageTitle>
              <BlogTags tags={tags} />
              <dl>
                <div>
                  <dt className="sr-only">Published on</dt>
                  <BlogMeta date={date} slug={slug} readingTime={readingTime} />
                </div>
              </dl>
            </div>
          </div>
        </header>
        {/*END: Header*/}

        {/*START: Content*/}
        <main className="grid grid-cols-1 gap-12 pt-8 lg:grid-cols-12 lg:pt-10">
          <div className="divide-y divide-gray-200 lg:col-span-8 xl:col-span-9 dark:divide-gray-700">
            <div className="prose dark:prose-dark lg:prose-lg max-w-none lg:pb-8">{children}</div>
          </div>

          <div className="hidden lg:col-span-4 lg:block xl:col-span-3">
            <div className="space-y-4 divide-y divide-gray-200 lg:sticky lg:top-16 dark:divide-gray-700">
              <TableOfContents toc={toc} />
              <Reactions className="pt-6" type={type.toLowerCase() as StatsType} slug={slug} />
            </div>
          </div>
        </main>
        {/*END: Content*/}

        {/*START: Footer*/}
        <footer>
          <BlogNav next={next} prev={prev} />

          {siteMetadata.comments && (
            <div className="pt-6 pb-6 text-center text-gray-700 dark:text-gray-300" id="comment">
              <Comments />
            </div>
          )}
        </footer>
        {/*END: Footer*/}
      </article>
    </SectionContainer>
  );
}
