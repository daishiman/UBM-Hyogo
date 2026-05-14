#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
REPO="${REPO:-daishiman/UBM-Hyogo}"
ROOT="$(git rev-parse --show-toplevel)"

usage() {
  echo "usage: $0 {dev|main|all}" >&2
}

build_payload() {
  local branch="$1"
  local desired="${ROOT}/.github/branch-protection/${branch}.json"

  [[ -f "$desired" ]] || { echo "missing desired contexts: $desired" >&2; exit 1; }

  # CLAUDE.md invariants are enforced on every apply:
  #   INV-SOLO  required_pull_request_reviews=null
  #   INV-ENF   enforce_admins=true
  #   INV-LINEAR required_linear_history=true
  #   INV-LOCK  lock_branch=false
  # Other optional fields are preserved from the fresh GET response.
  gh api "repos/${REPO}/branches/${branch}/protection" |
    jq --slurpfile desired "$desired" '{
      required_status_checks: {
        strict: (.required_status_checks.strict // false),
        contexts: $desired[0].contexts
      },
      enforce_admins: true,
      required_pull_request_reviews: null,
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: (.allow_force_pushes.enabled // false),
      allow_deletions: (.allow_deletions.enabled // false),
      block_creations: (.block_creations.enabled // false),
      required_conversation_resolution: (.required_conversation_resolution.enabled // true),
      lock_branch: false,
      allow_fork_syncing: (.allow_fork_syncing.enabled // false)
    }'
}

apply_one() {
  local branch="$1"
  local payload
  payload="$(mktemp)"
  build_payload "$branch" > "$payload"
  gh api -X PUT "repos/${REPO}/branches/${branch}/protection" \
    -H "Accept: application/vnd.github+json" \
    --input "$payload"
  rm -f "$payload"
}

case "$TARGET" in
  dev|main) apply_one "$TARGET" ;;
  all) apply_one dev; apply_one main ;;
  *) usage; exit 1 ;;
esac
