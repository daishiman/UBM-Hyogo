#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <db> --env <staging|production>" >&2
}

db="${1:-}"
if [ -z "$db" ]; then
  usage
  exit 64
fi
shift

env_name=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      env_name="${2:-}"
      shift 2
      ;;
    *)
      usage
      exit 64
      ;;
  esac
done

case "$env_name" in
  staging|production) ;;
  *)
    usage
    exit 64
    ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
cf_wrapper="${CF_WRAPPER:-$repo_root/scripts/cf.sh}"

query() {
  local sql="$1"
  bash "$cf_wrapper" d1 execute "$db" --env "$env_name" --remote --command "$sql"
}

missing=()

columns="$(query "PRAGMA table_info(schema_diff_queue);" || true)"
for col in backfill_cursor backfill_status; do
  if ! printf '%s\n' "$columns" | grep -F "$col" >/dev/null; then
    missing+=("schema_diff_queue.$col")
  fi
done

verified_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ "${#missing[@]}" -gt 0 ]; then
  printf '{"verified_at":"%s","missing":["%s"]}\n' "$verified_at" "$(IFS=,; echo "${missing[*]}")"
  exit 70
fi

printf '{"verified_at":"%s","objects":{"schema_diff_queue.backfill_cursor":true,"schema_diff_queue.backfill_status":true},"missing":[]}\n' "$verified_at"
