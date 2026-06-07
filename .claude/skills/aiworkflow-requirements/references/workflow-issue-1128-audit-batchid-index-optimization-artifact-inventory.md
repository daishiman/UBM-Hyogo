# Workflow Artifact Inventory — issue-1128-audit-batchid-index-optimization

`issue-1128-audit-batchid-index-optimization` is an `implemented_local_evidence_captured / implementation / NON_VISUAL` workflow.
It optimizes existing `/admin/audit?batchId=` lookup by adding an indexable generated column to `audit_log`.

## Workflow

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-1128-audit-batchid-index-optimization/` |
| Issue | `#1128` (CLOSED; PR wording uses `Refs #1128`) |
| Parent | `issue-1079-bulk-tag-audit-batch-filter` |
| State | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| User-gated | staging / production D1 migration apply, deploy, commit, push, PR |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/migrations/0026_audit_log_batchid_index.sql` | Adds `audit_log.batch_id` VIRTUAL generated column and `idx_audit_log_batch_id`. |
| `apps/api/src/repository/auditLog.ts` | Switches `listFiltered` batchId predicate from JSON full scan to `batch_id = ?`. |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | Adds index-plan assertion while preserving after/before batchId behavior. |
| `apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts` | Verifies generated column shape, index existence, after/before extraction, and query plan. |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/migrations/__tests__/0026_audit_log_batchid_index.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS: 3 files / 28 tests. |

## Contract Notes

- `GET /admin/audit?batchId=` query and response shape are unchanged.
- `batch_id` derives from `after_json.$.batchId` first, then `before_json.$.batchId`; malformed JSON is guarded with `json_valid`.
- The index is partial (`WHERE batch_id IS NOT NULL`) and ordered by `created_at DESC, audit_id DESC` to match existing keyset pagination.
- `audit_log` append-only repository boundary remains unchanged; no application UPDATE / DELETE API is added.
