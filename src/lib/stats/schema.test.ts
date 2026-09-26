import { describe, expect, test } from 'bun:test';
import { statsPostSchema, statsQuerySchema } from './schema';

const base = { type: 'blog', slug: 'exploring-module-in-nestjs' };

describe('statsQuerySchema', () => {
  test('accepts blog + valid slug', () => {
    expect(statsQuerySchema.safeParse(base).success).toBe(true);
  });

  test.each([
    { ...base, type: 'snippet' },
    { ...base, type: undefined },
    { ...base, slug: '' },
    { ...base, slug: 'Bad_Slug' },
    { ...base, slug: '../etc/passwd' },
    { ...base, slug: 'a'.repeat(256) },
  ])('rejects %j', (query) => {
    expect(statsQuerySchema.safeParse(query).success).toBe(false);
  });
});

describe('statsPostSchema', () => {
  test.each([
    { views: 1 },
    { loves: 1 },
    { loves: 5 },
    { applauses: 3, ideas: 2, bullseye: 1 },
    { views: 1, loves: 2 },
  ])('accepts deltas %j', (deltas) => {
    expect(statsPostSchema.safeParse({ ...base, ...deltas }).success).toBe(true);
  });

  test.each([
    ['v1 absolute views', { views: 1235 }],
    ['views 2', { views: 2 }],
    ['views 0', { views: 0 }],
    ['v1 absolute loves', { loves: 42 }],
    ['loves 9', { loves: 9 }],
    ['loves 0', { loves: 0 }],
    ['negative', { ideas: -1 }],
    ['fraction', { bullseye: 1.5 }],
    ['string', { loves: '3' }],
    ['no counters', {}],
    ['unknown key', { views: 1, hacks: 1 }],
    ['v1 column not in delta API', { views: 1, type2: 'x' }],
  ])('rejects %s', (_, deltas) => {
    expect(statsPostSchema.safeParse({ ...base, ...deltas }).success).toBe(false);
  });

  test('rejects snippet and bad slugs', () => {
    expect(statsPostSchema.safeParse({ ...base, type: 'snippet', views: 1 }).success).toBe(false);
    expect(statsPostSchema.safeParse({ ...base, slug: 'A B', views: 1 }).success).toBe(false);
  });
});
