import type { ViewCounterProps } from '@/types/components'

const ViewCounter = ({ slug, className }: ViewCounterProps) => {
  const views = Number(119);

  return <span className={className}>
    {views > 0 ? views.toLocaleString() : '---'} views
  </span>
}

export default ViewCounter;
