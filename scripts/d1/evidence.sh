#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 --ts <UTC compact ts> --type <preflight|apply|postcheck|meta> [--stdin] [--db <name>] [--env <name>] [--migration <name>] [--dry-run <0|1>] [--exit-code <code>] [--approver <name>]" >&2
}

ts=""
artifact_type=""
read_stdin=0
db=""
env_name=""
migration="0008_schema_alias_hardening"
dry_run=""
exit_code=""
approver=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --ts)
      ts="${2:-}"
      shift 2
      ;;
    --type)
      artifact_type="${2:-}"
      shift 2
      ;;
    --stdin)
      read_stdin=1
      shift
      ;;
    --db)
      db="${2:-}"
      shift 2
      ;;
    --env)
      env_name="${2:-}"
      shift 2
      ;;
    --migration)
      migration="${2:-}"
      shift 2
      ;;
    --dry-run)
      dry_run="${2:-}"
      shift 2
      ;;
    --exit-code)
      exit_code="${2:-}"
      shift 2
      ;;
    --approver)
      approver="${2:-}"
      shift 2
      ;;
    *)
      usage
      exit 64
      ;;
  esac
done

case "$artifact_type" in
  preflight|apply|postcheck|meta) ;;
  *)
    usage
    exit 64
    ;;
esac

if [ -z "$ts" ]; then
  usage
  exit 64
fi

repo_root="$(git rev-parse --show-toplevel)"
evidence_dir="$repo_root/.evidence/d1/$ts"
mkdir -p "$evidence_dir"

redact() {
  sed -E \
    -e 's/(CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID)[=:][^[:space:]]+/\1=***REDACTED***/g' \
    -e 's/Bearer [A-Za-z0-9_-]+/Bearer ***REDACTED***/g' \
    -e 's/sk-[A-Za-z0-9]+/sk-***REDACTED***/g' \
    -e 's/eyJ[A-Za-z0-9_-]+\./eyJ***REDACTED***./g'
}

case "$artifact_type" in
  preflight|postcheck)
    target="$evidence_dir/$artifact_type.json"
    ;;
  apply)
    target="$evidence_dir/apply.log"
    ;;
  meta)
    target="$evidence_dir/meta.json"
    ;;
esac

if [ "$artifact_type" = "meta" ] && [ "$read_stdin" -eq 0 ]; then
  commit_sha="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
  migration_file="$repo_root/apps/api/migrations/${migration}.sql"
  if [ -f "$migration_file" ]; then
    migration_sha="$(shasum -a 256 "$migration_file" | awk '{print $1}')"
    migration_filename="$(basename "$migration_file")"
  else
    migration_sha=""
    migration_filename="${migration%.sql}.sql"
  fi
  utc_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  timestamp_jst="$(TZ=Asia/Tokyo date +%Y-%m-%dT%H:%M:%S%z)"
  case "$dry_run" in
    1|true|TRUE) dry_run_json=true ;;
    0|false|FALSE|"") dry_run_json=false ;;
    *) dry_run_json=false ;;
  esac
  printf '{"db":"%s","env":"%s","commit_sha":"%s","migration_filename":"%s","migration_sha":"%s","timestamp_utc":"%s","timestamp_jst":"%s","approver":"%s","dry_run":%s,"exit_code":%s,"operator":"%s"}\n' \
    "$db" "$env_name" "$commit_sha" "$migration_filename" "$migration_sha" "$utc_at" "$timestamp_jst" "$approver" "$dry_run_json" "${exit_code:-0}" "${USER:-unknown}" > "$target"
elif [ "$read_stdin" -eq 1 ]; then
  redact > "$target"
else
  usage
  exit 64
fi

if rg -n "CLOUDFLARE_API_TOKEN[=:][A-Za-z0-9]|CLOUDFLARE_ACCOUNT_ID[=:][A-Za-z0-9]|sk-[A-Za-z0-9]+|Bearer [A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\\." "$evidence_dir" >/dev/null 2>&1; then
  rm -rf "$evidence_dir"
  echo "evidence redaction failed; evidence directory removed" >&2
  exit 80
fi

echo "$target"
