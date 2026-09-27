/**
 * Site-wide `react-snowfall` island. Colour follows the `--snow-c` token; renders nothing under
 * reduced motion or, in `'december'` mode, outside December.
 */
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

const CONFIG = {
  snowflakeCount: 119,
  radius: [0.8, 2.6] as [number, number],
  speed: [0.25, 1.2] as [number, number],
  wind: [-0.2, 0.4] as [number, number],
  opacity: [0.15, 0.4] as [number, number],
};

const readSnowColor = () =>
  getComputedStyle(document.documentElement).getPropertyValue('--snow-c').trim() || 'currentColor';

export default function SnowfallIsland({ december = false }: { december?: boolean }) {
  const [color, setColor] = useState<string | null>(null);
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    const syncMotion = () => setMotionOk(motion.matches);
    const syncColor = () => setColor(readSnowColor());

    syncMotion();
    syncColor();
    motion.addEventListener('change', syncMotion);
    scheme.addEventListener('change', syncColor);
    window.addEventListener('theme-change', syncColor);
    const observer = new MutationObserver(syncColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      motion.removeEventListener('change', syncMotion);
      scheme.removeEventListener('change', syncColor);
      window.removeEventListener('theme-change', syncColor);
      observer.disconnect();
    };
  }, []);

  const active = Boolean(color) && motionOk && (!december || new Date().getMonth() === 11);

  // Lets glass cards show the snow; re-applied because each navigation resets <html> attributes.
  useEffect(() => {
    if (!active) return;
    const flag = () => {
      document.documentElement.dataset.snow = 'on';
    };
    flag();
    document.addEventListener('astro:after-swap', flag);
    return () => {
      document.removeEventListener('astro:after-swap', flag);
      delete document.documentElement.dataset.snow;
    };
  }, [active]);

  if (!active || !color) return null;

  return (
    <Snowfall
      {...CONFIG}
      color={color}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
