#!/usr/bin/env bash
# Provision GitHub environment secrets for `staging-runtime-smoke`.
#
# Invariants:
# - Do not print secret values, hashes, fragments, decoded cookies, or webhook URLs.
# - Pipe `op read` directly into `gh secret set`; gh reads stdin when --body is omitted.
# - Create the GitHub Environment if it is missing.
# - Store these credentials only as environment-scoped GitHub secrets.
# - Do not enable shell xtrace.
set -euo pipefail

REPO="daishiman/UBM-Hyogo"
ENV_NAME="staging-runtime-smoke"

SECRETS=(
  "STAGING_API_BASE:op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  "STAGING_ADMIN_BEARER:op://Employee/ubm-hyogo-env/STAGING_ADMIN_BEARER"
  "STAGING_MEMBER_ID:op://Employee/ubm-hyogo-env/STAGING_MEMBER_ID"
  "STAGING_ME_BEARER:op://Employee/ubm-hyogo-env/STAGING_ME_BEARER"
  "SLACK_WEBHOOK_INCIDENT:op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_STAGING"
)

usage() {
  cat <<'USAGE'
Usage: bash scripts/smoke/provision-staging-secrets.sh

Provision the five GitHub environment secrets required by
`staging-runtime-smoke` from 1Password references. The script is idempotent and
prints secret names only.

Prerequisites:
  - `op signin` is active
  - `gh auth status` has write access to daishiman/UBM-Hyogo
  - `STAGING_API_BASE` points at the real staging origin, not localhost
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "::error::required command not found: $cmd" >&2
    exit 1
  fi
}

require_cmd op
require_cmd gh

if ! op whoami >/dev/null 2>&1; then
  echo "::error::1Password CLI session is not active. Run 'op signin' first." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "::error::gh CLI is not authenticated. Run 'gh auth login' first." >&2
  exit 1
fi

ensure_environment() {
  gh api -X PUT "repos/${REPO}/environments/${ENV_NAME}" >/dev/null
  echo "PASS: GitHub environment exists: ${ENV_NAME}"
}

verify_staging_marker() {
  local ref="op://Employee/ubm-hyogo-env/STAGING_API_BASE"
  local value
  value="$(op read "$ref")"
  if printf '%s' "$value" | grep -qE '(staging|-staging\.|workers\.dev|ubm-hyogo-web-staging)'; then
    echo "PASS: STAGING_API_BASE staging marker detected (value not printed)"
  else
    echo "::error::STAGING_API_BASE does not look like a staging origin. Refusing to provision." >&2
    unset value
    exit 1
  fi
  unset value
}

ensure_environment
verify_staging_marker

for pair in "${SECRETS[@]}"; do
  name="${pair%%:*}"
  ref="${pair#*:}"
  if op read "$ref" | gh secret set "$name" --env "$ENV_NAME" --repo "$REPO"; then
    echo "set: $name"
  else
    echo "::error::failed to set secret: $name" >&2
    exit 1
  fi
done

echo "---"
echo "verifying inventory:"
inventory="$(gh api "repos/${REPO}/environments/${ENV_NAME}/secrets" --jq '.secrets[].name' | sort)"
expected="$(printf '%s\n' "${SECRETS[@]}" | awk -F: '{print $1}' | sort)"

if [[ "$inventory" != "$expected" ]]; then
  echo "::error::secret inventory mismatch" >&2
  echo "expected names:" >&2
  printf '%s\n' "$expected" >&2
  echo "actual names:" >&2
  printf '%s\n' "$inventory" >&2
  exit 1
fi

printf '%s\n' "$inventory"
echo "PASS: staging-runtime-smoke secret inventory is complete"
