import { useState } from 'react';
import { usePathname } from 'next/navigation';

const loadedImages: string[] = [];

const useImageLoadedState = (src: string) => {
  const pathname = usePathname();
  const uniqueImagePath = `${pathname}__${src}`;

  const [loaded, setLoaded] = useState(() => loadedImages.includes(uniqueImagePath));

  return [
    loaded,
    () => {
      if (!loaded) {
        loadedImages.push(uniqueImagePath);
        setLoaded(true);
      }
    },
  ] as const;
};

export default useImageLoadedState;
