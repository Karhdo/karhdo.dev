import { describe, expect, test } from 'bun:test';
import { planSnake } from './snake';

const contiguous = (path: { c: number; r: number }[], start = { c: 0, r: 0 }) =>
  path.every((cell, i) => {
    const prev = i === 0 ? start : path[i - 1];
    return prev !== undefined && Math.abs(cell.c - prev.c) + Math.abs(cell.r - prev.r) === 1;
  });

describe('planSnake', () => {
  test('an empty board needs no moves', () => {
    expect(
      planSnake([
        [0, 0],
        [0, 0],
      ])
    ).toEqual([]);
  });

  test('food under the start cell is eaten without moving', () => {
    expect(planSnake([[3]])).toEqual([]);
  });

  test('moves one cell per step and visits every contribution', () => {
    const levels = [
      [0, 0, 2, 0, 0, 0, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [4, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 3, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1],
    ];
    const path = planSnake(levels);
    expect(contiguous(path)).toBe(true);
    const visited = new Set(path.map(({ c, r }) => `${c}:${r}`));
    for (const key of ['0:2', '0:6', '2:0', '3:3', '4:6']) expect(visited.has(key)).toBe(true);
  });

  test('goes to the nearest contribution first', () => {
    const levels = [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 9], // far
      [0, 0, 0, 0, 0, 0, 0],
    ];
    levels[0] = [0, 1, 0, 0, 0, 0, 0]; // near
    const path = planSnake(levels);
    expect(path[0]).toEqual({ c: 0, r: 1 });
    expect(path.at(-1)).toEqual({ c: 2, r: 6 });
  });

  test('ends on the last contribution eaten', () => {
    const path = planSnake([[0], [0], [0], [1]]);
    expect(path).toEqual([
      { c: 1, r: 0 },
      { c: 2, r: 0 },
      { c: 3, r: 0 },
    ]);
  });

  test('handles a short (partial) last week', () => {
    const path = planSnake([
      [0, 0, 0, 0, 0, 0, 0],
      [1, 0],
    ]);
    expect(path).toEqual([{ c: 1, r: 0 }]);
  });
});
