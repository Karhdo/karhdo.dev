#!/usr/bin/env bash
# Point this machine's Claude Code at the karhdo.dev Token burn ingest (OpenTelemetry metrics).
# Merges six env entries into ~/.claude/settings.json (backup first); everything else is kept.
#
#   bash scripts/setup-token-burn-telemetry.sh
#   curl -fsSL https://raw.githubusercontent.com/Karhdo/karhdo.dev/main/scripts/setup-token-burn-telemetry.sh | bash
set -euo pipefail

command -v python3 >/dev/null || { echo "python3 is required" >&2; exit 1; }
printf 'TOKEN_BURN_INGEST_KEY (input hidden): ' >/dev/tty
IFS= read -rs KEY </dev/tty
printf '\n' >/dev/tty
[ -n "$KEY" ] || { echo "No key given; nothing changed." >&2; exit 1; }

SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"
[ -f "$SETTINGS" ] && cp -p "$SETTINGS" "$SETTINGS.bak-before-otel" && echo "Backup: $SETTINGS.bak-before-otel"

KEY="$KEY" SETTINGS="$SETTINGS" python3 - <<'PY'
import json, os
p = os.environ["SETTINGS"]
s = json.load(open(p)) if os.path.exists(p) and os.path.getsize(p) else {}
s.setdefault("env", {}).update({
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT": "https://karhdo.dev/api/otel/v1/metrics",
    "OTEL_EXPORTER_OTLP_METRICS_HEADERS": "Authorization=Bearer " + os.environ["KEY"],
    "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE": "delta",
})
with open(p, "w") as f:
    json.dump(s, f, indent=2)
    f.write("\n")
os.chmod(p, 0o600)
PY

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST https://karhdo.dev/api/otel/v1/metrics \
  -H 'content-type: application/json' -H "authorization: Bearer $KEY" -d '{}')
if [ "$code" = "200" ]; then
  echo "Done: key accepted by karhdo.dev. Restart open Claude Code sessions to start sending usage."
else
  echo "Settings written, but karhdo.dev answered HTTP $code: check the key." >&2
  exit 1
fi
