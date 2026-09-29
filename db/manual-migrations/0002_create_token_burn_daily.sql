-- v2: personal Claude Code usage per day and model for the Token burn card (fed by Claude Code's
-- OpenTelemetry export). Additive only: creates one new table, touches no existing object.
BEGIN;
CREATE TABLE IF NOT EXISTS "token_burn_daily" (
  "date"       DATE           NOT NULL,
  "model"      VARCHAR(100)   NOT NULL,
  "tokens"     BIGINT         NOT NULL DEFAULT 0,
  "cost_usd"   NUMERIC(14, 6) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT "token_burn_daily_pkey" PRIMARY KEY ("date", "model")
);
COMMIT;
