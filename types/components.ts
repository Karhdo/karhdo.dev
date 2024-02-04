import type readingTime from 'reading-time';
import type { ImageProps as NextImageProps } from 'next/image';

import type projectsData from '@/data/projectsData';

export interface ImageProps extends NextImageProps {
  shouldOpenLightbox?: boolean;
}

export interface ImageLightBoxProps extends Pick<NextImageProps, 'src'> {
  closeLightbox: () => void;
}

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
