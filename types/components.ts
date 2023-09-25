import type readingTime from 'reading-time';

import type projectsData from '@/data/projectsData';

export type TwemojiProps = {
  emoji: string;
  size?: string;
  className?: string;
};

export type ProjectDataType = (typeof projectsData)[0];

export interface ProjectCardProps {
  project: ProjectDataType;
}

export type ReadingTime = ReturnType<typeof readingTime>;

export interface BlogMetaProps {
  date: string;
  slug: string;
  readingTime: ReadingTime;
}

export interface ViewCounterProps {
  slug: string;
  className?: string;
}
