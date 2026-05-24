#!/usr/bin/env bash
# attendanceProvider runtime smoke runner.
#
# Usage:
#   runtime-attendance-provider.sh <env> [--out-dir <path>] [--ci-summary]
#
# Args:
#   env          : "staging" | "production"（其他は exit 2）
#   --out-dir    : 出力 dir（省略時 docs/30-workflows/issue-531-...../evidence）
#   --ci-summary : 追加で summary.json を出力（CI artifact 用）
#
# Required env（env 引数に応じた prefix。staging→STAGING_ / production→PRODUCTION_）:
#   <PREFIX>_API_BASE / <PREFIX>_ADMIN_BEARER / <PREFIX>_MEMBER_ID / <PREFIX>_ME_BEARER
#
# production 専用 required env:
#   PRODUCTION_SMOKE_ALLOWED_SUBJECTS : 実行を許可する bearer subject(memberId) の allowlist
#                                       （カンマ/空白区切り）。本番 smoke は登録された
#                                       特定 test ユーザーの bearer でしか走らせない。
#
# Exit:
#   0 : 全 route PASS
#   1 : route が non-200 / contract 違反
#   2 : 引数不正・必須 env 欠落・production allowlist 違反
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:-}"
shift || true
if [[ -z "$ENVIRONMENT" ]]; then
  echo "env required" >&2
  exit 2
fi

case "$ENVIRONMENT" in
  staging)
    PREFIX="STAGING"
    EXPECTED_ENV="staging"
    DEFAULT_ALLOW_REGEX='staging|127\.0\.0\.1|localhost'
    ;;
  production)
    PREFIX="PRODUCTION"
    EXPECTED_ENV="production"
    DEFAULT_ALLOW_REGEX='ubm-hyogo|workers\.dev'
    ;;
  *)
    echo "Only staging|production runtime smoke is allowed" >&2
    exit 2
    ;;
esac

OUT_DIR_DEFAULT="docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-11/evidence"
OUT_DIR="$OUT_DIR_DEFAULT"
CI_SUMMARY=0

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
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

# env 引数に応じた prefix で必須 secret を解決（indirect expansion）。
API_BASE_VAR="${PREFIX}_API_BASE"
ADMIN_BEARER_VAR="${PREFIX}_ADMIN_BEARER"
MEMBER_ID_VAR="${PREFIX}_MEMBER_ID"
ME_BEARER_VAR="${PREFIX}_ME_BEARER"
ALLOW_REGEX_VAR="${PREFIX}_API_HOST_ALLOW_REGEX"

API_BASE="${!API_BASE_VAR:?${API_BASE_VAR} is required}"
ADMIN_BEARER="${!ADMIN_BEARER_VAR:?${ADMIN_BEARER_VAR} is required}"
MEMBER_ID="${!MEMBER_ID_VAR:?${MEMBER_ID_VAR} is required}"
ME_BEARER="${!ME_BEARER_VAR:?${ME_BEARER_VAR} is required}"

OUT_LOG="$OUT_DIR/runtime-smoke.log"
SUMMARY_JSON="$OUT_DIR/summary.json"
TMP_DIR="$(mktemp -d)"
REDACT="$SCRIPT_DIR/redact.sh"
umask 077
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$OUT_DIR"
: > "$OUT_LOG"

# summary entries (jq で結合する想定)
SUMMARY_ENTRIES=()
OVERALL_STATUS="PASS"

write_summary() {
  if [[ "$CI_SUMMARY" -ne 1 ]]; then
    return 0
  fi
  local entries_csv
  entries_csv="$(IFS=,; echo "${SUMMARY_ENTRIES[*]:-}")"
  printf '{"status":"%s","routes":[%s]}\n' "$OVERALL_STATUS" "$entries_csv" > "$SUMMARY_JSON"
}

# production smoke は登録済み test ユーザーの bearer でしか走らせない。
# bearer の subject(memberId) を allowlist と照合し、未許可なら exit 2 で拒否する。
# subject 値そのものは出力しない（memberId は半機密のため、許可可否のみ報告）。
assert_bearer_subject_allowed() {
  local label="$1"
  local bearer="$2"
  local allow="$3"
  local sub
  # tsx ではなく node の型ストリップ実行（Node 24+）を使う。CI の install-free な
  # shell-lint レーンでは node_modules/tsx が無いため pnpm exec tsx だと exit 254 で落ちる。
  # .mts は外部依存ゼロ（Buffer + 標準 JS のみ）なので node で直接 import できる。
  sub="$(
    node --input-type=module -e \
      "import { decodeJwtSubject } from './scripts/smoke/bearer-freshness-gate.mts'; process.stdout.write(decodeJwtSubject(process.argv[1] ?? '') ?? '');" \
      "$bearer" 2>/dev/null
  )"
  if [[ -z "$sub" ]]; then
    echo "::error::${label} bearer has no decodable subject; production smoke refuses to run" >&2
    exit 2
  fi
  local normalized=" ${allow//,/ } "
  if [[ "$normalized" != *" $sub "* ]]; then
    echo "::error::${label} bearer subject is not in PRODUCTION_SMOKE_ALLOWED_SUBJECTS allowlist; refusing production smoke" >&2
    exit 2
  fi
}

assert_target() {
  local allow_regex="${!ALLOW_REGEX_VAR:-$DEFAULT_ALLOW_REGEX}"
  local marker_body="$TMP_DIR/target-marker.body"
  local marker_status

  if ! printf '%s\n' "$BASE" | grep -Eiq "$allow_regex"; then
    fail_and_exit "target-allowlist" "000" "${API_BASE_VAR} must match $allow_regex"
  fi

  set +e
  marker_status="$(
    curl -sS \
      --max-time 15 \
      -o "$marker_body" \
      -w "%{http_code}" \
      "$BASE/"
  )"
  local marker_exit=$?
  set -e
  if [[ "$marker_exit" -ne 0 ]]; then
    marker_status="000"
  fi
  if [[ "$marker_status" != "200" ]]; then
    fail_and_exit "target-marker" "$marker_status" ".environment == \"$EXPECTED_ENV\""
  fi
  if ! jq -e --arg env "$EXPECTED_ENV" '.environment == $env' "$marker_body" >/dev/null 2>&1; then
    fail_and_exit "target-marker" "$marker_status" ".environment == \"$EXPECTED_ENV\""
  fi
}

fail_and_exit() {
  local label="$1"
  local status="$2"
  local jq_filter="$3"
  local reason="${4:-}"
  OVERALL_STATUS="FAIL"
  if [[ -n "$reason" ]]; then
    SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"FAIL","http":"%s","contract":%s,"reason":%s}' "$label" "$status" "$(printf '%s' "$jq_filter" | jq -Rs .)" "$(printf '%s' "$reason" | jq -Rs .)")")
  else
    SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"FAIL","http":"%s","contract":%s}' "$label" "$status" "$(printf '%s' "$jq_filter" | jq -Rs .)")")
  fi
  write_summary
  if [[ -n "$reason" ]]; then
    echo "FAIL: $label http=$status contract=$jq_filter reason=$reason" >&2
  else
    echo "FAIL: $label http=$status contract=$jq_filter" >&2
  fi
  exit 1
}

classify_unauthorized_bearer() {
  local bearer="$1"
  # node の型ストリップ実行（Node 24+）。install-free な shell-lint レーンでも tsx 不要で動く。
  node --input-type=module -e "import { explainAuthFailureFromBearer } from './scripts/smoke/bearer-freshness-gate.mts'; console.log(explainAuthFailureFromBearer({ token: process.argv[1] ?? '' }));" "$bearer"
}

request_json() {
  local label="$1"
  local url="$2"
  local bearer="$3"
  local jq_filter="$4"
  local summary_filter="$5"
  local body_file="$TMP_DIR/$label.body"
  local status
  local summary

  set +e
  status="$(
    curl -sS \
      --max-time 30 \
      -o "$body_file" \
      -w "%{http_code}" \
      -H "authorization: Bearer $bearer" \
      "$url"
  )"
  local curl_exit=$?
  set -e
  if [[ "$curl_exit" -ne 0 ]]; then
    status="000"
  fi

  if [[ "$status" != "200" ]]; then
    local redacted_body
    local failure_reason=""
    redacted_body="$(head -c 2000 "$body_file" | tr -d '\0' | bash "$REDACT")"
    # reason は redact 済み body から error 種別のみを判定し JWT 文字列は出力しない（不変条件 3）。
    # 判定順: 500(auth misconfigured) → 401(unauthorized) → 403(forbidden)。
    if printf '%s' "$redacted_body" | jq -e '.error == "auth misconfigured"' >/dev/null 2>&1 ||
      printf '%s' "$redacted_body" | grep -Eq '"error"[[:space:]]*:[[:space:]]*"auth misconfigured"'; then
      failure_reason="auth-secret-binding-missing"
    elif [[ "$status" == "401" ]] && {
      printf '%s' "$redacted_body" | jq -e '.error == "unauthorized"' >/dev/null 2>&1 ||
        printf '%s' "$redacted_body" | grep -Eq '"error"[[:space:]]*:[[:space:]]*"unauthorized"'
    }; then
      failure_reason="$(classify_unauthorized_bearer "$bearer")"
    elif [[ "$status" == "403" ]] && {
      printf '%s' "$redacted_body" | jq -e '.error == "forbidden"' >/dev/null 2>&1 ||
        printf '%s' "$redacted_body" | grep -Eq '"error"[[:space:]]*:[[:space:]]*"forbidden"'
    }; then
      failure_reason="auth-not-admin"
    fi
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
      if [[ -n "$failure_reason" ]]; then
        printf 'reason=%s\n\n' "$failure_reason"
      fi
      printf 'body=%s\n\n' "$redacted_body"
    } >> "$OUT_LOG"
    fail_and_exit "$label" "$status" "$jq_filter" "$failure_reason"
  fi

  if ! jq -e "$jq_filter" "$body_file" >/dev/null 2>&1; then
    {
      printf '===== %s GET =====\n' "$label"
      printf 'status=%s\n' "$status"
      printf 'contract=%s\n\n' "$jq_filter"
    } >> "$OUT_LOG"
    fail_and_exit "$label" "$status" "$jq_filter"
  fi

  summary="$(jq -r "$summary_filter" "$body_file")"
  {
    printf '===== %s GET =====\n' "$label"
    printf 'status=%s\n' "$status"
    printf 'contract=%s\n' "$jq_filter"
    printf 'summary=%s\n' "$summary"
    printf 'PASS %s\n\n' "$label"
  } >> "$OUT_LOG"

  SUMMARY_ENTRIES+=("$(printf '{"label":"%s","status":"PASS","http":"%s","summary":%s}' "$label" "$status" "$(printf '%s' "$summary" | jq -Rs .)")")
}

BASE="${API_BASE%/}"

# production smoke は許可された特定 test ユーザーの bearer でしか走らせない。
if [[ "$ENVIRONMENT" == "production" ]]; then
  ALLOWED_SUBJECTS="${PRODUCTION_SMOKE_ALLOWED_SUBJECTS:?PRODUCTION_SMOKE_ALLOWED_SUBJECTS is required for production smoke}"
  assert_bearer_subject_allowed "admin" "$ADMIN_BEARER" "$ALLOWED_SUBJECTS"
  assert_bearer_subject_allowed "me" "$ME_BEARER" "$ALLOWED_SUBJECTS"
fi

assert_target
request_json "admin-list" "$BASE/admin/members" "$ADMIN_BEARER" '.members | type == "array"' '.members | length'
request_json "admin-detail" "$BASE/admin/members/$MEMBER_ID" "$ADMIN_BEARER" '.profile | type == "object"' '.identityMemberId'
request_json "admin-attendance" "$BASE/admin/members/$MEMBER_ID/attendance" "$ADMIN_BEARER" '.records | type == "array"' '.records | length'
request_json "me-root" "$BASE/me" "$ME_BEARER" '.user.memberId | type == "string"' '.user.memberId | type'
request_json "me-profile" "$BASE/me/profile" "$ME_BEARER" '.profile.attendance | type == "array"' '.profile.attendance | length'
request_json "me-attendance" "$BASE/me/attendance" "$ME_BEARER" '.records | type == "array"' '.records | length'

echo "runtime attendance provider smoke PASS" >> "$OUT_LOG"
write_summary
echo "runtime attendance provider smoke PASS"
