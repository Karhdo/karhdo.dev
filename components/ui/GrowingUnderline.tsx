import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

interface GrowingUnderlineProps {
  children: React.ReactNode;
  as?: React.ElementType;
  active?: boolean;
  className?: string;
  duration?: number;
}

const GrowingUnderline: React.FC<GrowingUnderlineProps> = (props) => {
  const { children, as: Component = 'span', active = false, className, duration, ...rest } = props;

  return (
    <Component
      className={clsx([
        'bg-linear-to-r bg-bottom-left bg-no-repeat dark:bg-linear-to-l',
        'transition-[background-size] duration-(--duration,300ms)',
        'from-gray-500 to-slate-400',
        'dark:to-primary-600 dark:from-blue-800',
        active
          ? 'bg-size-[100%_0.15em] hover:bg-size-[100%_0.25em]'
          : 'bg-size-[0%_0.15em] hover:bg-size-[100%_0.25em]',
        className,
      ])}
      style={{ '--duration': `${duration || 300}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default GrowingUnderline;
