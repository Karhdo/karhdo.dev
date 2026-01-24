'use client';

import dynamic from 'next/dynamic';
import { formatDate } from 'pliny/utils/formatDate';

import siteMetadata from '@/data/siteMetadata';
import Tag from '@/components/ui/Tag';
import Link from '@/components/ui/Link';
import Twemoji from '@/components/ui/Twemoji';
import Avatar from '@/components/homepage/Avatar';
import Heading from '@/components/homepage/Heading';
import Greeting from '@/components/homepage/Greeting';
import BlogLinks from '@/components/homepage/BlogLinks';
import PopularTags from '@/components/homepage/PopularTags';
import ShortDescription from '@/components/homepage/ShortDescription';
import SpotifyNowPlaying from '@/components/homepage/SpotifyNowPlaying';

// Dynamic imports for heavy components (bundle-dynamic-imports)
const Snowfall = dynamic(() => import('react-snowfall'), { ssr: false });
const TypedBios = dynamic(() => import('@/components/homepage/TypedBios'), { ssr: false });

const MAX_DISPLAY = 5;

export default function Home({ posts }) {
  return (
    <div className="relative">
      <Snowfall
        snowflakeCount={119}
        speed={[0.4, 2]}
        wind={[-0.2, 0.4]}
        radius={[0.5, 2]}
        opacity={[0.15, 0.4]}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />

      {/* Introduce myself */}
      <div className="mt-8 md:mt-8 dark:divide-gray-700">
        <Greeting />
        <div className="flex flex-col justify-between md:my-4 md:pb-8 xl:flex-row">
          <Avatar />
          <div className="my-auto flex flex-col text-lg leading-8 text-gray-600 dark:text-gray-400">
            <Heading />
            <TypedBios />
            <ShortDescription />
            <BlogLinks />
            <SpotifyNowPlaying />
            <p className="flex">
              <span className="mr-2">Happy reading</span>
              <Twemoji emoji="clinking-beer-mugs" />
            </p>
          </div>
        </div>
      </div>

      <PopularTags />

      {/* List all post */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 py-6 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14 dark:text-gray-100">
            Recent Posts
          </h1>
          <p className="mt-2! text-lg leading-7 text-gray-500 dark:text-gray-400">{siteMetadata.description}</p>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {!posts.length && 'No posts found.'}
          {posts.slice(0, MAX_DISPLAY).map((post) => {
            const { slug, date, title, summary, tags } = post;
            return (
              <li key={slug} className="py-6">
                <article>
                  <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base leading-6 font-medium text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date, siteMetadata.locale)}</time>
                      </dd>
                    </dl>
                    <div className="space-y-5 xl:col-span-3">
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl leading-8 font-bold tracking-tight">
                            <Link href={`/blog/${slug}`} className="text-gray-900 dark:text-gray-100">
                              {title}
                            </Link>
                          </h2>
                          <div className="flex flex-wrap">
                            {tags.map((tag) => (
                              <Tag key={tag} text={tag} />
                            ))}
                          </div>
                        </div>
                        <div className="prose max-w-none text-gray-500 dark:text-gray-400">{summary}</div>
                      </div>
                      <div className="text-base leading-6 font-medium">
                        <Link
                          href={`/blog/${slug}`}
                          className="text-primary hover:text-sky-600 dark:hover:text-sky-400"
                          aria-label={`Read "${title}"`}
                        >
                          Read more &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base leading-6 font-medium">
          <Link href="/blog" className="text-primary hover:text-sky-600 dark:hover:text-sky-400" aria-label="All posts">
            All Posts &rarr;
          </Link>
        </div>
      )}

      {/* {siteMetadata.newsletter.provider && (
        <div className="flex items-center justify-center pt-4">
          <NewsletterForm />
        </div>
      )} */}
    </div>
  );
}
