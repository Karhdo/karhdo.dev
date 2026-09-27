# Manual migrations

The `stats` table and the `StatsType` enum are owned by the v1 Prisma migrations and hold production data.
Drizzle only **maps** them (`src/lib/db/schema.ts`); it never creates, alters or migrates anything.
Never run `drizzle-kit push`, `migrate` or `generate` against a real database.

The files here are hand-written, additive-only SQL, reviewed in a PR and run by a person with `psql`.

| File                                 | Purpose                                                            | Applied on (production) |
| ------------------------------------ | ------------------------------------------------------------------ | ----------------------- |
| `0001_create_stats_daily.sql`        | Creates `stats_daily` (daily views per post) and its date index    | 2026-09-27              |
| `0001_create_stats_daily.down.sql`   | Rollback only: drops `stats_daily`                                 | —                       |

`0001` reuses the existing `"StatsType"` enum (no enum change), adds no foreign key and does not touch `stats`,
so writes to `stats` are never blocked. It is idempotent (`IF NOT EXISTS`) and runs in one transaction.
There is no backfill: daily history starts on the day the migration runs.

## Running a migration

`POSTGRES_URL_DIRECT` is the Neon **direct** connection string (the pooler hostname without `-pooler`,
with `sslmode=require`). Keep it local; never commit it.

1. **Review** the SQL in the PR.
2. Record the baseline: `psql "$POSTGRES_URL_DIRECT" -c 'SELECT count(*), sum(views) FROM stats;'`
3. **Run it against a Neon branch** of production first (same command, branch connection string), and check
   `bunx drizzle-kit pull` output against `src/lib/db/schema.ts`.
4. **Run it against production**:

   ```sh
   psql "$POSTGRES_URL_DIRECT" -v ON_ERROR_STOP=1 -f db/manual-migrations/0001_create_stats_daily.sql
   ```

5. Re-run the `SELECT count(*), sum(views) FROM stats;` check: the numbers must be identical to step 2.
6. **Record the date** in the table above.

The order relative to the v2 deploy does not matter: the daily write in `POST /api/stats` is best-effort and
tolerates a missing `stats_daily` table.


> **Always set `POSTGRES_URL_DIRECT` explicitly** before `bun run db:pull`. If it is unset, drizzle-kit falls back to `POSTGRES_URL` (Bun auto-loads `.env`) and silently introspects production through the pooler. It is read-only, but be deliberate about which database you point at.
