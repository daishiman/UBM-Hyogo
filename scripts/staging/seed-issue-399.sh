#!/usr/bin/env bash
# Seed issue-399 staging fixtures into the staging D1.
# Refuses to run unless CLOUDFLARE_ENV=staging (NFR-02 guard).
set -euo pipefail

ENV="${CLOUDFLARE_ENV:-}"
if [ "$ENV" != "staging" ]; then
  echo "ERROR: CLOUDFLARE_ENV must be 'staging' (got: '${ENV}')" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
SEED_FILE="$REPO_ROOT/apps/api/migrations/seed/issue-399-admin-queue-staging-seed.sql"

if [ ! -f "$SEED_FILE" ]; then
  echo "ERROR: seed file missing: $SEED_FILE" >&2
  exit 1
fi

bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging \
  --remote \
  --file "$SEED_FILE"
