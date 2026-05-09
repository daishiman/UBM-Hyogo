#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$REPO_ROOT/apps/api/scripts/runtime-smoke/run-smoke.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# shellcheck disable=SC1091
. "$REPO_ROOT/apps/api/scripts/runtime-smoke/lib/evidence-summary.sh"

bash -n "$SCRIPT"
bash -n "$REPO_ROOT/apps/api/scripts/runtime-smoke/run-production-smoke.sh"
bash -n "$REPO_ROOT/apps/api/scripts/runtime-smoke/redact-filter-production.sh"
bash -n "$REPO_ROOT/apps/api/scripts/runtime-smoke/lib/api-url-guard.sh"
bash -n "$REPO_ROOT/apps/api/scripts/runtime-smoke/lib/evidence-summary.sh"

PRODUCTION_API_URL="https://api.ubm-hyogo.workers.dev" \
  "$SCRIPT" --env production --readonly --dry-run --output-dir "$TMP_DIR" >/tmp/runtime-smoke-test.log
grep -F "env=production" "$TMP_DIR/evidence/production-smoke-dry-run.log" >/dev/null
grep -F "api_host=api.ubm-hyogo.workers.dev" "$TMP_DIR/evidence/production-smoke-dry-run.log" >/dev/null

if PRODUCTION_API_URL="https://api-staging.ubm-hyogo.workers.dev" \
  "$SCRIPT" --env production --readonly --dry-run --output-dir "$TMP_DIR" >/tmp/runtime-smoke-staging.log 2>&1; then
  echo "expected production guard to reject staging host" >&2
  exit 1
fi

if PRODUCTION_API_URL="https://api.ubm-hyogo.workers.dev" \
   STAGING_API_URL="https://api.ubm-hyogo.workers.dev" \
  "$SCRIPT" --env production --readonly --dry-run --output-dir "$TMP_DIR" >/tmp/runtime-smoke-equal.log 2>&1; then
  echo "expected production guard to reject URL equal to staging" >&2
  exit 1
fi

printf '{"attendance":[]}\n' > "$TMP_DIR/admin-member-detail.json"
summarize_json admin-member-detail "$TMP_DIR/admin-member-detail.json" >/dev/null

printf '{"attendance":null}\n' > "$TMP_DIR/admin-member-detail-invalid.json"
if summarize_json admin-member-detail "$TMP_DIR/admin-member-detail-invalid.json" >/tmp/runtime-smoke-invalid-summary.log 2>&1; then
  echo "expected admin member detail summary to require attendance array" >&2
  exit 1
fi

printf '{"profile":{"attendance":[]}}\n' > "$TMP_DIR/me-profile.json"
summarize_json me-profile "$TMP_DIR/me-profile.json" >/dev/null

printf '{"profile":{"attendance":null}}\n' > "$TMP_DIR/me-profile-invalid.json"
if summarize_json me-profile "$TMP_DIR/me-profile-invalid.json" >/tmp/runtime-smoke-invalid-profile-summary.log 2>&1; then
  echo "expected me profile summary to require profile attendance array" >&2
  exit 1
fi

echo "runtime-smoke tests PASS"
