import find from 'lodash/find';
import { ExternalLink, GitFork, Github, Star } from 'lucide-react';

import type { GithubRepository } from '@/types/server';

export default function GithubRepo({ repo }: { repo: GithubRepository }) {
  const mainLanguage = find(repo.languages, (language) => language.name !== 'CSS');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: mainLanguage.color }} />
          <span>{mainLanguage.name}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Star size={20} strokeWidth={1} />
          <span>{repo.stargazerCount}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <GitFork size={20} strokeWidth={1} />
          <span>{repo.forkCount}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {repo.homepageUrl && (
          <>
            <a
              href={repo.homepageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center"
              data-umami-event="project-demo"
            >
              <ExternalLink size={20} strokeWidth={1} />
            </a>
            <span className="text-gray-400 dark:text-gray-500">|</span>
          </>
        )}
        <a
          href={repo.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center space-x-1"
          data-umami-event="project-repo"
        >
          <Github size={20} strokeWidth={1} />
        </a>
      </div>
    </div>
  );
}
