import clsx from 'clsx';

import { Twemoji } from '@/components/Twemoji';

const Greeting = () => {
  const className = clsx(
    'bg-gradient-to-r from-yellow-600 to-red-600 dark:bg-gradient-to-l dark:from-blue-800 dark:to-sky-500',
    'mb-8 bg-clip-text text-4xl font-extrabold leading-[60px] tracking-tight text-transparent md:text-7xl md:leading-[86px]'
  );

  return (
    <div className={className}>
      Hello, folks! <Twemoji emoji="waving-hand" size="twa" />
    </div>
  );
};

export default Greeting;
