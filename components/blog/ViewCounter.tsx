'use client';

import useSWR from 'swr';
import { useEffect } from 'react';

import type { ViewCounterProps } from '@/types/components';
import type { ViewApiResponse } from '@/types/server';
import { fetcher } from '@/utils/fetcher';

const ViewCounter = ({ slug, className }: ViewCounterProps) => {
  const { data } = useSWR<ViewApiResponse>(`/api/views/${slug}`, fetcher);

  const views = Number(data?.total || 0);

  useEffect(() => {
    const registerView = () => fetch(`/api/views/${slug}`, { method: 'POST' });

    registerView();
  }, [slug]);

  return <span className={className}>{views > 0 ? views.toLocaleString() : '---'} views</span>;
};

export default ViewCounter;
