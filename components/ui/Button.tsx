import clsx from 'clsx';

const Button = ({
  children,
  as: Component = 'button',
  className,
  ...rest
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}) => {
  return (
    <Component
      className={clsx([
        'border border-transparent',
        'dark:bg-primary-600 bg-gray-200 hover:opacity-80',
        'text-black! hover:text-black! dark:text-white! dark:hover:text-white!',
        'focus:shadow-outline-blue focus:outline-hidden',
        'transition-colors duration-150',
        'text-sm leading-5 font-medium',
        'inline rounded-lg px-4 py-2 shadow-sm',
        'inline-flex items-center gap-1 no-underline',
        className,
      ])}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Button;
