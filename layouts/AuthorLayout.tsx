import { ReactNode } from 'react';
import type { Authors } from 'contentlayer/generated';
import { Mail, Linkedin, Github, Twitter } from 'lucide-react';

import Link from '@/components/ui/Link';
import Image from '@/components/ui/Image';
import Button from '@/components/ui/Button';
import Twemoji from '@/components/ui/Twemoji';

import CareerTimeline from '@/components/about/CareerTimeline';

interface Props {
  children: ReactNode;
  content: Omit<Authors, '_id' | '_raw' | 'body'>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AuthorLayout({ children, content }: Props) {
  const { name, avatar, occupation, company, email, twitter, linkedin, github } = content;

  return (
    <>
      <div className="about divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            About
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 md:text-lg md:leading-7">
            Further insights into who I am and the purpose of this blog.
          </p>
        </div>

        <div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:space-y-0">
          <div className="flex flex-col items-center space-x-2 pt-8 sm:pt-28">
            <Image src={avatar || ''} alt="avatar" width={192} height={192} className="h-48 w-48 rounded-full" />

            <h3 className="pb-2 pt-4 text-2xl font-bold leading-8 tracking-tight">{name}</h3>
            <div className="text-gray-500 dark:text-gray-400">{occupation}</div>
            <div className="text-gray-500 dark:text-gray-400">{company}</div>

            <div className="mt-2 flex gap-3">
              <Link href={`mailto:${email}`}>
                <Mail size={24} strokeWidth={1} />
              </Link>
              <Link href={github || ''} target="_blank">
                <Github size={24} strokeWidth={1} />
              </Link>
              <Link href={linkedin || ''} target="_blank">
                <Linkedin size={24} strokeWidth={1} />
              </Link>
              <Link href={twitter || ''} target="_blank">
                <Twitter size={24} strokeWidth={1} />
              </Link>
            </div>
          </div>

          {/* <div className="prose max-w-none pb-8 dark:prose-dark xl:col-span-2">{children}</div> */}

          <div className="prose max-w-none pb-8 dark:prose-dark xl:col-span-2">
            <h2>
              Hello, folks! <Twemoji className="mx-2" emoji="waving-hand" /> I'm Trong Khanh (aka Karhdo)
            </h2>

            <p>
              I have a passion for <strong>JavaScript/TypeScript</strong> and website development. I'm currently a
              fullstack developer at <strong>YouNet Media</strong>, deeply engaged in the <strong>EcomHeat</strong>{' '}
              project, which entails market share management, competitor research, and fostering e-commerce growth. I
              work mainly with <strong>JavaScript</strong>, <strong>TypeScript</strong>, <strong>React</strong>,{' '}
              <strong>NodeJS</strong>, <strong>NestJS</strong>, and <strong>NextJS</strong>.
            </p>

            <h2>Why have this blog?</h2>

            <blockquote>
              <p>My desire to practice my skills and share my acquired knowledge fuels my endeavors.</p>
            </blockquote>

            <p>
              I founded this blog as a means to document and share the knowledge and practical wisdom I've acquired
              during my journey as a software engineer.
            </p>
            <p>
              Writing and taking notes helps me solidify my understanding of new concepts and technologies. I hope my
              blog can be a useful resource for fellow web developers.
            </p>
            <p>
              I would greatly appreciate your thoughts and comments on what I have written{' '}
              <Twemoji emoji="clinking-beer-mugs" />.
            </p>

            <div className="flex items-center justify-between">
              <h2>My Career</h2>

              <Button href="/static/resume.pdf" target="_blank">
                <span>Resume</span>
                <Twemoji emoji="page-facing-up" />
              </Button>
            </div>

            <CareerTimeline />
          </div>
        </div>
      </div>
    </>
  );
}
