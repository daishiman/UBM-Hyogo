#!/usr/bin/env bash
# Staging authenticated visual capture runner for issue-1125 bulk tag result summaries.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  :
else
  REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
REDACT="$SCRIPT_DIR/redact.sh"
CF_SH="${CF_SH_PATH:-$REPO_ROOT/scripts/cf.sh}"
PREFIX="e2e_test_issue1125_"
CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-staging}"
SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-result-staging-seed.sql"
CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-result-staging-cleanup.sql"
SPEC_PATH="playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-result-authenticated.spec.ts"

ENVIRONMENT=""
OUT_DIR="docs/30-workflows/issue-1125-bulk-tag-result-staging-mutation-visual-baseline/outputs/phase-11/evidence"
OUT_DIR_ABS=""
SCREENSHOTS_DIR_ABS=""
OUT_LOG=""
SUMMARY_JSON=""
CI_SUMMARY=0
SKIP_SEED=0
SKIP_CLEANUP=0
UPDATE_SNAPSHOTS=1
OVERALL_STATUS="PASS"
SUMMARY_ENTRIES=()
CLEANUP_RAN=0

usage() {
  cat >&2 <<'EOF'
usage: capture-bulk-tag-result.sh staging [--out-dir <path>] [--ci-summary] [--skip-seed] [--skip-cleanup] [--no-update-snapshots]
EOF
}

write_summary() {
  if [[ "$CI_SUMMARY" -ne 1 || -z "${SUMMARY_JSON:-}" ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","checks":[%s]}\n' "$OVERALL_STATUS" "$entries_csv" > "$SUMMARY_JSON"
}

summary_pass() {
  local label="$1"
  SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"PASS"}' "$label")")
}

summary_fail() {
  local label="$1"
  local reason="${2:-}"
  SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"FAIL","reason":%s}' "$label" "$(printf '%s' "$reason" | jq -Rs .)")")
}

fail_and_exit() {
  local label="$1"
  local reason="${2:-}"
  OVERALL_STATUS="FAIL"
  summary_fail "$label" "$reason"
  write_summary
  echo "FAIL: $label reason=$reason" >&2
  exit 1
}

parse_args() {
  ENVIRONMENT="${1:-}"
  if [[ -z "$ENVIRONMENT" ]]; then
    echo "env required" >&2
    usage
    exit 2
  fi
  shift || true
  if [[ "$ENVIRONMENT" != "staging" ]]; then
    echo "Only staging bulk tag result visual capture is allowed" >&2
    exit 2
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --out-dir)
        OUT_DIR="${2:-}"
        if [[ -z "$OUT_DIR" ]]; then
          echo "--out-dir requires a path" >&2
          exit 2
        fi
        shift 2
        ;;
      --ci-summary)
        CI_SUMMARY=1
        shift
        ;;
      --skip-seed)
        SKIP_SEED=1
        shift
        ;;
      --skip-cleanup)
        SKIP_CLEANUP=1
        shift
        ;;
      --no-update-snapshots)
        UPDATE_SNAPSHOTS=0
        shift
        ;;
      *)
        echo "unknown argument: $1" >&2
        exit 2
        ;;
    esac
  done

  if [[ "${CLOUDFLARE_ENV:-staging}" != "staging" ]]; then
    echo "CLOUDFLARE_ENV must be staging" >&2
    exit 2
  fi
}

resolve_path() {
  local input="$1"
  if [[ "$input" = /* ]]; then
    printf '%s\n' "$input"
  else
    printf '%s/%s\n' "$REPO_ROOT" "$input"
  fi
}

assert_staging_guard() {
  local base="${PLAYWRIGHT_STAGING_BASE_URL:-${PLAYWRIGHT_BASE_URL:-https://ubm-hyogo-web-staging.daishimanju.workers.dev}}"
  local allow_regex="${STAGING_WEB_HOST_ALLOW_REGEX:-staging|127\.0\.0\.1|localhost}"
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-staging" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-staging" >&2
    exit 2
  fi
  if printf '%s\n' "$base" | grep -Eiq 'production|ubm-hyogo-web-production'; then
    echo "production target refused" >&2
    exit 2
  fi
  if ! printf '%s\n' "$base" | grep -Eiq "$allow_regex"; then
    echo "PLAYWRIGHT_STAGING_BASE_URL must match staging allowlist" >&2
    exit 2
  fi
}

run_d1() {
  bash "$CF_SH" d1 execute "$CF_D1_DATABASE" --env staging --remote "$@"
}

extract_count() {
  jq -r '
    if type == "array" then
      (.. | objects | select(has("c")) | .c) // empty
    else
      (.. | objects | select(has("c")) | .c) // empty
    end
  ' | head -n1
}

count_by_table() {
  local table="$1"
  local column="$2"
  local raw
  raw="$(run_d1 --json --command "SELECT count(*) AS c FROM ${table} WHERE ${column} LIKE '${PREFIX}%';")"
  printf '%s\n' "$raw" | bash "$REDACT" >> "$OUT_LOG"
  printf '%s\n' "$raw" | extract_count
}

seed() {
  if [[ "$SKIP_SEED" -eq 1 ]]; then
    summary_pass "seed-skip"
    return 0
  fi
  local code=0
  run_d1 --file "$SEED_SQL" | bash "$REDACT" >> "$OUT_LOG" || code=$?
  if [[ "$code" -ne 0 ]]; then
    return "$code"
  fi
  summary_pass "seed"
}

capture() {
  local update_args=()
  local code=0
  if [[ "$UPDATE_SNAPSHOTS" -eq 1 ]]; then
    update_args+=(--update-snapshots)
  fi

  {
    printf '===== issue-1125 authenticated staging visual capture =====\n'
    printf 'target=%s\n' "${PLAYWRIGHT_STAGING_BASE_URL:-${PLAYWRIGHT_BASE_URL:-default-staging}}"
    printf 'spec=%s\n' "$SPEC_PATH"
    printf 'evidence_dir=%s\n' "$OUT_DIR"
  } | bash "$REDACT" >> "$OUT_LOG"

  if [[ "${#update_args[@]}" -gt 0 ]]; then
    (
      cd "$REPO_ROOT/apps/web"
      PLAYWRIGHT_EVIDENCE_DIR="$SCREENSHOTS_DIR_ABS" \
        pnpm exec playwright test "$SPEC_PATH" \
          --project=staging-visual-authenticated \
          "${update_args[@]}"
    ) 2>&1 | bash "$REDACT" >> "$OUT_LOG" || code=$?
  else
    (
      cd "$REPO_ROOT/apps/web"
      PLAYWRIGHT_EVIDENCE_DIR="$SCREENSHOTS_DIR_ABS" \
        pnpm exec playwright test "$SPEC_PATH" \
          --project=staging-visual-authenticated
    ) 2>&1 | bash "$REDACT" >> "$OUT_LOG" || code=$?
  fi
  if [[ "$code" -ne 0 ]]; then
    return "$code"
  fi
  summary_pass "capture"
}

cleanup() {
  if [[ "$CLEANUP_RAN" -eq 1 || "$SKIP_CLEANUP" -eq 1 || -z "${OUT_LOG:-}" ]]; then
    return 0
  fi
  CLEANUP_RAN=1
  local code=0
  run_d1 --file "$CLEANUP_SQL" | bash "$REDACT" >> "$OUT_LOG" || code=$?
  if [[ "$code" -ne 0 ]]; then
    OVERALL_STATUS="FAIL"
    summary_fail "cleanup-run" "cleanup command failed"
    return "$code"
  fi
  local item table column count
  for item in "member_tags:member_id" "audit_log:target_id" "member_status:member_id" "member_identities:member_id" "member_responses:response_id" "tag_definitions:tag_id"; do
    table="${item%%:*}"
    column="${item##*:}"
    count="$(count_by_table "$table" "$column")"
    if [[ "$count" != "0" ]]; then
      OVERALL_STATUS="FAIL"
      summary_fail "cleanup-$table" "cleanup-residual-$count"
      echo "FAIL: cleanup-$table reason=cleanup-residual-$count" >&2
      return 1
    fi
  done
  summary_pass "cleanup"
}

on_exit() {
  local code=$?
  if [[ "$code" -ne 0 && "$OVERALL_STATUS" == "PASS" ]]; then
    OVERALL_STATUS="FAIL"
    summary_fail "runner-exit" "exit-code-$code"
  fi
  if ! cleanup; then
    code=1
  fi
  write_summary
  exit "$code"
}

main() {
  parse_args "$@"
  assert_staging_guard
  OUT_DIR_ABS="$(resolve_path "$OUT_DIR")"
  SCREENSHOTS_DIR_ABS="$(dirname "$OUT_DIR_ABS")/screenshots"
  mkdir -p "$OUT_DIR_ABS" "$SCREENSHOTS_DIR_ABS"
  OUT_LOG="$OUT_DIR_ABS/capture-bulk-tag-result.log"
  SUMMARY_JSON="$OUT_DIR_ABS/summary.json"
  umask 077
  : > "$OUT_LOG"
  trap on_exit EXIT

  if ! seed; then
    fail_and_exit "seed" "seed failed"
  fi
  if ! capture; then
    fail_and_exit "capture" "capture failed"
  fi
  if ! cleanup; then
    fail_and_exit "cleanup" "cleanup failed"
  fi
  write_summary
  echo "bulk tag result visual capture PASS"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
