# Data Retention Policy

## Scope

This SSOT defines the Issue #402 retention policy for UBM-Hyogo member delete requests after admin approval.

## Current Policy

| Item | Canonical value |
| --- | --- |
| Workflow | `docs/30-workflows/issue-402-admin-request-retention-physical-delete/` |
| State | `implemented-local / implementation / NON_VISUAL / runtime evidence pending` |
| Retention period | 180 days from `deleted_members.deleted_at` |
| Due condition | `datetime(deleted_at, '+180 days') <= datetime('now') AND purged_at IS NULL` |
| Target tables | `member_responses`, `member_identities`, `member_status` |
| Tombstone table | `deleted_members` remains for audit minimum |
| Added columns | `deleted_members.purged_at`, `deleted_members.retention_policy_version` |
| Policy version | `v1-2026-05` |
| Cron route | Existing daily `0 18 * * *` branch in `apps/api/wrangler.toml`; no additional cron entry |
| Dry-run | Required before apply; dry-run has zero mutation |
| Production apply | User-gated operation after staging runtime evidence; default `RETENTION_PURGE_MODE=dry-run`, apply only after explicit `RETENTION_PURGE_MODE=apply` variable change |
| Disable switch | `RETENTION_PURGE_MODE=off` skips the daily purge job without changing cron count |
| Delete approve response | `POST /admin/requests/:noteId/resolve` returns `retentionPurgeScheduledAt = resolvedAt + 180 days` for delete approvals |

## Audit Minimum

`deleted_members` is not physically removed by the purge job. It keeps the minimum accountability record:

- `member_id`
- `deleted_by`
- `deleted_at`
- `reason`
- `purged_at`
- `retention_policy_version`

The purge audit event must not include names, email addresses, phone numbers, addresses, raw form answers, or free-text reason payloads beyond the existing `deleted_members.reason`.

## Existing Soft-Delete Rule Exception

The existing member-management rule remains: admin delete approval first performs logical delete via `member_status.is_deleted=1` and `deleted_members` insert. Issue #402 adds a later retention exception: after 180 days, PII-bearing member rows may be physically deleted while `deleted_members` remains as tombstone.

## Runtime Evidence Boundary

The specification can be complete before runtime evidence, but runtime PASS requires:

1. staging seed fixture
2. D1 PITR bookmark before apply
3. dry-run report
4. one-member apply result
5. audit log diff with no PII
6. invariant check for non-due rows
7. cron trigger log

Production cron enablement remains a separate user-approved operation gate.
