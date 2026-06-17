#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/seed-identity-conflicts.sh --env local|staging --action apply|cleanup

Production is intentionally unsupported.
USAGE
}

ENVIRONMENT=""
ACTION="apply"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="${2:-}"
      shift 2
      ;;
    --action)
      ACTION="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 64
      ;;
  esac
done

if [[ "$ENVIRONMENT" != "local" && "$ENVIRONMENT" != "staging" ]]; then
  echo "Refusing to seed identity conflicts outside local/staging: ${ENVIRONMENT:-<unset>}" >&2
  exit 2
fi

if [[ "$ACTION" != "apply" && "$ACTION" != "cleanup" ]]; then
  echo "Unsupported action: $ACTION" >&2
  exit 64
fi

SQL_FILE="apps/api/migrations/seed/identity-conflict-staging-seed.sql"
if [[ "$ACTION" == "cleanup" ]]; then
  SQL_FILE="apps/api/migrations/seed/identity-conflict-cleanup.sql"
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"

if [[ "$ENVIRONMENT" == "local" ]]; then
  pnpm --filter @ubm-hyogo/api exec wrangler d1 execute DB --local --file "$SQL_FILE"
else
  bash "$REPO_ROOT/scripts/cf.sh" d1 execute DB \
    --env staging \
    --remote \
    --config "$REPO_ROOT/apps/api/wrangler.toml" \
    --file "$SQL_FILE" \
    --yes
fi
