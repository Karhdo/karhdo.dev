import clsx from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';

const variants = cva('twa inline-block', {
  variants: {
    size: {
      base: '',
      lg: 'twa-lg',
      '2x': 'twa-2x',
      '3x': 'twa-3x',
      '4x': 'twa-4x',
      '5x': 'twa-5x',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

interface TwemojiProps extends VariantProps<typeof variants> {
  emoji: string;
  className?: string;
}

const Twemoji = ({ emoji, size, className }: TwemojiProps) => (
  <i className={clsx(clsx(variants({ size }), `twa-${emoji}`), className)} />
);

export default Twemoji;
