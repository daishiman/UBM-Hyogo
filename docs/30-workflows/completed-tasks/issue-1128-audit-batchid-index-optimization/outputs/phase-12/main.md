# Phase 12 Main — issue-1128 audit_log batchId index 最適化

## Summary

Issue #1128 の local implementation は `implemented_local_evidence_captured / implementation / NON_VISUAL` として完了した。
`apps/api/migrations/0026_audit_log_batchid_index.sql` で `audit_log.batch_id` VIRTUAL generated column と
`idx_audit_log_batch_id` を追加し、`apps/api/src/repository/auditLog.ts` の batchId filter を `batch_id = ?` に切り替えた。

## Evidence

| Evidence | Result |
| --- | --- |
| focused D1 Vitest | PASS: 3 files / 28 tests |
| migration shape | `PRAGMA table_xinfo(audit_log)` に generated `batch_id` present |
| index plan | `EXPLAIN QUERY PLAN` が `idx_audit_log_batch_id` を使用し `SCAN audit_log` なし |
| API surface | `GET /admin/audit?batchId=` query / response shape 不変 |

## User-Gated Remain

staging / production D1 migration apply、deploy、commit、push、PR 作成は未実行であり Phase 13 の user approval gate に残す。
