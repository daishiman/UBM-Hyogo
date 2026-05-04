#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <db> --env <staging|production> [--migration <name>] [--expect <pending|applied>] [--json]" >&2
}

db="${1:-}"
if [ -z "$db" ]; then
  usage
  exit 64
fi
shift

env_name=""
migration="0008_schema_alias_hardening"
expect="pending"
json=0

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
    --expect)
      expect="${2:-}"
      shift 2
      ;;
    --json)
      json=1
      shift
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

case "$expect" in
  pending|applied) ;;
  *)
    usage
    exit 64
    ;;
esac

case "$env_name:$db" in
  staging:ubm-hyogo-db-staging|production:ubm-hyogo-db-prod) ;;
  *)
    echo "preflight failed: db/env mismatch: db=$db env=$env_name" >&2
    exit 66
    ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
cf_wrapper="${CF_WRAPPER:-$repo_root/scripts/cf.sh}"

if ! bash "$cf_wrapper" whoami >/dev/null 2>&1; then
  echo "preflight failed: Cloudflare authentication failed" >&2
  exit 65
fi

if ! bash "$cf_wrapper" d1 list 2>/dev/null | grep -F "$db" >/dev/null; then
  echo "preflight failed: D1 database not found: $db" >&2
  exit 66
fi

migrations="$(bash "$cf_wrapper" d1 migrations list "$db" --env "$env_name" 2>/dev/null || true)"
if printf '%s\n' "$migrations" | grep -F "$migration" | grep -Ei 'applied|success' >/dev/null; then
  actual="applied"
else
  actual="pending"
fi

external_pending="$(printf '%s\n' "$migrations" | grep -Ei 'pending|not applied|unapplied' | grep -Fv "$migration" || true)"
if [ -n "$external_pending" ]; then
  echo "preflight failed: target-external pending migrations exist; refusing broad d1 migrations apply" >&2
  printf '%s\n' "$external_pending" >&2
  exit 67
fi

if [ "$actual" != "$expect" ]; then
  echo "preflight failed: migration state mismatch: migration=$migration expected=$expect actual=$actual" >&2
  exit 65
fi

head_sha="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
utc_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ "$json" -eq 1 ]; then
  printf '{"db":"%s","env":"%s","migration":"%s","expected_state":"%s","actual_state":"%s","head_sha":"%s","utc_at":"%s"}\n' \
    "$db" "$env_name" "$migration" "$expect" "$actual" "$head_sha" "$utc_at"
else
  echo "preflight ok: $migration is $actual for $db ($env_name)"
fi
