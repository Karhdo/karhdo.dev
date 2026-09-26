import { expect, test } from 'bun:test';
import { BUILD_INFO, FALLBACK_BUILD_INFO } from './build-info';

test('importing build-info without the Vite define falls back instead of throwing', () => {
  expect(BUILD_INFO).toEqual(FALLBACK_BUILD_INFO);
});
