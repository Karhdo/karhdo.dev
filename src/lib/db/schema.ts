import {
  bigint,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Maps the existing objects created by the v1 Prisma migration `20241227070913_create_tbl_stats`.
// Never generate, push or migrate from this file: it describes production tables, it does not own them.
export const statsType = pgEnum('StatsType', ['blog', 'snippet']);

export const stats = pgTable(
  'stats',
  {
    type: statsType('type').notNull().default('blog'),
    slug: varchar('slug', { length: 255 }).notNull(),
    views: integer('views').notNull().default(0),
    loves: integer('loves').notNull().default(0),
    applauses: integer('applauses').notNull().default(0),
    ideas: integer('ideas').notNull().default(0),
    bullseye: integer('bullseye').notNull().default(0),
  },
  (t) => [primaryKey({ name: 'stats_pkey', columns: [t.type, t.slug] })]
);

export type StatsRow = typeof stats.$inferSelect;
export type StatsType = (typeof statsType.enumValues)[number];

// v2 addition — created by db/manual-migrations/0001_create_stats_daily.sql, never by drizzle-kit
export const statsDaily = pgTable(
  'stats_daily',
  {
    type: statsType('type').notNull().default('blog'),
    slug: varchar('slug', { length: 255 }).notNull(),
    date: date('date', { mode: 'string' }).notNull(), // UTC calendar day
    views: integer('views').notNull().default(0),
  },
  (t) => [
    primaryKey({ name: 'stats_daily_pkey', columns: [t.type, t.slug, t.date] }),
    index('stats_daily_date_idx').on(t.date),
  ]
);

export type StatsDailyRow = typeof statsDaily.$inferSelect;

// v2 addition — created by db/manual-migrations/0002_create_token_burn_daily.sql, never by drizzle-kit
export const tokenBurnDaily = pgTable(
  'token_burn_daily',
  {
    date: date('date', { mode: 'string' }).notNull(), // Asia/Ho_Chi_Minh calendar day
    model: varchar('model', { length: 100 }).notNull(),
    tokens: bigint('tokens', { mode: 'number' }).notNull().default(0),
    costUsd: numeric('cost_usd', { precision: 14, scale: 6 }).notNull().default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: 'token_burn_daily_pkey', columns: [t.date, t.model] })]
);

export type TokenBurnDailyRow = typeof tokenBurnDaily.$inferSelect;
