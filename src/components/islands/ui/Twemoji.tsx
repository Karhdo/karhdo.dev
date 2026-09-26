import { clsx } from 'clsx';
import { emojiCodepoint, emojiLabel, emojiSrc, TWEMOJI_SIZE_CLASS, type TwemojiSize } from '~/lib/emoji';

interface TwemojiProps {
  emoji: string;
  size?: TwemojiSize;
  className?: string;
}

/**
 * React twin of `ui/Twemoji.astro` for islands (e.g. Reactions). Unknown names render nothing.
 * Uses clsx rather than `cn` to keep tailwind-merge out of the client bundle.
 */
export default function Twemoji({ emoji, size = 'lg', className }: TwemojiProps) {
  const codepoint = emojiCodepoint(emoji);
  if (!codepoint) {
    if (import.meta.env.DEV) console.warn(`[Twemoji] Unknown emoji "${emoji}".`);
    return null;
  }
  return (
    <img
      src={emojiSrc(codepoint)}
      alt={emojiLabel(emoji)}
      width={36}
      height={36}
      loading="lazy"
      decoding="async"
      className={clsx('twemoji', `twemoji-${size}`, 'inline-block', TWEMOJI_SIZE_CLASS[size], className)}
    />
  );
}
