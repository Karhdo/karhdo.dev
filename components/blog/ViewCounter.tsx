/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect } from 'react';

import { useBlogStats, useUpdateBlogStats } from 'hooks';

import type { ViewCounterProps } from '@/types/components';

const ViewCounter = ({ type, slug, className }: ViewCounterProps) => {
  const [stats, isLoading] = useBlogStats(type, slug);
  const updateView = useUpdateBlogStats();

  useEffect(() => {
    if (!isLoading && stats) {
      updateView({ type, slug, views: stats['views'] + 1 });
    }
  }, [stats, isLoading]);

  return <span className={className}>{stats['views'] > 0 ? stats['views'].toLocaleString() : '---'} views</span>;
};

export default ViewCounter;
