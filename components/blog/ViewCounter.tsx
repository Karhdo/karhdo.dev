import { useEffect } from 'react';

import type { ViewCounterProps } from '@/types/components';
import type { ViewApiResponse } from '@/types/server';
import { fetcher } from '@/utils/fetcher';

const { default: useSWR } = require('swr');

const ViewCounter = ({ slug, className }: ViewCounterProps) => {
  const { data } = useSWR(`/api/views/${slug}`, fetcher) as ViewApiResponse;

  const views = Number(data?.total || 0);

  useEffect(() => {
    const registerView = () => fetch(`/api/views/${slug}`, { method: 'POST' });

    registerView();
  }, [slug]);

  return <span className={className}>{views > 0 ? views.toLocaleString() : '---'} views</span>;
};

export default ViewCounter;
