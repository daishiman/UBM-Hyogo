#!/usr/bin/env bash
set -euo pipefail

REPO="${REPO:-daishiman/UBM-Hyogo}"

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
  response="$(gh api "repos/${REPO}/branches/${branch}/protection" \
    --jq '{
      contexts: .required_status_checks.contexts,
      reviews: .required_pull_request_reviews.required_approving_review_count,
      force_push: .allow_force_pushes.enabled,
      deletions: .allow_deletions.enabled,
      enforce_admins: .enforce_admins.enabled,
      dismiss_stale: .required_pull_request_reviews.dismiss_stale_reviews
    }')"

  require_json "${branch}.contexts" "$(jq -c '.contexts' <<<"$response")" '["ci","Validate Build"]'
  require_json "${branch}.reviews" "$(jq -r '.reviews' <<<"$response")" '0'
  require_json "${branch}.force_push" "$(jq -r '.force_push' <<<"$response")" 'false'
  require_json "${branch}.deletions" "$(jq -r '.deletions' <<<"$response")" 'false'
  require_json "${branch}.enforce_admins" "$(jq -r '.enforce_admins' <<<"$response")" 'false'
  require_json "${branch}.dismiss_stale" "$(jq -r '.dismiss_stale' <<<"$response")" 'false'
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
