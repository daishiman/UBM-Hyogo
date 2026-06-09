# Workflow Artifact Inventory — issue-1129-single-write-batchid-correlation

`issue-1129-single-write-batchid-correlation` is an `implemented_local_evidence_captured / implementation / NON_VISUAL` workflow.
It extends the existing tag audit `batchId` contract from bulk writes to single admin manual tag assign/unassign without adding endpoints, D1 schema, migrations, or Web UI changes.

## Workflow

| Item | Value |
| --- | --- |
| Workflow root | `docs/30-workflows/completed-tasks/issue-1129-single-write-batchid-correlation/` |
| Issue | `#1129` (CLOSED; PR wording uses `Refs #1129`) |
| Parent | `issue-1079-bulk-tag-audit-batch-filter` / `issue-1036-bulk-member-tag-assign` |
| State | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| User-gated | commit, push, PR, Issue mutation |

## Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/src/routes/admin/members.ts` | Adds request-scoped `crypto.randomUUID()` `batchId` to single assign `after_json` and single unassign `before_json` audit payloads. |
| `apps/api/src/routes/admin/members.tags.contract.spec.ts` | Verifies single assign/unassign payload UUIDs and noop audit non-regression. |
| `apps/api/src/routes/admin/audit.contract.spec.ts` | Verifies `GET /admin/audit?batchId=` finds single write audit rows through existing after/before JSON OR search. |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/admin/members.tags.contract.spec.ts apps/api/src/routes/admin/audit.contract.spec.ts` | PASS: 2 files / 31 tests. |
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | PASS. |

## Contract Notes

- Single write `batchId` is request-scoped correlation with group size 1.
- Single assign writes `{ tagId, source: "manual", batchId }` to `after_json`; single unassign writes `{ tagId, batchId }` to `before_json`.
- Existing `GET /admin/audit?batchId=` search remains unchanged and covers bulk and single writes via the same `$.batchId` path.
- No `audit_log.correlation_id`, generated column, JSON index, migration, endpoint, response shape, or `apps/web` change is introduced.
- Noop assign/unassign paths do not append audit rows and therefore do not create batch IDs.
