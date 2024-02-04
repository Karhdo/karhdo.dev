import { useState } from 'react';
import NextImage from 'next/image';
import clsx from 'clsx';

import type { ImageProps } from '@/types/components';
import ImageLightbox from '@/components/ImageLightbox';

import { LOGO_IMAGE_PATH, BLUR_IMAGE_DATA_URL } from '@/constants/index';
const Image = ({ shouldOpenLightbox = true, ...rest }: ImageProps) => {
  let blurDataURL = '';

  if (rest.src !== LOGO_IMAGE_PATH) {
    blurDataURL = BLUR_IMAGE_DATA_URL;
  }

  const [openLightbox, setOpenLightbox] = useState(false);

  const handleOpenLightbox = () => {
    if (!shouldOpenLightbox) {
      return;
    }

    document.documentElement.classList.add('lightbox-loading');

    setOpenLightbox(true);
  };

  const isThumb = rest.id === 'thumbnail-image';

  const className = clsx('flex justify-center', isThumb && 'thumbnail-image', shouldOpenLightbox && 'cursor-zoom-in');

  return (
    <>
      <div className={className} data-umami-event={isThumb ? 'view-post-thumbnail' : 'view-image-in-lightbox'}>
        <NextImage {...rest} blurDataURL={blurDataURL} onClick={handleOpenLightbox} />
      </div>
      {openLightbox && <ImageLightbox closeLightbox={() => setOpenLightbox(false)} src={rest.src} />}
    </>
  );
};

export default Image;
