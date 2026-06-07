# Workflow Artifact Inventory — issue-1079-bulk-tag-audit-batch-filter

`issue-1079-bulk-tag-audit-batch-filter` is an `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` workflow.
It adds bulk tag `batchId` lookup and display support to the existing read-only `/admin/audit` surface without adding a new endpoint or changing D1 schema.

## Workflow

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-1079-bulk-tag-audit-batch-filter/` |
| Issue | `#1079` (CLOSED; PR wording uses `Refs #1079`) |
| Parent | `issue-1036-bulk-member-tag-assign` |
| State | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| User-gated | authenticated runtime screenshots, staging deploy, commit, push, PR, Issue mutation |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/src/routes/admin/audit.ts` | Adds `batchId` query validation, repository filter plumbing, and `appliedFilters.batchId`. |
| `apps/api/src/repository/auditLog.ts` | Searches `after_json.$.batchId` and `before_json.$.batchId` with one shared binding. |
| `apps/web/app/(admin)/admin/audit/page.tsx` | Passes `batchId` searchParams through to API path and restores form values. |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | Adds batchId filter field, pagination preservation, `extractBatchId`, and row display. |
| `apps/web/src/components/admin/BatchIdCopyButton.tsx` | Client-only clipboard copy button for batchId. |
| `apps/web/src/lib/admin/types.ts` | Adds `AdminAuditFilters.batchId`. |

## Test Artifacts

| Path | Coverage |
| --- | --- |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | batchId filter, action + batchId AND, cursor preservation, unmatched/empty cases. |
| `apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | after/before JSON search, AND composition, cursor with batchId. |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx` | filter form, `buildAuditHref`, `extractBatchId`, row rendering. |
| `apps/web/src/components/admin/__tests__/BatchIdCopyButton.component.spec.tsx` | clipboard success, copied feedback reset, failure fallback. |
| `apps/web/app/(admin)/admin/audit/page.page.spec.ts` | server page searchParams -> API query plumbing. |

## Evidence

| Command | Result |
| --- | --- |
| `pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/audit.contract.spec.ts apps/api/src/repository/__tests__/auditLog.repository.spec.ts` | PASS: 2 files / 26 tests. |
| `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/admin/__tests__/BatchIdCopyButton.component.spec.tsx apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx apps/web/app/(admin)/admin/audit/page.page.spec.ts` | PASS: 3 files / 54 tests. |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` / `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | PASS / PASS. |
| `mise exec -- pnpm --filter @ubm-hyogo/api test --run ...` | Non-authoritative wrapper attempt expanded to 79 API files and failed on unrelated hook timeouts (`auditLog-export.spec.ts`, `import-attendance-bulk.spec.ts`). |

## Contract Notes

- `batchId` belongs to tag write audit correlation. Issue #1079 introduced the read-side filter for bulk tag operations created by issue #1036; issue #1129 extends the same payload key/path to single admin manual tag assign/unassign.
- Assign audit rows store `batchId` in `after_json`; unassign rows store it in `before_json` for both bulk writes and single manual writes.
- No `audit_log.correlation_id`, generated column, JSON index, or migration is introduced.
- JSON path lookup is guarded with `json_valid(...)` so malformed legacy audit payloads do not make batchId filtering fail.
- Full-scan risk is bounded by existing keyset cursor + LIMIT and operational guidance to combine `batchId` with `from` / `to` / `action`.
