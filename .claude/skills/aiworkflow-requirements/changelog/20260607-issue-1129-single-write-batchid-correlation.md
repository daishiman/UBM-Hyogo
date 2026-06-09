# 2026-06-07 issue-1129 single write batchId correlation

## Summary

Issue #1129 was implemented locally as `implemented_local_evidence_captured / implementation / NON_VISUAL`.
Single admin manual tag assign/unassign audit payloads now carry the same `batchId` correlation key used by bulk tag writes.

## Synced Surfaces

| Surface | Change |
| --- | --- |
| `references/api-endpoints.md` | Single `POST /admin/members/:memberId/tags` and `DELETE /admin/members/:memberId/tags/:tagId` now document request-scoped `batchId` audit payloads. |
| `references/task-workflow-active.md` | Added issue-1129 active workflow row. |
| `references/workflow-issue-1129-single-write-batchid-correlation-artifact-inventory.md` | Added implementation, test, evidence, and invariant inventory. |
| `indexes/quick-reference.md` / `indexes/resource-map.md` | Added quick lookup entries. |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS: 2 files / 31 tests. |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS. |

## User-Gated

Commit, push, PR, and Issue mutation remain user-gated.
