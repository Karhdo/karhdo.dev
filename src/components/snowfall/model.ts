/**
 * Pure snowfall model (no DOM), shared by the canvas script and its tests.
 * Final user settings: v1 count, wind and opacity; slightly larger (radius .8–2.6) and
 * slower (speed .25–1.2) flakes than v1 (`react-snowfall` radius [0.5, 2], speed [0.4, 2]).
 */
export const CONFIG = {
  count: 119,
  radius: [0.8, 2.6],
  speed: [0.25, 1.2],
  wind: [-0.2, 0.4],
  opacity: [0.15, 0.4],
} as const;

/** Off-screen margin (px) for respawn and horizontal wrap. */
export const EDGE = 4;

/** Sway: phase step per frame and horizontal amplitude (px/frame), as in the approved mockup. */
const SWAY_STEP = 0.01;
const SWAY_AMP = 0.25;

export type Flake = { x: number; y: number; r: number; speed: number; wind: number; opacity: number; phase: number };

/** Returns a number in [0, 1). */
export type Rand = () => number;

const between = (rand: Rand, [min, max]: readonly [number, number]) => min + rand() * (max - min);

/** A new flake with every value inside its `CONFIG` range; `y` defaults to anywhere in [-H, H). */
export function makeFlake(W: number, H: number, rand: Rand, y?: number): Flake {
  return {
    x: rand() * W,
    y: y ?? between(rand, [-H, H]),
    r: between(rand, CONFIG.radius),
    speed: between(rand, CONFIG.speed),
    wind: between(rand, CONFIG.wind),
    opacity: between(rand, CONFIG.opacity),
    phase: rand() * Math.PI * 2,
  };
}

/** Advances a flake one frame in place: fall, drift, respawn above the top, wrap horizontally. */
export function stepFlake(f: Flake, W: number, H: number, rand: Rand): void {
  f.phase += SWAY_STEP;
  f.y += f.speed;
  f.x += f.wind + Math.sin(f.phase) * SWAY_AMP;
  if (f.y > H + EDGE) Object.assign(f, makeFlake(W, H, rand, -EDGE));
  if (f.x > W + EDGE) f.x = -EDGE;
  else if (f.x < -EDGE) f.x = W + EDGE;
}
