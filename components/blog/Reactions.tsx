/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { useBlogStats, useUpdateBlogStats } from 'hooks';

import { Stats, StatsType } from '@prisma/client';

import { Twemoji } from '@/components/ui';

interface ReactionProps {
  emoji: string;
  value: string | number;
  reactions: number;
  onReact: (value: number) => void;
  onSave: () => void;
}

interface ReactionsProps {
  slug: string;
  type: StatsType;
  className?: string;
}

const MAX_REACTIONS = 5;

const REACTIONS: Array<{ emoji: string; key: keyof Stats }> = [
  { emoji: 'sparkling-heart', key: 'loves' },
  { emoji: 'clapping-hands', key: 'applauses' },
  { emoji: 'bullseye', key: 'bullseye' },
  { emoji: 'light-bulb', key: 'ideas' },
];

const Reaction = (props: ReactionProps) => {
  const { emoji, value, reactions, onReact, onSave } = props;

  const [reacting, setReacting] = useState(false);

  const countRef = useRef<HTMLSpanElement>(null);

  let reactingTimeoutId: ReturnType<typeof setTimeout> | undefined;

  function handleReact() {
    if (typeof value === 'number') {
      if (reactingTimeoutId) {
        clearTimeout(reactingTimeoutId);
      }
      setReacting(true);
      const newReactions = reactions >= MAX_REACTIONS ? MAX_REACTIONS : reactions + 1;
      onReact(newReactions);
      if (countRef.current) {
        if (reactions >= MAX_REACTIONS) {
          countRef.current.classList.add('animate-scale-up');
          setTimeout(() => {
            if (countRef.current) {
              countRef.current.classList.remove('animate-scale-up');
            }
          }, 150);
        }
      }
    }
  }

  function handleMouseLeave() {
    if (typeof value === 'number') {
      if (reacting) {
        reactingTimeoutId = setTimeout(() => {
          setReacting(false);
          onSave();
        }, 1000);
      }
    }
  }

  return (
    <button
      onClick={handleReact}
      onMouseLeave={handleMouseLeave}
      className="relative flex flex-col items-center justify-center gap-1.5"
      data-umami-event="post-reaction"
    >
      <Twemoji emoji={emoji} size="2x" />
      <span className="relative h-6 w-8 overflow-hidden">
        <span
          className={clsx(
            'absolute inset-0',
            'font-semibold text-gray-600 dark:text-gray-300',
            'transition-all',
            reacting ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
          )}
        >
          {typeof value === 'string' ? '--' : value}
        </span>
        <span
          ref={countRef}
          className={clsx(
            'absolute inset-0',
            'text-gray-500 dark:text-gray-400',
            'transition-all',
            reacting ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          )}
        >
          +{reactions}
        </span>
      </span>
    </button>
  );
};

const Reactions = (props: ReactionsProps) => {
  const { type, slug, className } = props;

  const [stats, isLoading] = useBlogStats(type, slug);

  const [reactions, setReactions] = useState({});
  const [initialReactions, setInitialReactions] = useState({});

  const updateReaction = useUpdateBlogStats();

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(`${type}/slug`) || '{}');

      data.loves = data.loves || 0;
      data.ideas = data.ideas || 0;
      data.applauses = data.applauses || 0;
      data.bullseye = data.bullseye || 0;

      setInitialReactions(Object.assign({}, data));
      setReactions(Object.assign({}, data));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleOnSave = (key: string) => {
    updateReaction({ slug, type, [key]: stats[key] + reactions[key] - initialReactions[key] });

    localStorage.setItem(`${type}/slug`, JSON.stringify(reactions));
  };

  return (
    <div className={clsx('flex items-center gap-6', className)}>
      {REACTIONS.map(({ key, emoji }) => (
        <Reaction
          key={key}
          emoji={emoji}
          reactions={reactions[key]}
          value={isLoading ? '--' : stats[key] + reactions[key] - initialReactions[key]}
          onSave={() => handleOnSave(key)}
          onReact={(value) => setReactions((reactions) => ({ ...reactions, [key]: value }))}
        />
      ))}
    </div>
  );
};

export default Reactions;
