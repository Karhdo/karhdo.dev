import { GithubRepository } from './server';

export interface Project {
  type: 'work' | 'self';
  title: string;
  description?: string;
  imgSrc: string;
  url?: string;
  repo?: string | GithubRepository | null;
  builtWith: string[];
}
