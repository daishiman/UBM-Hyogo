# 2026-05-06 Issue #402 Retention Purge

## Summary

Synchronized Issue #402 retention physical delete as `implemented-local / implementation / NON_VISUAL`. Added `data-retention-policy.md` SSOT, `RETENTION_PURGE_MODE` / `RETENTION_PURGE_LIMIT` environment contract, retention purge implementation, migration, focused tests, and runbook.

## Notes

- Default scheduled mode is `dry-run`.
- Production apply is user-gated via explicit `RETENTION_PURGE_MODE=apply`.
- `deleted_members` remains as the audit minimum tombstone with `purged_at` and `retention_policy_version`.
- Phase 11 runtime evidence remains pending.

## Wave 2 (audit follow-up)

- `data-retention-policy.md`: removed duplicate `Delete approve response` row.
- `database-schema.md`: added `deleted_members` table row (purge metadata columns / `idx_deleted_members_purge_due` / migration `0014_add_deleted_members_purge_metadata.sql`); compacted trailing sections to keep the file under the 500-line budget.
- `database-schema-index.md`: appended 1.4.0 changelog entry pointing at the SSOT.
- `deployment-cloudflare.md`: annotated the existing `0 18 * * *` cron row with the issue-402 retention purge dry-run/apply branch (no fan-out, no extra cron entry).
- `observability-monitoring.md`: added `cron.retention.start` / `cron.retention.end` / `audit_log.action=retention_purge` events with SSOT reference.
- `environment-variables.md`: deduplicated `RETENTION_PURGE_MODE` / `RETENTION_PURGE_LIMIT` from the trailing summary table (kept primary table at L67-68); compressed adjacent prose / Codecov requirement bullet to bring the file from 507 → 498 lines.
- `indexes/quick-reference.md`: added retention purge env lookup row linking `environment-variables.md` and `data-retention-policy.md`.
- `indexes/topic-map.md`: added a `deleted_members` section index with purge metadata pointer under `references/database-schema.md`.
- `indexes/resource-map.md`: appended retention runbook path `docs/runbooks/retention-physical-delete.md` to the issue-402 workflow row.
- `indexes/keywords.json`: linked `data-retention-policy.md` from `Cron` / `cron` / `audit` keys (the `Audit` key already pointed at it).
