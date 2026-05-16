#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: scripts/ci/verify-env-secrets.sh [--workflows-dir DIR] [--allow-list FILE] [--json] [--event-name EVENT] [--owner OWNER] [--repo REPO]

Checks GitHub Actions workflow secrets.NAME references against repository and
job environment secret inventories. Secret values are never requested.
When --event-name is set, only workflows that can be triggered by that event
are scanned. Omit it for a full inventory scan.
USAGE
}

workflows_dir=".github/workflows"
allow_list="scripts/ci/verify-env-secrets.allowlist"
json_output=0
event_name=""
owner=""
repo=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --workflows-dir)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      workflows_dir="$2"
      shift 2
      ;;
    --allow-list)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      allow_list="$2"
      shift 2
      ;;
    --json)
      json_output=1
      shift
      ;;
    --event-name)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      event_name="$2"
      shift 2
      ;;
    --owner)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      owner="$2"
      shift 2
      ;;
    --repo)
      [ "$#" -ge 2 ] || { usage; exit 2; }
      repo="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if [ ! -d "$workflows_dir" ]; then
  echo "workflows dir not found: $workflows_dir" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required" >&2
  exit 2
fi

if [ -z "$owner" ] || [ -z "$repo" ]; then
  remote="$(git config --get remote.origin.url 2>/dev/null || true)"
  if [ -n "$remote" ]; then
    owner_repo="$(printf '%s\n' "$remote" \
      | sed -E 's#^git@github.com:##; s#^https://github.com/##; s#\.git$##')"
    owner="${owner:-${owner_repo%%/*}}"
    repo="${repo:-${owner_repo#*/}}"
  fi
fi

owner="${owner:-daishiman}"
repo="${repo:-UBM-Hyogo}"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

allow_names="$tmp/allow-names.txt"
: > "$allow_names"
if [ -f "$allow_list" ]; then
  while IFS= read -r line; do
    case "$line" in
      ""|\#*) continue ;;
    esac
    case "$line" in
      name=*";reason="?*)
        name_part="${line%%;reason=*}"
        printf '%s\n' "${name_part#name=}" >> "$allow_names"
        ;;
      *)
        echo "invalid allow-list line: $line" >&2
        exit 2
        ;;
    esac
  done < "$allow_list"
fi

repo_secrets="$tmp/repo-secrets.txt"
if ! gh api "repos/$owner/$repo/actions/secrets" --paginate --jq '.secrets[].name' > "$repo_secrets"; then
  echo "failed to list repository secrets" >&2
  exit 3
fi

contains_line() {
  local file="$1"
  local value="$2"
  [ -f "$file" ] && grep -Fxq "$value" "$file"
}

workflow_matches_event() {
  local workflow="$1"
  [ -z "$event_name" ] && return 0
  awk -v event="$event_name" '
    /^[[:space:]]*#/ { next }
    /^on:[[:space:]]*\[/ {
      line=$0
      gsub(/[,"'\''\[\]]/, " ", line)
      split(line, parts, /[[:space:]]+/)
      for (i in parts) {
        if (parts[i] == event) found=1
      }
      next
    }
    /^on:[[:space:]]*$/ { in_on=1; next }
    in_on && /^[A-Za-z0-9_-]+:[[:space:]]*$/ { in_on=0 }
    in_on && $0 ~ ("^[[:space:]]+" event ":[[:space:]]*$") { found=1 }
    END { exit(found ? 0 : 1) }
  ' "$workflow"
}

env_secret_file() {
  local env_name="$1"
  local sanitized
  sanitized="$(printf '%s' "$env_name" | tr -c 'A-Za-z0-9_.-' '_')"
  local file="$tmp/env-$sanitized.txt"
  local err="$tmp/env-$sanitized.err"
  local missing="$tmp/env-$sanitized.missing"
  if [ ! -f "$file" ]; then
    if ! gh api "repos/$owner/$repo/environments/$env_name/secrets" --paginate --jq '.secrets[].name' > "$file" 2> "$err"; then
      if grep -q 'HTTP 404' "$err"; then
        : > "$file"
        : > "$missing"
      else
        cat "$err" >&2
        rm -f "$file"
        echo "failed to list environment secrets: $env_name" >&2
        exit 3
      fi
    fi
  fi
  printf '%s\n' "$file"
}

env_missing() {
  local env_name="$1"
  local sanitized
  sanitized="$(printf '%s' "$env_name" | tr -c 'A-Za-z0-9_.-' '_')"
  [ -f "$tmp/env-$sanitized.missing" ]
}

resolve_reason() {
  local env_name="$1"
  if [ "$env_name" != "repo" ] && env_missing "$env_name"; then
    printf '%s\n' "missing-environment-and-repo-secret"
  else
    printf '%s\n' "missing-in-env-and-repo"
  fi
}

extract_refs() {
  local workflow="$1"
  awk -v file="$workflow" '
    function emit_secret(line, secret_line) {
      while (match(line, /secrets\.[A-Z_][A-Z0-9_]*/)) {
        secret_line=substr(line, RSTART + 8, RLENGTH - 8)
        print file "\t" job "\t" (env == "" ? "repo" : env) "\t" secret_line
        line=substr(line, RSTART + RLENGTH)
      }
    }
    /^on:[[:space:]]*$/ { in_on=1; next }
    in_on && /^[A-Za-z0-9_-]+:[[:space:]]*$/ { in_on=0 }
    in_on && /^  workflow_call:[[:space:]]*$/ { has_workflow_call=1; next }
    /^jobs:[[:space:]]*$/ { in_jobs=1; next }
    in_jobs && /^[^[:space:]][^:]*:/ { in_jobs=0 }
    in_jobs && /^  [A-Za-z0-9_-]+:[[:space:]]*$/ {
      job=$1
      sub(/:$/, "", job)
      env=""
      disabled=0
      awaiting_env_name=0
      next
    }
    in_jobs && job != "" && /^    if:[[:space:]]*(false|\$\{\{[[:space:]]*false[[:space:]]*\}\})[[:space:]]*$/ {
      disabled=1
      next
    }
    in_jobs && job != "" && /^    environment:[[:space:]]*[A-Za-z0-9_.-]+[[:space:]]*$/ {
      env=$0
      sub(/^    environment:[[:space:]]*/, "", env)
      gsub(/[[:space:]]+$/, "", env)
      awaiting_env_name=0
      next
    }
    in_jobs && job != "" && /^    environment:[[:space:]]*$/ {
      awaiting_env_name=1
      next
    }
    in_jobs && job != "" && awaiting_env_name == 1 && /^      name:[[:space:]]*[A-Za-z0-9_.-]+[[:space:]]*$/ && env == "" {
      env=$0
      sub(/^      name:[[:space:]]*/, "", env)
      gsub(/[[:space:]]+$/, "", env)
      awaiting_env_name=0
      next
    }
    in_jobs && job != "" && awaiting_env_name == 1 && /^    [A-Za-z0-9_-]+:/ {
      awaiting_env_name=0
    }
    in_jobs && job != "" && disabled == 0 && has_workflow_call == 0 {
      emit_secret($0)
    }
  ' "$workflow"
}

refs="$tmp/refs.tsv"
: > "$refs"
while IFS= read -r workflow; do
  workflow_matches_event "$workflow" || continue
  extract_refs "$workflow" >> "$refs"
done < <(find "$workflows_dir" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)

unresolved="$tmp/unresolved.tsv"
: > "$unresolved"
sort -u "$refs" | while IFS=$'\t' read -r workflow job env_name secret; do
  [ -n "$secret" ] || continue
  [ "$secret" = "GITHUB_TOKEN" ] && continue
  contains_line "$allow_names" "$secret" && continue

  if [ "$env_name" != "repo" ]; then
    env_file="$(env_secret_file "$env_name")"
    if contains_line "$env_file" "$secret" || contains_line "$repo_secrets" "$secret"; then
      continue
    fi
  elif contains_line "$repo_secrets" "$secret"; then
    continue
  fi

  resolved_env="$env_name"
  printf '%s\t%s\t%s\t%s\t%s\n' \
    "$workflow" "$job" "$resolved_env" "$secret" "$(resolve_reason "$resolved_env")" >> "$unresolved"
done

if [ "$json_output" -eq 1 ]; then
  if [ ! -s "$unresolved" ]; then
    printf '[]\n'
  else
    printf '[\n'
    first=1
    while IFS=$'\t' read -r workflow job env_name secret reason; do
      [ "$first" -eq 1 ] || printf ',\n'
      first=0
      printf '  {"workflow":"%s","job":"%s","env":"%s","secret":"%s","reason":"%s"}' \
        "$workflow" "$job" "$env_name" "$secret" "$reason"
    done < "$unresolved"
    printf '\n]\n'
  fi
else
  while IFS=$'\t' read -r workflow job env_name secret reason; do
    printf 'workflow=%s;job=%s;env=%s;secret=%s;reason=%s\n' \
      "$workflow" "$job" "$env_name" "$secret" "$reason"
  done < "$unresolved"
fi

[ ! -s "$unresolved" ]
