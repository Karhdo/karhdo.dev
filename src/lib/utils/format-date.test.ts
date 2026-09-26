import { describe, expect, test } from 'bun:test';
import { formatDate } from './format-date';

describe('formatDate', () => {
  test('v1 pliny format, no time-zone shift', () => {
    expect(formatDate(new Date('2023-12-10'))).toBe('December 10, 2023');
  });
});
