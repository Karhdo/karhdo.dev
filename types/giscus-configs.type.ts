import type { BooleanString, InputPosition, Mapping } from '@giscus/react';

export default interface GiscusConfigs {
  themeURL: string;
  theme: string;
  darkTheme: string;
  mapping: Mapping;
  repo: `${string}/${string}`;
  repositoryId: string;
  category: string;
  categoryId: string;
  reactions: BooleanString;
  metadata: BooleanString;
  inputPosition: InputPosition;
  lang: string;
}
