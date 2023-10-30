import clsx from 'clsx';

const Greeting = () => {
  const className = clsx(
    'bg-gradient-to-r from-gray-500 to-slate-400 dark:bg-gradient-to-l dark:from-blue-800 dark:to-primary',
    'mb-8 bg-clip-text text-4xl font-extrabold leading-[60px] tracking-tight text-transparent md:text-7xl md:leading-[86px]'
  );

  return (
    <div className={className}>
      Hello, folks! <span className="font-bold">Discover my stories and creative ideas.</span>
    </div>
  );
};

export default Greeting;
