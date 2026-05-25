#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage:
  bash scripts/run-login-staging-smoke.sh <staging-base-url>
  PLAYWRIGHT_STAGING_BASE_URL=<staging-base-url> bash scripts/run-login-staging-smoke.sh

Runs /login Playwright visual smoke against Cloudflare Workers staging and writes
PNG evidence to docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots/.
USAGE
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
staging_base_url="${1:-${PLAYWRIGHT_STAGING_BASE_URL:-}}"

if [[ -z "${staging_base_url}" ]]; then
  usage
  exit 1
fi

if [[ "${staging_base_url}" != https://* ]]; then
  echo "ERROR: staging base URL must start with https:// (got: ${staging_base_url})" >&2
  exit 1
fi

evidence_dir="../../docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"
mkdir -p "${repo_root}/docs/30-workflows/completed-tasks/issue-874-login-staging-visual-smoke/outputs/phase-11/staging-screenshots"

cd "${repo_root}"

PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_STAGING_BASE_URL="${staging_base_url}" \
PLAYWRIGHT_EVIDENCE_DIR="${evidence_dir}" \
pnpm --dir apps/web exec playwright test playwright/tests/login-smoke.spec.ts \
  --project=staging \
  --grep 'renders LoginCard|captures mobile input' \
  --reporter=line
