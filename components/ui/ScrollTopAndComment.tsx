'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { ChevronsUp, MessageSquareText } from 'lucide-react';

import siteMetadata from '@/data/siteMetadata';
import { ScrollButtonProps } from '@/types/index';

const ScrollButton = (props: ScrollButtonProps) => {
  const { onClick, ariaLabel, icon: Icon } = props;

  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={clsx([
        'rounded-lg p-2 transition-all',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'ring-1 ring-inset ring-zinc-900/20 dark:ring-white/20',
      ])}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

const ScrollTopAndComment = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.scrollY > 50) setShow(true);
      else setShow(false);
    };

    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0 });
  };

  const handleScrollToComment = () => {
    document.getElementById('comment')?.scrollIntoView();
  };

  return (
    <div className={`fixed bottom-8 right-8 hidden flex-col gap-3 ${show ? 'md:flex' : 'md:hidden'}`}>
      {siteMetadata.comments?.provider && (
        <ScrollButton icon={MessageSquareText} ariaLabel="Scroll To Comment" onClick={handleScrollToComment} />
      )}

      <ScrollButton icon={ChevronsUp} ariaLabel="Scroll To Top" onClick={handleScrollTop} />
    </div>
  );
};

export default ScrollTopAndComment;
