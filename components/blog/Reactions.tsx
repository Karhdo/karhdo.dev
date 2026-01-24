'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useBlogStats, useUpdateBlogStats } from 'hooks/use-blog-stats';

import type { Stats, StatsType } from '@/types/prisma';

import Twemoji from '@/components/ui/Twemoji';

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

interface ReactionState {
  loves: number;
  ideas: number;
  applauses: number;
  bullseye: number;
}

const DEFAULT_REACTIONS: ReactionState = {
  loves: 0,
  ideas: 0,
  applauses: 0,
  bullseye: 0,
};

const MAX_REACTIONS = 5;

const REACTIONS: Array<{ emoji: string; key: keyof ReactionState }> = [
  { emoji: 'sparkling-heart', key: 'loves' },
  { emoji: 'clapping-hands', key: 'applauses' },
  { emoji: 'bullseye', key: 'bullseye' },
  { emoji: 'light-bulb', key: 'ideas' },
];

// Helper to get localStorage data (client-localstorage-schema)
function getStoredReactions(storageKey: string): ReactionState {
  if (typeof window === 'undefined') return DEFAULT_REACTIONS;
  try {
    const stored = localStorage.getItem(storageKey);
    const data: ReactionState = stored ? JSON.parse(stored) : DEFAULT_REACTIONS;
    return {
      loves: data.loves || 0,
      ideas: data.ideas || 0,
      applauses: data.applauses || 0,
      bullseye: data.bullseye || 0,
    };
  } catch {
    return DEFAULT_REACTIONS;
  }
}

const Reaction = (props: ReactionProps) => {
  const { emoji, value, reactions, onReact, onSave } = props;

  const [reacting, setReacting] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount (rerender-move-effect-to-event)
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleReact() {
    if (typeof value === 'number') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setReacting(true);
      const newReactions = reactions >= MAX_REACTIONS ? MAX_REACTIONS : reactions + 1;
      onReact(newReactions);
      if (countRef.current && reactions >= MAX_REACTIONS) {
        countRef.current.classList.add('animate-scale-up');
        setTimeout(() => {
          countRef.current?.classList.remove('animate-scale-up');
        }, 150);
      }
    }
  }

  function handleMouseLeave() {
    if (typeof value === 'number' && reacting) {
      timeoutRef.current = setTimeout(() => {
        setReacting(false);
        onSave();
      }, 1000);
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

  // Cache localStorage key (client-localstorage-schema)
  const storageKey = `${type}/${slug}`;

  // Use lazy initial state to avoid setState in effect (rerender-lazy-state-init)
  const [state, setState] = useState<{ reactions: ReactionState; initial: ReactionState }>(() => {
    const stored = getStoredReactions(storageKey);
    return { reactions: stored, initial: stored };
  });

  const updateReaction = useUpdateBlogStats();

  // Use useCallback to create stable callback references (rerender-functional-setstate)
  const handleOnSave = useCallback(
    (key: keyof ReactionState) => {
      const typedStats = stats as Stats;
      const newValue = typedStats[key] + state.reactions[key] - state.initial[key];
      updateReaction({ slug, type, [key]: newValue });

      localStorage.setItem(storageKey, JSON.stringify(state.reactions));
    },
    [slug, type, stats, state, updateReaction, storageKey]
  );

  const handleReact = useCallback((key: keyof ReactionState, value: number) => {
    setState((prev) => ({
      ...prev,
      reactions: { ...prev.reactions, [key]: value },
    }));
  }, []);

  return (
    <div className={clsx('flex items-center gap-6', className)}>
      {REACTIONS.map(({ key, emoji }) => {
        const typedStats = stats as Stats;
        const displayValue = isLoading ? '--' : typedStats[key] + state.reactions[key] - state.initial[key];

        return (
          <Reaction
            key={key}
            emoji={emoji}
            reactions={state.reactions[key]}
            value={displayValue}
            onSave={() => handleOnSave(key)}
            onReact={(value) => handleReact(key, value)}
          />
        );
      })}
    </div>
  );
};

export default Reactions;
