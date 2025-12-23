'use client';

import { CheckCheck, Circle, X } from 'lucide-react';
import useSWR from 'swr';

import { GrowingUnderline, Link } from '@/components/ui';
import SITE_METADATA from '@/data/siteMetadata';
import type { CommitState, GithubRepository } from '@/types/data';
import { fetcher, getTimeAgo } from '@/utils/misc';

export function LastCommit() {
  const siteRepo = SITE_METADATA.siteRepo.replace('https://github.com/', '');
  const { data: repo } = useSWR<GithubRepository>(`/api/github?repo=${siteRepo}`, fetcher);

  if (!repo?.lastCommit) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={repo.lastCommit.url} className="text-indigo-700 dark:text-indigo-400" title={repo.lastCommit.message}>
        <GrowingUnderline data-umami-event="repo-last-commit" className="flex items-center">
          #{repo.lastCommit.abbreviatedOid}
        </GrowingUnderline>
      </Link>
      <CommitStatus status={repo.lastCommit.status?.state} />
      <span className="text-gray-500 dark:text-gray-400">- committed {getTimeAgo(repo.lastCommit.committedDate)}</span>
    </div>
  );
}

function CommitStatus({ status }: { status: CommitState }) {
  switch (status) {
    case 'EXPECTED':
    case 'SUCCESS':
      return <CheckCheck size={16} strokeWidth={2} className="text-green-700" />;
    case 'PENDING':
      return <Circle size={12} strokeWidth={1.5} fill="green" className="animate-pulse text-[green]" />;
    case 'ERROR':
    case 'FAILURE':
      return <X size={16} strokeWidth={2} className="text-red-700" />;
    default:
      return null;
  }
}
