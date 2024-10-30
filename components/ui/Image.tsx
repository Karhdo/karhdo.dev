'use client';

import { clsx } from 'clsx';
import NextImage from 'next/image';

import type { ImageProps as NextImageProps } from 'next/image';

import { useImageLoadedState } from 'hooks';

export interface ImageProps extends Omit<NextImageProps, 'src' | 'priority'> {
  src: string;
}

const Image = (props: ImageProps) => {
  const { alt, src, loading = 'lazy', style, className, ...rest } = props;
  const [loaded, onLoad] = useImageLoadedState(src);

  return (
    <div
      className={clsx(
        'image-container relative overflow-hidden',
        !loaded && 'animate-pulse [animation-duration:4s]',
        className
      )}
    >
      <NextImage
        className={clsx(
          'transition-all duration-500 [transition-timing-function:cubic-bezier(.4,0,.2,1)]',
          'object-center',
          loaded ? 'blur-0' : 'blur-xl'
        )}
        src={src}
        alt={alt}
        style={{ objectFit: 'cover', ...style }}
        loading={loading}
        priority={loading === 'eager'}
        quality={100}
        onLoad={onLoad}
        {...rest}
      />
    </div>
  );
};

export default Image;
