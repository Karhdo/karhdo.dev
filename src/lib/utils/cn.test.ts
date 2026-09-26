import { expect, test } from 'bun:test';
import { cn } from './cn';

test.each([
  ['rounded-card', 'rounded-xl', 'rounded-xl'],
  ['rounded-xl', 'rounded-card', 'rounded-card'],
  ['shadow-card', 'shadow-none', 'shadow-none'],
  ['shadow-none', 'shadow-card', 'shadow-card'],
  ['animate-rise', 'animate-none', 'animate-none'],
  ['animate-none', 'animate-shimmer', 'animate-shimmer'],
  ['ease-out', 'ease-spring', 'ease-spring'],
  ['ease-spring', 'ease-out', 'ease-out'],
  ['text-fg', 'text-muted', 'text-muted'],
  ['text-muted', 'text-fg', 'text-fg'],
])('cn(%p, %p) keeps only %p', (first, second, expected) => {
  expect(cn(first, second)).toBe(expected);
});

test('keeps non-conflicting classes and drops falsy values', () => {
  expect(cn('p-5', false && 'hidden', undefined, 'text-fg', 'rounded-card')).toBe('p-5 text-fg rounded-card');
});
