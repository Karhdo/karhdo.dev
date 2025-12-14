import { AreaChart } from 'lucide-react';

import siteMetadata from '@/data/siteMetadata';

const AnalyticsLink = () => {
  return (
    <button
      aria-label="Open analytics"
      type="button"
      className="dark:hover:bg-primary-600 mx-1 flex h-8 w-8 items-center justify-center rounded-sm p-1 hover:bg-gray-200"
      data-umami-event="nav-analytics"
      onClick={() => window.open(siteMetadata.analyticsURL, '_blank')}
    >
      <AreaChart strokeWidth={1.5} size={20} />
    </button>
  );
};

export default AnalyticsLink;
