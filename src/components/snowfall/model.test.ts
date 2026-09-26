import { describe, expect, test } from 'bun:test';
import { CONFIG, EDGE, makeFlake, stepFlake } from './model';

const W = 1280;
const H = 800;

const within = (value: number, [min, max]: readonly [number, number]) => {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
};

describe('CONFIG', () => {
  test('matches the final user settings', () => {
    expect(CONFIG).toEqual({
      count: 119,
      radius: [0.8, 2.6],
      speed: [0.25, 1.2],
      wind: [-0.2, 0.4],
      opacity: [0.15, 0.4],
    });
  });
});

describe('makeFlake', () => {
  test('keeps every value inside its CONFIG range (random, min and max rand)', () => {
    const rands = [Math.random, () => 0, () => 0.999999];
    for (const rand of rands) {
      for (let i = 0; i < 500; i++) {
        const f = makeFlake(W, H, rand);
        within(f.r, CONFIG.radius);
        within(f.speed, CONFIG.speed);
        within(f.wind, CONFIG.wind);
        within(f.opacity, CONFIG.opacity);
        within(f.x, [0, W]);
        within(f.y, [-H, H]);
      }
    }
  });

  test('uses the given y', () => {
    expect(makeFlake(W, H, Math.random, -EDGE).y).toBe(-EDGE);
  });
});

describe('stepFlake', () => {
  test('falls by its speed', () => {
    const f = makeFlake(W, H, () => 0.5, 100);
    stepFlake(f, W, H, Math.random);
    expect(f.y).toBeCloseTo(100 + f.speed);
  });

  test('respawns above the top after passing the bottom', () => {
    const f = { ...makeFlake(W, H, Math.random), y: H + EDGE + 0.1 };
    stepFlake(f, W, H, Math.random);
    expect(f.y).toBe(-EDGE);
    within(f.r, CONFIG.radius);
  });

  test('wraps from the right edge to the left', () => {
    const f = { ...makeFlake(W, H, Math.random, 10), x: W + EDGE + 1 };
    stepFlake(f, W, H, Math.random);
    expect(f.x).toBe(-EDGE);
  });

  test('wraps from the left edge to the right', () => {
    const f = { ...makeFlake(W, H, Math.random, 10), x: -EDGE - 1 };
    stepFlake(f, W, H, Math.random);
    expect(f.x).toBe(W + EDGE);
  });
});
