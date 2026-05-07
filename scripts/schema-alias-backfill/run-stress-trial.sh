#!/usr/bin/env bash
# Issue #504: 10 trials staging stress driver. Emits JSON evidence to stdout / --evidence-out.
# CONTRACT: staging only, /admin/schema/backfill/trigger, polling 10s, timeout 1800s.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run-stress-trial.sh \
  --trials 10 \
  --trigger-path /admin/schema/backfill/trigger \
  --poll-interval-seconds 10 \
  --timeout-seconds 1800 \
  --evidence-out /tmp/evidence-50k.json \
  --api-base-url https://<staging-api-host> \
  [--dry-run]

Required for live execution:
  ADMIN_SESSION_JWT  admin session JWT accepted by apps/api requireAdmin
EOF
}

TRIALS=10
TRIGGER_PATH="/admin/schema/backfill/trigger"
POLL=10
TIMEOUT=1800
EVIDENCE_OUT=""
API_BASE_URL="${ADMIN_API_BASE_URL:-}"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --trials) TRIALS="${2:-}"; shift 2 ;;
    --trigger-path) TRIGGER_PATH="${2:-}"; shift 2 ;;
    --poll-interval-seconds) POLL="${2:-}"; shift 2 ;;
    --timeout-seconds) TIMEOUT="${2:-}"; shift 2 ;;
    --evidence-out) EVIDENCE_OUT="${2:-}"; shift 2 ;;
    --api-base-url) API_BASE_URL="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

# --- Contract guards ---
if [[ "${CLOUDFLARE_ENV:-}" == "production" ]]; then
  echo "ABORT: production stress trial is banned." >&2
  exit 1
fi
if [[ "${TRIGGER_PATH}" != "/admin/schema/backfill/trigger" ]]; then
  echo "ABORT: trigger-path must be /admin/schema/backfill/trigger (got: ${TRIGGER_PATH})." >&2
  exit 1
fi
if [[ "${POLL}" != "10" ]]; then
  echo "ABORT: poll-interval-seconds must be 10 (got: ${POLL})." >&2
  exit 1
fi
if [[ "${TIMEOUT}" != "1800" ]]; then
  echo "ABORT: timeout-seconds must be 1800 (got: ${TIMEOUT})." >&2
  exit 1
fi
if [[ "${TRIALS}" != "10" ]]; then
  echo "ABORT: trials must be 10 (got: ${TRIALS})." >&2
  exit 1
fi

MAX_RETRY=3
MAX_DLQ=0
MAX_CPU_MS=250000

emit_plan_json() {
  cat <<EOF
{
  "taskId": "issue-504-ut-07b-fu-01-followup-extended-fixture-50k",
  "runtime": {
    "environment": "staging",
    "triggerPath": "${TRIGGER_PATH}",
    "pollIntervalSeconds": ${POLL},
    "timeoutSeconds": ${TIMEOUT}
  },
  "thresholds": {
    "maxRetryCount": ${MAX_RETRY},
    "maxDlqCount": ${MAX_DLQ},
    "maxCpuMs": ${MAX_CPU_MS}
  },
  "trials": [],
  "_dryRun": true
}
EOF
}

if [[ "${DRY_RUN}" -eq 1 ]]; then
  PAYLOAD="$(emit_plan_json)"
  if [[ -n "${EVIDENCE_OUT}" ]]; then
    printf '%s\n' "${PAYLOAD}" > "${EVIDENCE_OUT}"
    echo "DRY-RUN: wrote evidence plan -> ${EVIDENCE_OUT}" >&2
  else
    printf '%s\n' "${PAYLOAD}"
  fi
  exit 0
fi

if [[ -z "${API_BASE_URL}" ]]; then
  echo "ABORT: --api-base-url or ADMIN_API_BASE_URL is required for live staging trial." >&2
  exit 2
fi
if [[ "${API_BASE_URL}" == *"production"* || "${API_BASE_URL}" == *"ubm-hyogo-api."* ]]; then
  echo "ABORT: api base URL appears to be production: ${API_BASE_URL}" >&2
  exit 1
fi
if [[ -z "${ADMIN_SESSION_JWT:-}" ]]; then
  echo "ABORT: ADMIN_SESSION_JWT is required for live staging trial." >&2
  exit 2
fi

CF_SH="$(dirname "$0")/../cf.sh"
if [[ ! -x "${CF_SH}" ]]; then
  CF_SH="scripts/cf.sh"
fi

d1_json_value() {
  local sql="$1"
  local key="$2"
  bash "${CF_SH}" d1 execute ubm-hyogo-db-staging --env staging --remote --json --command "${sql}" \
    | node -e '
const fs = require("node:fs");
const key = process.argv[1];
const input = fs.readFileSync(0, "utf8");
const data = JSON.parse(input);
const roots = Array.isArray(data) ? data : [data];
for (const root of roots) {
  const rows = root?.results ?? root?.result?.[0]?.results ?? root?.result?.results ?? [];
  if (Array.isArray(rows) && rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], key)) {
    const value = rows[0][key];
    process.stdout.write(String(value ?? 0));
    process.exit(0);
  }
}
process.stdout.write("0");
' "${key}"
}

json_escape() {
  node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1"
}

TRIAL_JSON=""
for trial in $(seq 1 "${TRIALS}"); do
  started_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  trigger_response="$(curl -fsS -X POST \
    -H "Authorization: Bearer ${ADMIN_SESSION_JWT}" \
    -H "Content-Type: application/json" \
    --data '{"source":"issue-504-50k-trial"}' \
    "${API_BASE_URL%/}${TRIGGER_PATH}")"
  queue_enqueued="$(printf '%s' "${trigger_response}" | node -e 'const fs=require("node:fs"); const v=JSON.parse(fs.readFileSync(0,"utf8")); process.stdout.write(String(v.queueEnqueued ?? 0));')"

  elapsed=0
  abort_reason=""
  backfill_status="exhausted"
  retry_count=0
  dlq_count=0
  cpu_ms=0
  while [[ "${elapsed}" -le "${TIMEOUT}" ]]; do
    retry_count="$(d1_json_value "SELECT COALESCE(MAX(retry_count),0) AS retry_count FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%';" retry_count)"
    dlq_count="$(d1_json_value "SELECT COUNT(*) AS dlq_count FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%' AND backfill_status = 'failed';" dlq_count)"
    completed_count="$(d1_json_value "SELECT COUNT(*) AS completed_count FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%' AND backfill_status = 'completed';" completed_count)"
    total_count="$(d1_json_value "SELECT COUNT(*) AS total_count FROM schema_diff_queue WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%';" total_count)"
    if [[ "${retry_count}" -gt "${MAX_RETRY}" ]]; then abort_reason="retry_count_threshold"; break; fi
    if [[ "${dlq_count}" -gt "${MAX_DLQ}" ]]; then abort_reason="dlq_threshold"; break; fi
    if [[ "${cpu_ms}" -gt "${MAX_CPU_MS}" ]]; then abort_reason="cpu_ms_threshold"; break; fi
    if [[ "${total_count}" -gt 0 && "${completed_count}" -eq "${total_count}" ]]; then
      backfill_status="completed"
      break
    fi
    sleep "${POLL}"
    elapsed=$((elapsed + POLL))
  done
  ended_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if [[ "${elapsed}" -gt "${TIMEOUT}" && -z "${abort_reason}" ]]; then
    abort_reason="timeout"
  fi
  item="{\"trial\":${trial},\"started_at\":$(json_escape "${started_at}"),\"ended_at\":$(json_escape "${ended_at}"),\"retry_count\":${retry_count},\"cpu_ms\":${cpu_ms},\"queue_enqueued\":${queue_enqueued},\"dlq_count\":${dlq_count},\"backfill_status\":$(json_escape "${backfill_status}")"
  if [[ -n "${abort_reason}" ]]; then
    item="${item},\"abort_reason\":$(json_escape "${abort_reason}")"
  fi
  item="${item}}"
  if [[ -n "${TRIAL_JSON}" ]]; then TRIAL_JSON="${TRIAL_JSON},"; fi
  TRIAL_JSON="${TRIAL_JSON}${item}"
done

PAYLOAD="$(cat <<EOF
{
  "taskId": "issue-504-ut-07b-fu-01-followup-extended-fixture-50k",
  "runtime": {
    "environment": "staging",
    "triggerPath": "${TRIGGER_PATH}",
    "pollIntervalSeconds": ${POLL},
    "timeoutSeconds": ${TIMEOUT}
  },
  "thresholds": {
    "maxRetryCount": ${MAX_RETRY},
    "maxDlqCount": ${MAX_DLQ},
    "maxCpuMs": ${MAX_CPU_MS}
  },
  "trials": [${TRIAL_JSON}]
}
EOF
)"

if [[ -n "${EVIDENCE_OUT}" ]]; then
  printf '%s\n' "${PAYLOAD}" > "${EVIDENCE_OUT}"
  echo "wrote evidence -> ${EVIDENCE_OUT}" >&2
else
  printf '%s\n' "${PAYLOAD}"
fi
