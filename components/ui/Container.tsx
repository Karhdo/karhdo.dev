import clsx from 'clsx';
import type { ElementType, ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

const Container: React.FC<ContainerProps> = (props) => {
  const { as: Component = 'section', children, className } = props;

  return (
    <Component className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 xl:px-12', className)}>{children}</Component>
  );
};

export default Container;
