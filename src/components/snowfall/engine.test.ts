import { describe, expect, test } from 'bun:test';
import { createFlake, FLAKES_DESKTOP, FLAKES_MOBILE, flakeCount, SNOW_CONFIG, stepFlake } from './engine';

const fixed = (v: number) => () => v;

describe('flakeCount', () => {
  test('fewer flakes on phones', () => {
    expect(flakeCount(390)).toBe(FLAKES_MOBILE);
    expect(flakeCount(1280)).toBe(FLAKES_DESKTOP);
  });
});

describe('createFlake', () => {
  test('starts above the viewport, within the configured ranges', () => {
    const f = createFlake(1000, 800);
    expect(f.y).toBeLessThanOrEqual(0);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.radius).toBeGreaterThanOrEqual(SNOW_CONFIG.radius[0]);
    expect(f.radius).toBeLessThanOrEqual(SNOW_CONFIG.radius[1]);
    expect(f.speed).toBeGreaterThanOrEqual(SNOW_CONFIG.speed[0]);
    expect(f.speed).toBeLessThanOrEqual(SNOW_CONFIG.speed[1]);
  });
});

describe('stepFlake', () => {
  test('moves by speed and wind per 60 fps frame', () => {
    const f = { ...createFlake(1000, 800, SNOW_CONFIG, fixed(0.5)), x: 100, y: 100, speed: 1, wind: 0.5 };
    f.nextSpeed = 1;
    f.nextWind = 0.5;
    stepFlake(f, 1000, 800, 2);
    expect(f.y).toBeCloseTo(102);
    expect(f.x).toBeCloseTo(101);
  });

  test('30 fps (2 frames per step) covers the same distance as 60 fps', () => {
    const base = { ...createFlake(1000, 800, SNOW_CONFIG, fixed(0.5)), x: 100, y: 100, speed: 1, wind: 0.2 };
    const a = { ...base, nextSpeed: 1, nextWind: 0.2 };
    const b = { ...base, nextSpeed: 1, nextWind: 0.2 };
    for (let i = 0; i < 60; i++) stepFlake(a, 1000, 800, 1);
    for (let i = 0; i < 30; i++) stepFlake(b, 1000, 800, 2);
    expect(b.y).toBeCloseTo(a.y);
    expect(b.x).toBeCloseTo(a.x);
  });

  test('wraps to the top after leaving the bottom, and around the sides', () => {
    const f = { ...createFlake(100, 100), x: 50, y: 101, radius: 2, speed: 5, wind: 0, nextSpeed: 5, nextWind: 0 };
    stepFlake(f, 100, 100, 1);
    expect(f.y).toBeLessThan(10); // back near the top
    const g = { ...createFlake(100, 100), x: 101, y: 10, radius: 2, speed: 0, wind: 5, nextSpeed: 0, nextWind: 5 };
    stepFlake(g, 100, 100, 1);
    expect(g.x).toBeLessThan(10); // back on the left
  });

  test('eases towards new random targets over time', () => {
    const f = { ...createFlake(1000, 800), speed: 0.3, nextSpeed: 1.1, sinceChange: 0, changeEvery: 1e9 };
    stepFlake(f, 1000, 800, 100);
    expect(f.speed).toBeGreaterThan(0.3);
    expect(f.speed).toBeLessThan(1.1);
  });
});

describe('stepFlake: leftward wind', () => {
  test('a flake drifting off the left edge comes back on the right', () => {
    const f = { ...createFlake(100, 100), x: -2, y: 10, radius: 2, speed: 0, wind: -1, nextSpeed: 0, nextWind: -1 };
    stepFlake(f, 100, 100, 1);
    expect(f.x).toBeGreaterThan(90);
  });
});
