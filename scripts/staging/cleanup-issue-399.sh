#!/usr/bin/env bash
# Remove issue-399 staging fixtures and verify remaining count = 0.
# Refuses to run unless CLOUDFLARE_ENV=staging (NFR-02 guard).
set -euo pipefail

ENV="${CLOUDFLARE_ENV:-}"
if [ "$ENV" != "staging" ]; then
  echo "ERROR: CLOUDFLARE_ENV must be 'staging' (got: '${ENV}')" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CLEANUP_FILE="$REPO_ROOT/apps/api/migrations/seed/issue-399-admin-queue-staging-cleanup.sql"

if [ ! -f "$CLEANUP_FILE" ]; then
  echo "ERROR: cleanup file missing: $CLEANUP_FILE" >&2
  exit 1
fi

bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging \
  --remote \
  --file "$CLEANUP_FILE"

# Verify count=0 for both tables.
RESULT_NOTES=$(bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging --remote --json \
  --command "SELECT count(*) AS c FROM admin_member_notes WHERE note_id LIKE 'ISSUE399-%';")
RESULT_MEMBERS=$(bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging --remote --json \
  --command "SELECT count(*) AS c FROM member_status WHERE member_id LIKE 'ISSUE399-%';")
RESULT_DELETED=$(bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging --remote --json \
  --command "SELECT count(*) AS c FROM deleted_members WHERE member_id LIKE 'ISSUE399-%';")
RESULT_AUDIT=$(bash "$REPO_ROOT/scripts/cf.sh" d1 execute ubm-hyogo-db-staging \
  --env staging --remote --json \
  --command "SELECT count(*) AS c FROM audit_log WHERE target_id LIKE 'ISSUE399-%';")

echo "notes:    $RESULT_NOTES"
echo "members:  $RESULT_MEMBERS"
echo "deleted:  $RESULT_DELETED"
echo "audit:    $RESULT_AUDIT"

echo "$RESULT_NOTES"   | grep -q '"c":0' || { echo "ERROR: admin_member_notes cleanup incomplete" >&2; exit 1; }
echo "$RESULT_MEMBERS" | grep -q '"c":0' || { echo "ERROR: member_status cleanup incomplete" >&2; exit 1; }
echo "$RESULT_DELETED" | grep -q '"c":0' || { echo "ERROR: deleted_members cleanup incomplete" >&2; exit 1; }
echo "$RESULT_AUDIT"   | grep -q '"c":0' || { echo "ERROR: audit_log cleanup incomplete" >&2; exit 1; }

echo "OK: issue-399 staging fixtures fully removed."
