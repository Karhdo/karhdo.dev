'use client';

import { useTheme } from 'next-themes';
import GiscusComponent from '@giscus/react';

import SITE_METADATA from '@/data/siteMetadata';
import { CommentsProps, GiscusConfigs } from '@/types/index';

export default function Comments(props: CommentsProps) {
  const { configs, className } = props;

  const defaultConfigs = SITE_METADATA.comments.giscusConfig as GiscusConfigs;
  const {
    themeURL,
    theme,
    darkTheme,
    repo,
    repositoryId,
    category,
    categoryId,
    reactions,
    metadata,
    inputPosition,
    lang,
    mapping,
  } = { ...defaultConfigs, ...configs };

  const { theme: siteTheme, resolvedTheme } = useTheme();
  const commentsTheme =
    themeURL === '' ? (siteTheme === 'dark' || resolvedTheme === 'dark' ? darkTheme : theme) : themeURL;

  return (
    <div id="comments" className={className}>
      <GiscusComponent
        id="comments-container"
        repo={repo}
        repoId={repositoryId}
        category={category}
        categoryId={categoryId}
        mapping={mapping}
        reactionsEnabled={reactions}
        emitMetadata={metadata}
        inputPosition={inputPosition}
        theme={commentsTheme}
        lang={lang}
        loading="lazy"
      />
    </div>
  );
}
