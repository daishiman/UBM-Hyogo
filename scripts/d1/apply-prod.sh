#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <db> --env <staging|production> [--migration <name>]" >&2
}

db="${1:-}"
if [ -z "$db" ]; then
  usage
  exit 64
fi
shift

env_name=""
migration="0008_schema_alias_hardening"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --env)
      env_name="${2:-}"
      shift 2
      ;;
    --migration)
      migration="${2:-}"
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
ts="$(date -u +%Y%m%dT%H%M%SZ)"
cf_wrapper="${CF_WRAPPER:-$repo_root/scripts/cf.sh}"

preflight_log="$(mktemp)"
apply_log="$(mktemp)"
postcheck_log="$(mktemp)"
trap 'rm -f "$preflight_log" "$apply_log" "$postcheck_log"' EXIT

if ! bash "$repo_root/scripts/d1/preflight.sh" "$db" --env "$env_name" --migration "$migration" --json > "$preflight_log"; then
  cat "$preflight_log" >&2
  exit 10
fi
bash "$repo_root/scripts/d1/evidence.sh" --ts "$ts" --type preflight --stdin < "$preflight_log" >/dev/null || exit 80

if [ "${DRY_RUN:-0}" != "1" ] && [ "$env_name" = "production" ]; then
  printf 'Apply %s to %s (%s)? [y/N] ' "$migration" "$db" "$env_name" >&2
  read -r answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) echo "apply denied" >&2; exit 20 ;;
  esac
fi

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "[DRY_RUN] skipping migrations apply for $db ($env_name)" > "$apply_log"
else
  if ! bash "$cf_wrapper" d1 migrations apply "$db" --env "$env_name" --remote < /dev/null > "$apply_log" 2>&1; then
    cat "$apply_log" >&2
    bash "$repo_root/scripts/d1/evidence.sh" --ts "$ts" --type apply --stdin < "$apply_log" >/dev/null || exit 80
    exit 30
  fi
fi
bash "$repo_root/scripts/d1/evidence.sh" --ts "$ts" --type apply --stdin < "$apply_log" >/dev/null || exit 80

if [ "${DRY_RUN:-0}" = "1" ]; then
  printf '{"verified_at":"%s","dry_run":true,"postcheck":"skipped","reason":"migration apply skipped; target objects are not required to exist before production apply"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$postcheck_log"
else
  if ! bash "$repo_root/scripts/d1/postcheck.sh" "$db" --env "$env_name" > "$postcheck_log"; then
    cat "$postcheck_log" >&2
    exit 40
  fi
fi
bash "$repo_root/scripts/d1/evidence.sh" --ts "$ts" --type postcheck --stdin < "$postcheck_log" >/dev/null || exit 80
bash "$repo_root/scripts/d1/evidence.sh" --ts "$ts" --type meta \
  --db "$db" --env "$env_name" --migration "$migration" --dry-run "${DRY_RUN:-0}" --exit-code 0 >/dev/null || exit 80

echo "D1 migration verification completed: .evidence/d1/$ts"
