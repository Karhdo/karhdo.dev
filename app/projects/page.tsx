import { genPageMetadata } from 'app/seo';

import projectsData from '@/data/projectsData';
import { fetchRepoData } from '@/servers/github.server';
import ProjectCard from '@/components/project/ProjectCard';

export const metadata = genPageMetadata({ title: 'Projects' });

export default async function Projects() {
  // Create new array instead of mutating imported data (server-dedup-props)
  // Fetch all repo data in parallel (async-parallel)
  const projects = await Promise.all(
    projectsData.map(async (p) => {
      if (p.repo && typeof p.repo === 'string') {
        const repoData = await fetchRepoData({
          repo: p.repo,
          includeLastCommit: false,
        });
        return { ...p, repo: repoData };
      }
      return p;
    })
  );

  const description = 'My open-source side projects and stuff that I built with my colleagues at work';

  // Combine filter operations for better performance (js-combine-iterations)
  const workProjects: typeof projects = [];
  const sideProjects: typeof projects = [];

  for (const project of projects) {
    if (project.type === 'work') {
      workProjects.push(project);
    } else if (project.type === 'self') {
      sideProjects.push(project);
    }
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pt-6 pb-8 md:space-y-5">
          <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
            Projects
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        <div className="container py-12">
          <h3 className="mb-4 text-3xl leading-9 font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Work
          </h3>
          <div className="-m-4 flex flex-wrap">
            {workProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>

        <div className="container py-12">
          <h3 className="mb-4 text-3xl leading-9 font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Side projects
          </h3>
          <div className="-m-4 flex flex-wrap">
            {sideProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
