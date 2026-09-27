-- ROLLBACK ONLY for 0001_create_stats_daily.sql. Drops the v2 daily history table (and its data).
-- Never touches "stats" or the "StatsType" enum. Run only on explicit decision to roll back.
DROP TABLE IF EXISTS "stats_daily";
