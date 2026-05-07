#!/usr/bin/env bash
# Issue #504: bulk INSERT 50,000 row synthetic fixture into staging D1 only.
# CONTRACT: production env / DB は permanently banned. dual-guard で abort する.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: seed-staging-50k.sh --env staging --fixture-file <path> [--dry-run]
  --env           must be exactly `staging`. `production` aborts immediately.
  --fixture-file  path to SQL produced by generate-50k-fixture.ts
  --dry-run       print plan; perform no D1 write.
EOF
}

ENV_ARG=""
FIXTURE_FILE=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_ARG="${2:-}"; shift 2 ;;
    --fixture-file) FIXTURE_FILE="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

# --- Dual production guard (must run before anything else) ---
if [[ "${ENV_ARG}" == "production" || "${CLOUDFLARE_ENV:-}" == "production" ]]; then
  echo "ABORT: production bulk INSERT is permanently banned for issue-504 fixture." >&2
  exit 1
fi
if [[ "${ENV_ARG}" != "staging" ]]; then
  echo "ABORT: --env must be exactly 'staging' (got: '${ENV_ARG}')." >&2
  exit 1
fi
if [[ -z "${FIXTURE_FILE}" ]]; then
  echo "ABORT: --fixture-file is required." >&2
  exit 2
fi
if [[ ! -f "${FIXTURE_FILE}" ]]; then
  echo "ABORT: fixture file not found: ${FIXTURE_FILE}" >&2
  exit 2
fi

DB_NAME="ubm-hyogo-db-staging"
SELECTOR="dedupe_key LIKE 'ubm-test-fixture-50k-%'"

if grep -Eiq '\b(DELETE|DROP|ALTER|UPDATE|REPLACE|TRUNCATE|ATTACH|PRAGMA)\b' "${FIXTURE_FILE}"; then
  echo "ABORT: fixture file contains a destructive or non-insert SQL keyword." >&2
  exit 2
fi
if ! grep -Fq "INSERT INTO schema_diff_queue" "${FIXTURE_FILE}"; then
  echo "ABORT: fixture file must insert into schema_diff_queue." >&2
  exit 2
fi
if ! grep -Fq "ubm-test-fixture-50k-" "${FIXTURE_FILE}"; then
  echo "ABORT: fixture file must contain the ubm-test-fixture-50k- dedupe_key prefix." >&2
  exit 2
fi

PLAN=$(cat <<EOF
PLAN:
  env:           staging
  database:      ${DB_NAME}
  fixture file:  ${FIXTURE_FILE}
  selector:      ${SELECTOR}
  command:       bash scripts/cf.sh d1 execute ${DB_NAME} --env staging --remote --file ${FIXTURE_FILE}
EOF
)

echo "${PLAN}"

if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "DRY-RUN: no D1 write performed."
  exit 0
fi

CF_SH="$(dirname "$0")/../cf.sh"
if [[ ! -x "${CF_SH}" ]]; then
  CF_SH="scripts/cf.sh"
fi

bash "${CF_SH}" d1 execute "${DB_NAME}" --env staging --remote --file "${FIXTURE_FILE}"

echo "verifying inserted row count..."
bash "${CF_SH}" d1 execute "${DB_NAME}" --env staging --remote \
  --command "SELECT COUNT(*) AS cnt FROM schema_diff_queue WHERE ${SELECTOR};"
