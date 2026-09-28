/**
 * Snowflake physics, matching react-snowfall's circle mode (which v2 used before): flakes start above
 * the viewport, drift by wind, fall by speed, ease towards new random speed/wind every ~200-300
 * frames and wrap around the edges; all drawn as one full-opacity path. Time-based: `frames` is
 * elapsed time in 60 fps frames, so 30 fps moves flakes as far as 60 fps did.
 */
export type Range = readonly [number, number];
export type SnowConfig = { radius: Range; speed: Range; wind: Range; changeFrequency: number };
export type Flake = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  nextSpeed: number;
  nextWind: number;
  changeEvery: number;
  sinceChange: number;
};

export const SNOW_CONFIG: SnowConfig = {
  radius: [0.8, 2.6],
  speed: [0.25, 1.2],
  wind: [-0.2, 0.4],
  changeFrequency: 200,
};
export const FLAKES_DESKTOP = 119;
export const FLAKES_MOBILE = 60;
export const MOBILE_MAX_WIDTH = 640;

const between = ([min, max]: Range, rand: () => number) => min + rand() * (max - min);

export function flakeCount(viewportWidth: number): number {
  return viewportWidth <= MOBILE_MAX_WIDTH ? FLAKES_MOBILE : FLAKES_DESKTOP;
}

export function createFlake(width: number, height: number, config = SNOW_CONFIG, rand = Math.random): Flake {
  const speed = between(config.speed, rand);
  const wind = between(config.wind, rand);
  return {
    x: rand() * width,
    y: -rand() * height,
    radius: between(config.radius, rand),
    speed,
    wind,
    nextSpeed: between(config.speed, rand),
    nextWind: between(config.wind, rand),
    changeEvery: config.changeFrequency * (1 + rand() * 0.5),
    sinceChange: 0,
  };
}

/** Advances one flake by `frames` (60 fps frames) in a `width` × `height` viewport. */
export function stepFlake(
  f: Flake,
  width: number,
  height: number,
  frames: number,
  config = SNOW_CONFIG,
  rand = Math.random
) {
  f.x = (f.x + f.wind * frames) % (width + f.radius * 2);
  if (f.x > width + f.radius) f.x = -f.radius;
  if (f.x < -f.radius) f.x += width + f.radius * 2;
  f.y = (f.y + f.speed * frames) % (height + f.radius * 2);
  if (f.y > height + f.radius) f.y = -f.radius;
  // Ease 1 % per 60 fps frame towards the targets, independent of the real frame rate.
  const ease = 1 - 0.99 ** frames;
  f.speed += (f.nextSpeed - f.speed) * ease;
  f.wind += (f.nextWind - f.wind) * ease;
  f.sinceChange += frames;
  if (f.sinceChange > f.changeEvery) {
    f.nextSpeed = between(config.speed, rand);
    f.nextWind = between(config.wind, rand);
    f.sinceChange = 0;
  }
}
