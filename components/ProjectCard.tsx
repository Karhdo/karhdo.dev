import useSWR from 'swr';

import type { GithubRepository } from '@/types/server';
import type { ProjectCardProps } from '@/types/components';
import { fetcher } from '@/utils/fetcher';

import GithubRepo from './GithubRepo';
import Image from './Image';
import Link from './Link';

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { title, description, imgSrc, url, repo, builtWith } = project;

  const { data } = useSWR(`/api/github?repo=${repo}`, fetcher);

  const repository: GithubRepository = data?.repository;

  const href = repository?.url || url;

  return (
    <div className="md max-w-[544px] p-4 md:w-1/2">
      <div
        className={`${
          imgSrc && 'h-full'
        }  flex h-full flex-col overflow-hidden rounded-lg border border-transparent shadow-nextjs dark:shadow-nextjs-dark`}
      >
        <Image
          alt={title}
          src={imgSrc}
          className="object-cover object-center md:h-36 lg:h-60"
          width={1088}
          height={612}
        />

        <div className="p-6">
          <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
            {href ? (
              <Link href={href} aria-label={`Link to ${title}`}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h2>
          <p className="prose mb-3 max-w-none text-gray-500 dark:text-gray-400">
            {repository?.description || description}
          </p>

          <div className="mb-3 flex flex-wrap space-x-1.5">
            <span className="shrink-0">Built with: </span>
            {builtWith?.map((tool, index) => {
              return (
                <span key={index} className="font-semibold text-gray-600 dark:text-gray-300">
                  {tool}
                  {index !== builtWith.length - 1 && ','}
                </span>
              );
            })}
            .
          </div>
          {repository ? (
            <GithubRepo repo={repository} />
          ) : (
            href && (
              <Link
                href={href}
                className="text-base font-medium leading-6 text-primary hover:text-sky-600 dark:hover:text-sky-400"
                aria-label={`Link to ${title}`}
              >
                Learn more &rarr;
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
