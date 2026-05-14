#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-daishiman/UBM-Hyogo}"
ROOT="$(git rev-parse --show-toplevel)"

require_json() {
  local label="$1"
  local actual="$2"
  local expected="$3"

  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s: expected %s, got %s\n' "$label" "$expected" "$actual" >&2
    exit 1
  fi

  printf 'PASS %s: %s\n' "$label" "$actual"
}

check_branch() {
  local branch="$1"
  local response
  local expected_contexts
  local expected_strict

  expected_contexts="$(jq -c '.contexts' "${ROOT}/.github/branch-protection/${branch}.json")"
  expected_strict="$(jq -r '.strict // false' "${ROOT}/.github/branch-protection/${branch}.json")"
  response="$(gh api "repos/${REPO}/branches/${branch}/protection" \
    --jq '{
      contexts: .required_status_checks.contexts,
      strict: .required_status_checks.strict,
      reviews: .required_pull_request_reviews,
      force_push: .allow_force_pushes.enabled,
      deletions: .allow_deletions.enabled,
      enforce_admins: .enforce_admins.enabled,
      linear_history: .required_linear_history.enabled,
      lock_branch: .lock_branch.enabled,
      conversation_resolution: .required_conversation_resolution.enabled
    }')"

  require_json "${branch}.contexts" "$(jq -c '.contexts | sort' <<<"$response")" "$(jq -c 'sort' <<<"$expected_contexts")"
  require_json "${branch}.strict" "$(jq -r '.strict' <<<"$response")" "$expected_strict"
  require_json "${branch}.reviews" "$(jq -r '.reviews' <<<"$response")" 'null'
  require_json "${branch}.force_push" "$(jq -r '.force_push' <<<"$response")" 'false'
  require_json "${branch}.deletions" "$(jq -r '.deletions' <<<"$response")" 'false'
  require_json "${branch}.enforce_admins" "$(jq -r '.enforce_admins' <<<"$response")" 'true'
  require_json "${branch}.linear_history" "$(jq -r '.linear_history' <<<"$response")" 'true'
  require_json "${branch}.lock_branch" "$(jq -r '.lock_branch' <<<"$response")" 'false'
  require_json "${branch}.conversation_resolution" "$(jq -r '.conversation_resolution' <<<"$response")" 'true'
  printf 'OK(%s): no drift\n' "$branch"
}

check_environment() {
  local environment="$1"
  local expected_branch="$2"
  local branch_policy
  local reviewers

  branch_policy="$(gh api "repos/${REPO}/environments/${environment}/deployment-branch-policies" \
    --jq '[.branch_policies[]? | {name,type}]')"
  reviewers="$(gh api "repos/${REPO}/environments/${environment}" \
    --jq '[.protection_rules[]? | select(.type == "required_reviewers") | .reviewers[]?]')"

  require_json "${environment}.branch_policies" "$(jq -c '.' <<<"$branch_policy")" "[{\"name\":\"${expected_branch}\",\"type\":\"branch\"}]"
  require_json "${environment}.required_reviewers" "$(jq -c '.' <<<"$reviewers")" '[]'
}

check_branch main
check_branch dev
check_environment production main
check_environment staging dev

printf 'PASS branch protection verification for %s\n' "$REPO"
