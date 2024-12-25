import { Link } from '@/components/ui';

interface BlogNavProps {
  next?: { path: string; title: string };
  nextLabel?: string;
  prev?: { path: string; title: string };
  prevLabel?: string;
}

const NavLabel = ({ label }: { label?: string }) => {
  if (label) {
    return <span className="tracking-wide text-gray-500 dark:text-gray-400">{label}</span>;
  }

  return null;
};

const PostNav = (props: BlogNavProps) => {
  const { next, nextLabel = 'Next post', prev, prevLabel = 'Previous post' } = props;

  if (!prev && !next) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 py-4 md:flex-row md:justify-between md:gap-12 xl:py-8">
      {prev && prev.path ? (
        <div className="flex flex-col gap-1">
          <NavLabel label={`←  ${prevLabel}`} />

          <Link href={`/${prev.path}`}>
            <div data-umami-event="post-nav-prev">{prev.title}</div>
          </Link>
        </div>
      ) : (
        <div />
      )}
      {next && next.path && (
        <div className="flex flex-col items-end gap-1 text-right">
          <NavLabel label={`${nextLabel}  →`} />

          <Link href={`/${next.path}`}>
            <div data-umami-event="post-nav-next">{next.title}</div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default PostNav;
