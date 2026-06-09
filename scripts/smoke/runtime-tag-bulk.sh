#!/usr/bin/env bash
# Bulk tag mutation runtime smoke runner (issue-1081 staging, issue-1137 production).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || cd "$SCRIPT_DIR/../.." && pwd)"
REDACT="$SCRIPT_DIR/redact.sh"
SMOKE_REDACT="$REDACT"
# shellcheck source=scripts/smoke/lib/smoke-common.sh
source "$SCRIPT_DIR/lib/smoke-common.sh"
CF_SH="${CF_SH_PATH:-$REPO_ROOT/scripts/cf.sh}"
PREFIX="e2e_test_issue1081_"
CF_D1_DATABASE="${CF_D1_DATABASE:-}"
SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-seed.sql"
CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-staging-cleanup.sql"
MEMBER_IDS='["e2e_test_issue1081_mem_1","e2e_test_issue1081_mem_2"]'
TAG_IDS='["e2e_test_issue1081_tag_1","e2e_test_issue1081_tag_2"]'
EXPECTED_ITEMS=4

ENVIRONMENT=""
BASE=""
ADMIN_BEARER=""
OUT_DIR="docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence"
OUT_LOG=""
SUMMARY_JSON=""
CI_SUMMARY=0
SKIP_SEED=0
SKIP_CLEANUP=0
TMP_DIR=""
CLEANUP_RAN=0

usage() {
  cat >&2 <<'EOF'
usage: runtime-tag-bulk.sh staging|production [--out-dir <path>] [--ci-summary] [--skip-seed] [--skip-cleanup]
EOF
}

write_summary() {
  smoke_write_summary "$CI_SUMMARY" "${SUMMARY_JSON:-}" "checks"
}

summary_pass() {
  smoke_summary_pass "$1"
}

fail_and_exit() {
  local label="$1"
  local status="$2"
  local contract="$3"
  local reason="${4:-}"
  smoke_summary_fail_entry "$label" "$status" "$contract" "$reason"
  write_summary
  echo "FAIL: $label http=$status contract=$contract reason=$reason" >&2
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
  case "$ENVIRONMENT" in
    staging|production) ;;
    *)
      echo "Only staging or production bulk tag runtime smoke is allowed" >&2
      exit 2
      ;;
  esac

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
      *)
        echo "unknown argument: $1" >&2
        exit 2
        ;;
    esac
  done

  configure_environment
}

configure_environment() {
  local env_prefix api_base_var admin_bearer_var default_out_dir
  env_prefix="$(printf '%s' "$ENVIRONMENT" | tr '[:lower:]' '[:upper:]')"
  api_base_var="${env_prefix}_API_BASE"
  admin_bearer_var="${env_prefix}_ADMIN_BEARER"
  local api_base="${!api_base_var:-}"
  if [[ -z "$api_base" ]]; then
    echo "$api_base_var is required" >&2
    exit 2
  fi
  ADMIN_BEARER="${!admin_bearer_var:-}"
  if [[ -z "$ADMIN_BEARER" ]]; then
    echo "$admin_bearer_var is required" >&2
    exit 2
  fi
  if [[ "${CLOUDFLARE_ENV:-$ENVIRONMENT}" != "$ENVIRONMENT" ]]; then
    echo "CLOUDFLARE_ENV must be $ENVIRONMENT" >&2
    exit 2
  fi
  BASE="${api_base%/}"

  if [[ "$ENVIRONMENT" == "production" ]]; then
    PREFIX="e2e_test_prod_tagbulk_"
    CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-prod}"
    SEED_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-production-seed.sql"
    CLEANUP_SQL="$REPO_ROOT/apps/api/migrations/seed/bulk-tag-production-cleanup.sql"
    MEMBER_IDS='["e2e_test_prod_tagbulk_mem_1","e2e_test_prod_tagbulk_mem_2"]'
    TAG_IDS='["e2e_test_prod_tagbulk_tag_1","e2e_test_prod_tagbulk_tag_2"]'
    default_out_dir="docs/30-workflows/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence"
    if [[ "$OUT_DIR" == "docs/30-workflows/issue-1081-bulk-tag-real-d1-runtime-smoke/outputs/phase-11/evidence" ]]; then
      OUT_DIR="$default_out_dir"
    fi
  else
    CF_D1_DATABASE="${CF_D1_DATABASE:-ubm-hyogo-db-staging}"
  fi
}

assert_staging_guard() {
  local allow_regex="${STAGING_API_HOST_ALLOW_REGEX:-staging|127\.0\.0\.1|localhost}"
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-staging" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-staging" >&2
    exit 2
  fi
  if printf '%s\n' "$BASE" | grep -Eiq 'production|ubm-hyogo-api-production'; then
    echo "production target refused" >&2
    exit 2
  fi
  if ! smoke_assert_host_allow "$BASE" "$allow_regex"; then
    echo "STAGING_API_BASE must match staging allowlist" >&2
    exit 2
  fi
}

assert_production_guard() {
  local allow_regex="${PRODUCTION_API_HOST_ALLOW_REGEX:-^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev|api\.ubm-hyogo\.workers\.dev)$}"
  local host_port="${BASE#*://}"
  host_port="${host_port%%/*}"
  local host="${host_port%%:*}"
  if [[ "$CF_D1_DATABASE" != "ubm-hyogo-db-prod" ]]; then
    echo "CF_D1_DATABASE must be ubm-hyogo-db-prod" >&2
    exit 2
  fi
  if ! printf '%s\n' "$host" | grep -Eiq "$allow_regex"; then
    echo "PRODUCTION_API_BASE must match production allowlist" >&2
    exit 2
  fi
  if printf '%s\n' "$host" | grep -Eiq 'staging|127\.0\.0\.1|localhost'; then
    echo "non-production target refused" >&2
    exit 2
  fi
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_APPROVAL:-}" != "issue-1137-production-bulk-tag-smoke" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_APPROVAL marker is required" >&2
    exit 2
  fi
  if [[ "${BULK_TAG_PRODUCTION_SMOKE_CONFIRM:-}" != "I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1" ]]; then
    echo "BULK_TAG_PRODUCTION_SMOKE_CONFIRM marker is required" >&2
    exit 2
  fi
}

log_redacted() {
  smoke_redact_line "$OUT_LOG" "$*"
}

run_d1() {
  smoke_run_d1 "$CF_SH" "$CF_D1_DATABASE" "$ENVIRONMENT" "$@"
}

seed() {
  if [[ "$SKIP_SEED" -eq 1 ]]; then
    summary_pass "seed-skip"
    return 0
  fi
  run_d1 --file "$SEED_SQL" | smoke_redact_filter "$OUT_LOG"
  summary_pass "seed"
}

post_bulk() {
  local label="$1"
  local op="$2"
  local body_file="$TMP_DIR/$label.body"
  local status
  local payload
  payload="$(jq -nc --argjson memberIds "$MEMBER_IDS" --argjson tagIds "$TAG_IDS" --arg op "$op" '{memberIds:$memberIds, tagIds:$tagIds, op:$op}')"

  set +e
  status="$(
    curl -sS \
      --max-time 30 \
      -X POST \
      -o "$body_file" \
      -w "%{http_code}" \
      -H "authorization: Bearer $ADMIN_BEARER" \
      -H "content-type: application/json" \
      --data "$payload" \
      "$BASE/admin/members/tags/bulk"
  )"
  local curl_exit=$?
  set -e
  if [[ "$curl_exit" -ne 0 ]]; then
    status="000"
  fi

  {
    printf '===== %s POST /admin/members/tags/bulk =====\n' "$label"
    printf 'status=%s\n' "$status"
    printf 'request_body=%s\n' "$payload"
    printf 'body=%s\n\n' "$(head -c 4000 "$body_file" | tr -d '\0')"
  } | smoke_redact_filter "$OUT_LOG"

  if [[ "$status" != "200" ]]; then
    fail_and_exit "$label" "$status" "HTTP 200" "non-200"
  fi
  printf '%s\n' "$body_file"
}

assert_all_status() {
  local body="${1:-}"
  local expected="${2:-}"
  local expected_count="${3:-$EXPECTED_ITEMS}"
  if ! printf '%s' "$body" | jq -e --arg expected "$expected" --argjson expectedCount "$expected_count" '
    (.batchId | type == "string" and length > 0)
    and (.results | type == "array" and length == $expectedCount)
    and ([.results[] | select(.status == $expected)] | length == $expectedCount)
  ' >/dev/null; then
    return 1
  fi
}

assert_status_file() {
  local label="$1"
  local body_file="$2"
  local expected="$3"
  local body
  body="$(cat "$body_file")"
  if ! assert_all_status "$body" "$expected" "$EXPECTED_ITEMS"; then
    fail_and_exit "$label" "200" ".results[].status all == $expected" "status-mismatch"
  fi
  summary_pass "$label"
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

audit_count() {
  local action="$1"
  local raw
  raw="$(run_d1 --json --command "SELECT count(*) AS c FROM audit_log WHERE action='${action}' AND target_id LIKE '${PREFIX}%';")"
  printf '%s\n' "$raw" | smoke_redact_filter "$OUT_LOG"
  local count
  count="$(printf '%s\n' "$raw" | extract_count)"
  if [[ ! "$count" =~ ^[0-9]+$ ]]; then
    fail_and_exit "audit-count" "000" "D1 count result has numeric c" "count-parse-failed"
  fi
  printf '%s\n' "$count"
}

count_by_table() {
  local table="$1"
  local column="$2"
  local raw
  raw="$(run_d1 --json --command "SELECT count(*) AS c FROM ${table} WHERE ${column} LIKE '${PREFIX}%';")"
  printf '%s\n' "$raw" | smoke_redact_filter "$OUT_LOG"
  printf '%s\n' "$raw" | extract_count
}

cleanup() {
  if [[ "$CLEANUP_RAN" -eq 1 || "$SKIP_CLEANUP" -eq 1 || -z "${OUT_LOG:-}" ]]; then
    return 0
  fi
  CLEANUP_RAN=1
  run_d1 --file "$CLEANUP_SQL" | smoke_redact_filter "$OUT_LOG"
  local item table column count
  for item in "member_tags:member_id" "audit_log:target_id" "member_status:member_id" "member_identities:member_id" "member_responses:response_id" "tag_definitions:tag_id"; do
    table="${item%%:*}"
    column="${item##*:}"
    count="$(count_by_table "$table" "$column")"
    if [[ "$count" != "0" ]]; then
      fail_and_exit "cleanup-$table" "200" "$table synthetic rows count == 0" "cleanup-residual-$count"
    fi
  done
  summary_pass "cleanup"
}

main() {
  parse_args "$@"
  if [[ "$ENVIRONMENT" == "production" ]]; then
    assert_production_guard
  else
    assert_staging_guard
  fi
  mkdir -p "$OUT_DIR"
  OUT_LOG="$OUT_DIR/runtime-tag-bulk-smoke.log"
  SUMMARY_JSON="$OUT_DIR/summary.json"
  TMP_DIR="$(mktemp -d)"
  umask 077
  : > "$OUT_LOG"
  smoke_summary_init
  trap 'cleanup || true; rm -rf "$TMP_DIR"; write_summary' EXIT

  seed
  local assign_body retry_body unassign_body assigned_before assigned_after unassigned_before unassigned_after
  assign_body="$(post_bulk assign assign)"
  assert_status_file "assign" "$assign_body" "assigned"

  assigned_before="$(audit_count admin.member.tag_assigned)"
  retry_body="$(post_bulk assign-retry assign)"
  assert_status_file "assign-retry" "$retry_body" "noop"
  assigned_after="$(audit_count admin.member.tag_assigned)"
  if [[ "$assigned_before" != "$assigned_after" ]]; then
    fail_and_exit "audit-idempotency" "200" "tag_assigned audit count unchanged on retry" "audit-count-drift"
  fi
  summary_pass "audit-idempotency"

  unassigned_before="$(audit_count admin.member.tag_unassigned)"
  unassign_body="$(post_bulk unassign unassign)"
  assert_status_file "unassign" "$unassign_body" "unassigned"
  unassigned_after="$(audit_count admin.member.tag_unassigned)"
  if [[ "$unassigned_after" -le "$unassigned_before" ]]; then
    fail_and_exit "audit-parity" "200" "tag_unassigned audit count increased" "audit-parity-missing"
  fi
  summary_pass "audit-parity"

  cleanup
  write_summary
  echo "bulk tag runtime smoke PASS"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
