import { describe, expect, test } from 'bun:test';
import { shouldPause } from './pause-offscreen';
import { maxTilt, tiltAngles } from './pointer-fx';

describe('maxTilt', () => {
  test('4° up to 500 px, 2° above', () => {
    expect(maxTilt(320)).toBe(4);
    expect(maxTilt(500)).toBe(4);
    expect(maxTilt(501)).toBe(2);
    expect(maxTilt(1100)).toBe(2);
  });
});

describe('tiltAngles', () => {
  test('centre is flat', () => {
    expect(tiltAngles(150, 100, 300, 200)).toEqual({ rx: 0, ry: 0 });
  });
  test('corners reach the limit, with the mockup signs', () => {
    expect(tiltAngles(300, 200, 300, 200)).toEqual({ rx: -4, ry: 4 });
    expect(tiltAngles(0, 0, 300, 200)).toEqual({ rx: 4, ry: -4 });
    expect(tiltAngles(225, 100, 300, 200)).toEqual({ rx: 0, ry: 2 });
    expect(tiltAngles(800, 0, 800, 300)).toEqual({ rx: 2, ry: 2 });
  });
  test('clamps outside the box and handles empty boxes', () => {
    expect(tiltAngles(-50, 400, 300, 200)).toEqual({ rx: -4, ry: -4 });
    expect(tiltAngles(10, 10, 0, 0)).toEqual({ rx: 0, ry: 0 });
  });
  test('layout width picks the limit', () => {
    // A 498 px card whose projected box measures 503 px still gets the small-card limit.
    expect(tiltAngles(503, 0, 503, 200, 498)).toEqual({ rx: 4, ry: 4 });
  });
});

describe('shouldPause', () => {
  test('hidden tab or off-screen pauses; unknown counts as visible', () => {
    expect(shouldPause(true, true)).toBe(true);
    expect(shouldPause(false, false)).toBe(true);
    expect(shouldPause(false, true)).toBe(false);
    expect(shouldPause(false, undefined)).toBe(false);
  });
});
