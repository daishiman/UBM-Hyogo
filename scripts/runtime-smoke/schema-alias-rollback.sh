#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  schema-alias-rollback.sh --env <staging|production> --alias <alias-id> [--scenario <sent|skipped|failed>] [--dry-run]

Environment variables for real execution:
  STAGING_API_BASE or PRODUCTION_API_BASE
  STAGING_ADMIN_BEARER or PRODUCTION_ADMIN_BEARER

The script never calls wrangler directly. D1 reads go through scripts/cf.sh.
USAGE
}

ENV_NAME=""
ALIAS_ID=""
SCENARIO="sent"
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    --alias)
      ALIAS_ID="${2:-}"
      shift 2
      ;;
    --scenario)
      SCENARIO="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$ENV_NAME" != "staging" && "$ENV_NAME" != "production" ]]; then
  echo "--env must be staging or production" >&2
  exit 1
fi

if [[ -z "$ALIAS_ID" ]]; then
  echo "--alias is required" >&2
  exit 1
fi

if [[ ! "$ALIAS_ID" =~ ^[A-Za-z0-9._:-]+$ ]]; then
  echo "--alias may contain only letters, numbers, dot, underscore, colon, or hyphen" >&2
  exit 1
fi

case "$SCENARIO" in
  sent|skipped|failed) ;;
  *)
    echo "--scenario must be sent, skipped, or failed" >&2
    exit 1
    ;;
esac

redact() {
  sed -E \
    -e 's#https://hooks\.slack\.com/services/[A-Za-z0-9/_-]+#https://hooks.slack.com/services/<REDACTED>#g' \
    -e 's#(Authorization:[[:space:]]*Bearer )[A-Za-z0-9._~+/-]+=*#\1<REDACTED>#Ig' \
    -e 's#(X-Auth-Key:[[:space:]]*)[^[:space:]]+#\1<REDACTED>#Ig' \
    -e 's#(token=)[A-Za-z0-9._~+/-]+=*#\1<REDACTED>#Ig'
}

upper_env=$(printf "%s" "$ENV_NAME" | tr '[:lower:]' '[:upper:]')
api_base_var="${upper_env}_API_BASE"
bearer_var="${upper_env}_ADMIN_BEARER"
api_base="${!api_base_var:-}"
admin_bearer="${!bearer_var:-}"
database_name="ubm-hyogo-db"

if [[ "$ENV_NAME" == "staging" ]]; then
  database_name="ubm-hyogo-db-staging"
fi

rollback_path="/admin/schema/aliases/${ALIAS_ID}/rollback"
if [[ -n "$api_base" ]]; then
  rollback_url="${api_base%/}${rollback_path}"
else
  rollback_url="<${api_base_var} unset>${rollback_path}"
fi
audit_query="SELECT after_json FROM audit_log WHERE action='schema_alias.rollback_notification' AND target_id='${ALIAS_ID}' ORDER BY created_at DESC LIMIT 1;"

cat <<SUMMARY | redact
## Scenario ${SCENARIO}

- env: ${ENV_NAME}
- alias: ${ALIAS_ID}
- rollback_url: ${rollback_url:-"<${api_base_var} unset>"}
- audit_action: schema_alias.rollback_notification
- dry_run: ${DRY_RUN}
SUMMARY

if [[ "$DRY_RUN" -eq 1 ]]; then
  cat <<DRYRUN | redact

[DRY-RUN] Planned rollback POST:
curl -fsS -X POST "${rollback_url:-"<${api_base_var} unset>"}" -H "Authorization: Bearer ${admin_bearer:-"<${bearer_var} unset>"}" -H "Content-Type: application/json" --data '{"reason":"runtime-smoke:${SCENARIO}"}'

[DRY-RUN] Planned audit read:
bash scripts/cf.sh d1 execute ${database_name} --env ${ENV_NAME} --command "${audit_query}"
DRYRUN
  exit 0
fi

if [[ -z "$api_base" ]]; then
  echo "${api_base_var} is required for real execution" >&2
  exit 1
fi

if [[ -z "$admin_bearer" ]]; then
  echo "${bearer_var} is required for real execution" >&2
  exit 1
fi

printf "[USER-GATE] Type 'y' to execute rollback smoke against %s: " "$ENV_NAME" >&2
read -r answer
if [[ "$answer" != "y" ]]; then
  echo "aborted by user" >&2
  exit 2
fi

response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

http_status="$(curl -sS -o "$response_file" -w "%{http_code}" -X POST "$rollback_url" \
  -H "Authorization: Bearer ${admin_bearer}" \
  -H "Content-Type: application/json" \
  --data "{\"reason\":\"runtime-smoke:${SCENARIO}\"}")"

printf "## Rollback response\n\n- http_status: %s\n\n" "$http_status"
redact < "$response_file"
printf "\n"

if [[ ! "$http_status" =~ ^2[0-9][0-9]$ ]]; then
  echo "rollback request failed with HTTP ${http_status}" >&2
  exit 1
fi

printf "\n## Latest notification audit\n\n"
bash scripts/cf.sh d1 execute "$database_name" --env "$ENV_NAME" --command "$audit_query" | redact
