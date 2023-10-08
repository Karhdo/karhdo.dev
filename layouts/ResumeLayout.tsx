import { ReactNode } from 'react';
import type { Authors } from 'contentlayer/generated';
import { TOCInline } from 'pliny/ui/TOCInline';
import { Toc } from 'pliny/mdx-plugins/remark-toc-headings';

import siteMetadata from '@/data/siteMetadata';
import { PageSEO } from '@/components/SEO';
import ScrollTopAndComment from '@/components/ScrollTopAndComment';

interface Props {
  children: ReactNode;
  toc: Toc;
  content: Omit<Authors, '_id' | '_raw' | 'body'>;
}

export default function AuthorLayout({ children, content, toc }: Props) {
  const { title, headerTitle } = siteMetadata;

  const description = 'My professional career, experiences, and skills.';

  return (
    <>
      <PageSEO title={`Resume - ${headerTitle} - ${title}`} description={description} />

      <ScrollTopAndComment showScrollToComment={false} />

      <div className="resume">
        <header className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Resume
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 md:text-lg md:leading-7">{description}</p>
        </header>

        <div className="border border-t border-gray-200 dark:border-gray-700" />

        <main className="mx-auto my-12 max-w-screen-xl gap-12 space-y-12 rounded-md bg-gray-100 p-3 md:flex md:space-y-0 md:p-8">
          <div className="table-of-content top-20 self-start pl-0 text-gray-500 md:sticky">
            <TOCInline toc={toc} toHeading={2} />
          </div>

          <div className="hidden border-l border-gray-300 md:block" />
          <div className="content prose prose-slate grow table-auto border-collapse space-y-5 text-justify leading-6 text-gray-900">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
