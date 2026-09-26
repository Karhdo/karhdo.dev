# 05 — Drizzle schema for the existing `stats` table + one additive `stats_daily` table

## Endpoint

None (consumed by `GET/POST /api/stats` in task 18 and `GET /api/stats/summary` in task 30).

## Summary

Replace Prisma with Drizzle ORM + postgres.js. The Drizzle schema must describe the **existing** Postgres objects created by Prisma migration `20241227070913_create_tbl_stats` — enum type `"StatsType"`, table `"stats"`, PK constraint `stats_pkey` — so no data is touched and no migration is ever generated or applied. Provide a serverless-safe client and typed query helpers.

**The one schema addition in v2.** The mockup's Blog stats card needs a 30-day daily-views series, but v1's `stats` holds only cumulative counters (no history). So v2 adds a new table, `stats_daily (type, slug, date, views)` with PK `(type, slug, date)`. It is created by a **reviewed, additive-only, hand-written SQL file that someone runs manually** (never `drizzle-kit push`/`migrate`/`generate`). It does not alter, lock-rewrite or backfill `stats` or any existing row. History starts accumulating from the day the migration runs; there is no backfill, because none is possible.

## Files to Create/Modify/Delete

- **Create** `src/lib/db/schema.ts`:

  ```ts
  import { integer, pgEnum, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core';
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
  ```

  (import `date` and `index` from `drizzle-orm/pg-core` as well).

- **Create** `db/manual-migrations/0001_create_stats_daily.sql` — reviewed in the PR, additive only, idempotent, one transaction:
  ```sql
  -- v2: daily view history for the Blog stats card. Additive only: creates one new table, touches no existing object.
  BEGIN;
  CREATE TABLE IF NOT EXISTS "stats_daily" (
    "type"  "StatsType"    NOT NULL DEFAULT 'blog',
    "slug"  VARCHAR(255)   NOT NULL,
    "date"  DATE           NOT NULL,
    "views" INTEGER        NOT NULL DEFAULT 0,
    CONSTRAINT "stats_daily_pkey" PRIMARY KEY ("type", "slug", "date")
  );
  CREATE INDEX IF NOT EXISTS "stats_daily_date_idx" ON "stats_daily" ("date");
  COMMIT;
  ```
  Plus `db/manual-migrations/0001_create_stats_daily.down.sql` (`DROP TABLE IF EXISTS "stats_daily";`), documented but only for rollback, and `db/manual-migrations/README.md`, which says: review → run against a Neon **branch** first → run against production with `psql "$POSTGRES_URL_DIRECT" -v ON_ERROR_STOP=1 -f db/manual-migrations/0001_create_stats_daily.sql` → record the date. It reuses the existing `"StatsType"` enum (no enum change) and adds no FK, so writes to `stats` are never blocked.
- **Create** `src/lib/db/client.ts` — lazy singleton: `getDb()` reads `POSTGRES_URL` from `astro:env/server`, throws a typed `DbNotConfiguredError` if missing, creates `postgres(url, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false, ssl: 'require' })`. The production DB is **Neon** reached through its `-pooler` host (PgBouncer in transaction mode), so `prepare: false` is mandatory and SSL is always required once per module instance and returns `drizzle(client, { schema })`.
- **Create** `src/lib/db/stats.ts` — (task 18 adds `recordDailyView` and task 30 adds the summary queries on `stats_daily`) `REACTION_KEYS = ['loves','applauses','ideas','bullseye'] as const`; `getStats(type, slug)` (select; return zero-filled object when no row, **no insert**); `incrementStats(type, slug, deltas)` using `db.insert(stats).values({ type, slug, ...deltas }).onConflictDoUpdate({ target: [stats.type, stats.slug], set: { views: sql\`${stats.views} + ${d.views}\`, … } }).returning()`— only columns present in`deltas` are updated.
- **Create** `drizzle.config.ts` — `dialect: 'postgresql'`, `schema: './src/lib/db/schema.ts'`, `dbCredentials: { url: process.env.POSTGRES_URL_DIRECT ?? process.env.POSTGRES_URL!, ssl: 'require' }`, `tablesFilter: ['stats', 'stats_daily']`, `strict: true`, `verbose: true`, `out: './.drizzle-introspect'` (git-ignored; used only by `pull`). Header comment: `// INTROSPECTION ONLY. Never run drizzle-kit push/migrate/generate against this database: the stats table is owned by the v1 Prisma migrations and holds production data.` `POSTGRES_URL_DIRECT` is a local-only variable (the Neon direct host, i.e. the pooler hostname without `-pooler`) because introspection needs a session connection; it is documented in `.env.example` as optional/tooling-only and is not part of the `astro:env` schema.
- **Modify** `package.json` — deps `drizzle-orm@^0.45.3`, `postgres@^3.4.9`; dev `drizzle-kit@^0.31.11`; script `db:pull: drizzle-kit pull` (introspection only). **No** `db:push`, `db:migrate` or `db:generate` scripts.
- **Modify** `.gitignore` — add `.drizzle-introspect/`.
- **Modify** `.env.example` — add commented optional `POSTGRES_URL_DIRECT=` (tooling only, Neon direct host for `db:pull`).
- **Delete** `prisma/` (schema + migrations) after the verification step below passes; the SQL remains in git history and is quoted in this file.

## Implementation Steps

1. Record the source of truth (from `git show main:prisma/migrations/20241227070913_create_tbl_stats/migration.sql`): `CREATE TYPE "StatsType" AS ENUM ('blog','snippet'); CREATE TABLE "stats" ("type" "StatsType" NOT NULL DEFAULT 'blog', "slug" VARCHAR(255) NOT NULL, "views" INTEGER NOT NULL DEFAULT 0, "loves" …, "applauses" …, "ideas" …, "bullseye" …, CONSTRAINT "stats_pkey" PRIMARY KEY ("type","slug"));`
2. `bun add drizzle-orm postgres && bun add -d drizzle-kit`; write schema, client, helpers, config.
3. Verification against a **local** database: `docker compose up -d postgres`, apply the two v1 Prisma SQL files with `psql` (read-only copies from `git show`), insert two sample rows, then run `POSTGRES_URL=… bunx drizzle-kit pull` and diff `.drizzle-introspect/schema.ts` against `src/lib/db/schema.ts` (names, types, defaults, PK name must match).
4. Verification against **production** (read-only): set `POSTGRES_URL_DIRECT` to the Neon **direct** (non-`-pooler`) connection string with `sslmode=require`, run only `bunx drizzle-kit pull` (never `push`/`migrate`) and repeat the diff. Also run `SELECT count(*), sum(views) FROM stats;` and record the numbers in the PR for task 28's data-intact check.
5. Write a scratch Bun script (not committed) calling `getStats`/`incrementStats` against the local DB and confirm the row updates atomically (run 20 concurrent `incrementStats({views:1})` → views increases by exactly 20).
6. `git rm -r prisma/`.
7. **`stats_daily` migration**: run `0001_create_stats_daily.sql` against the local replica, re-run it to prove it's idempotent, then `drizzle-kit pull` and diff it against `statsDaily`. Get the SQL reviewed in the PR. Run it on a Neon branch of production, then on production itself; this can happen before or after the v2 deploy, because task 18's daily write is best-effort. Record `SELECT count(*), sum(views) FROM stats;` before and after, to prove the existing data is unchanged.

## Acceptance Criteria

- [ ] `bun run build` succeeds (db client is not executed at build).
- [ ] `bunx biome check` passes.
- [ ] `bunx astro check` passes.
- [ ] `drizzle-kit pull` output from the local replica and from production matches `schema.ts` (enum `StatsType`, table `stats`, 7 columns, `stats_pkey`; after the manual migration also `stats_daily` with `stats_daily_pkey`); diff attached to PR.
- [ ] `drizzle.config.ts` has `strict: true` and the no-push comment; client uses `ssl: 'require'` and `prepare: false`.
- [ ] The only migration file is the reviewed `db/manual-migrations/0001_create_stats_daily.sql` (+ `.down.sql`, README); it contains only `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` (no `ALTER`, `DROP`, `UPDATE`, `DELETE` in the up file) and is idempotent (running it twice is a no-op); `package.json` has no push/migrate/generate script.
- [ ] After the migration on production: `drizzle-kit pull` shows `stats` unchanged plus `stats_daily` matching `statsDaily`; the `stats` count/sum is identical before and after.
- [ ] Concurrency check: 20 parallel increments → +20 views.
- [ ] `_prisma_migrations` table untouched (not in `tablesFilter`).
- [ ] `prisma/` directory deleted.

## Dependencies

- v2-astro-site-config-env

## Patterns to Follow

- v1 `prisma/schema/models/Stats.prisma`, `prisma/migrations/*/migration.sql`, `lib/services/prisma.ts` (singleton idea).
- Reference `src/lib/db.ts` (hta218/leohuynh.dev): postgres.js pool `max: 3` reasoning about pgbouncer.
- Drizzle docs: "Drizzle with existing database (pull)", `onConflictDoUpdate`.
