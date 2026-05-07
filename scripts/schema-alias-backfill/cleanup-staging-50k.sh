#!/usr/bin/env bash
# Issue #504: cleanup 50k synthetic fixture from staging D1.
# CONTRACT: production env / DB は permanently banned.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: cleanup-staging-50k.sh --env staging [--confirm]
  --env       must be exactly `staging`. `production` aborts immediately.
  --confirm   actually perform DELETE; without it dry-run only.
EOF
}

ENV_ARG=""
CONFIRM=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_ARG="${2:-}"; shift 2 ;;
    --confirm) CONFIRM=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ "${ENV_ARG}" == "production" || "${CLOUDFLARE_ENV:-}" == "production" ]]; then
  echo "ABORT: production cleanup is permanently banned for issue-504 fixture." >&2
  exit 1
fi
if [[ "${ENV_ARG}" != "staging" ]]; then
  echo "ABORT: --env must be exactly 'staging' (got: '${ENV_ARG}')." >&2
  exit 1
fi

DB_NAME="ubm-hyogo-db-staging"
SELECTOR="dedupe_key LIKE 'ubm-test-fixture-50k-%'"
DELETE_SQL="DELETE FROM schema_diff_queue WHERE ${SELECTOR};"

cat <<EOF
PLAN:
  env:        staging
  database:   ${DB_NAME}
  selector:   ${SELECTOR}
  statement:  ${DELETE_SQL}
EOF

if [[ "${CONFIRM}" -ne 1 ]]; then
  echo "DRY-RUN: pass --confirm to actually delete."
  exit 0
fi

CF_SH="$(dirname "$0")/../cf.sh"
if [[ ! -x "${CF_SH}" ]]; then
  CF_SH="scripts/cf.sh"
fi

bash "${CF_SH}" d1 execute "${DB_NAME}" --env staging --remote --command "${DELETE_SQL}"
bash "${CF_SH}" d1 execute "${DB_NAME}" --env staging --remote \
  --command "SELECT COUNT(*) AS remaining FROM schema_diff_queue WHERE ${SELECTOR};"
