#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
WEB_CD="$REPO_ROOT/.github/workflows/web-cd.yml"
BACKEND_CI="$REPO_ROOT/.github/workflows/backend-ci.yml"
POST_RELEASE_DASHBOARD="$REPO_ROOT/.github/workflows/post-release-dashboard.yml"

fail() {
  echo "workflow-env-scope.test.sh: $*" >&2
  exit 1
}

assert_no_job_level_cf_token() {
  local file="$1"
  awk '
    /^[[:space:]]{2}[A-Za-z0-9_-]+:/ { in_job=1; job_indent=2; in_job_env=0; next }
    in_job && /^[[:space:]]{4}env:[[:space:]]*$/ { in_job_env=1; next }
    in_job_env && /^[[:space:]]{4}[A-Za-z0-9_-]+:/ { in_job_env=0 }
    in_job_env && /CLOUDFLARE_API_TOKEN[[:space:]]*:/ { print FILENAME ":" FNR ":" $0; found=1 }
    END { exit found ? 1 : 0 }
  ' "$file" || fail "$file has job-level CLOUDFLARE_API_TOKEN"
}

assert_no_build_install_token_env() {
  local file="$1"
  awk '
    /name: (Install|Build|Lint|Typecheck)/ { step=1; step_name=$0; next }
    step && /^[[:space:]]{6}- / { step=0 }
    step && /CLOUDFLARE_API_TOKEN/ { print FILENAME ":" FNR ":" step_name " -> " $0; found=1 }
    END { exit found ? 1 : 0 }
  ' "$file" || fail "$file exposes CLOUDFLARE_API_TOKEN to build/install/lint/typecheck step"
}

assert_no_job_level_cf_token "$WEB_CD"
assert_no_job_level_cf_token "$BACKEND_CI"
assert_no_job_level_cf_token "$POST_RELEASE_DASHBOARD"
while IFS= read -r workflow; do
  assert_no_job_level_cf_token "$workflow"
done < <(find "$REPO_ROOT/.github/workflows" -maxdepth 1 -type f \( -name '*.yml' -o -name '*.yaml' \) | sort)
assert_no_build_install_token_env "$WEB_CD"
assert_no_build_install_token_env "$BACKEND_CI"

grep -q 'name: Deploy to Cloudflare Workers (staging)' "$WEB_CD" || fail "web-cd staging deploy step missing"
grep -A8 'name: Deploy to Cloudflare Workers (staging)' "$WEB_CD" | grep -q 'CLOUDFLARE_API_TOKEN' || fail "web-cd staging deploy step missing token env"
grep -A8 'name: Deploy to Cloudflare Workers (production)' "$WEB_CD" | grep -q 'CLOUDFLARE_API_TOKEN' || fail "web-cd production deploy step missing token env"
grep -A12 'name: Deploy to Cloudflare Workers (staging)' "$WEB_CD" | grep -q 'set -o pipefail' || fail "web-cd staging deploy pipefail missing"
grep -A12 'name: Deploy to Cloudflare Workers (production)' "$WEB_CD" | grep -q 'set -o pipefail' || fail "web-cd production deploy pipefail missing"

# shellcheck disable=SC2016
backend_token_count="$(grep -c 'apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}' "$BACKEND_CI")"
[ "$backend_token_count" -eq 4 ] || fail "backend-ci should keep exactly 4 step-scoped wrangler apiToken entries, got $backend_token_count"

grep -q 'Verify deploy log redaction (staging)' "$WEB_CD" || fail "web-cd staging redaction check missing"
grep -q 'Verify deploy log redaction (production)' "$WEB_CD" || fail "web-cd production redaction check missing"
# shellcheck disable=SC2016
grep -A4 'name: Verify deploy log redaction (staging)' "$WEB_CD" | grep -q -- '--account-id "$CLOUDFLARE_ACCOUNT_ID"' || fail "web-cd staging redaction check must pass account id"
# shellcheck disable=SC2016
grep -A4 'name: Verify deploy log redaction (production)' "$WEB_CD" | grep -q -- '--account-id "$CLOUDFLARE_ACCOUNT_ID"' || fail "web-cd production redaction check must pass account id"
grep -A4 'name: Collect dashboard' "$POST_RELEASE_DASHBOARD" | grep -q 'CLOUDFLARE_API_TOKEN' || fail "post-release dashboard collect step missing token env"

echo "workflow-env-scope.test.sh: all assertions passed"
