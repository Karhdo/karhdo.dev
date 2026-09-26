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
