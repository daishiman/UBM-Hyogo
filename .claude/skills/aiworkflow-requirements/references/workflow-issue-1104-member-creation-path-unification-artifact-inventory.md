# issue-1104 member creation path unification artifact inventory

| 項目 | 値 |
| --- | --- |
| workflow root | `docs/30-workflows/issue-1104-member-creation-path-unification/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| issue | #1104 CLOSED（reopen / mutation は user-gated） |
| parent | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` MINOR-FUT-1 |

## Implementation Targets

| File | Role |
| --- | --- |
| `apps/api/src/repository/members.ts` | Adds `createMemberWithStatus` as the identity + status creation helper. |
| `apps/api/src/repository/identities.ts` | Ensures `member_status` immediately after auto-link identity backfill. |
| `apps/api/src/jobs/sync-forms-responses.ts` | Replaces split `upsertMember` + `ensureMemberStatusRow` ingest writes with `createMemberWithStatus`. |
| `apps/api/src/repository/__tests__/members.repository.spec.ts` | Covers helper identity/status creation and idempotency. |
| `apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts` | Covers auto-link status row creation under D1. |
| `apps/api/src/jobs/sync-forms-responses.contract.spec.ts` | Existing ingest contract covers status row generation and writeCount boundary. |
| `apps/api/src/routes/auth/session-resolve.contract.spec.ts` | Covers route-level existing identity repair so session resolution does not bypass repository status synchronization. |

## Evidence

| Evidence | Result |
| --- | --- |
| focused D1 Vitest | `mise exec -- pnpm exec vitest run --root=. --config=vitest.d1.config.ts --maxWorkers=1 apps/api/src/repository/__tests__/members.repository.spec.ts apps/api/src/repository/__tests__/identities.autolink.repository.spec.ts apps/api/src/jobs/sync-forms-responses.contract.spec.ts apps/api/src/routes/admin/member-status.contract.spec.ts apps/api/src/routes/auth/session-resolve.contract.spec.ts` → 5 files / 51 tests PASS |
| API typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` → PASS |
| API lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` → PASS |
| scope gates | `apps/web` diff 0; new D1 migration 0; route mutation `ensureMemberStatusRow` remains as legacy backstop |

## Lessons

- Issue / unassigned-task inventory tables are historical input. Phase 1 must re-run current-code `rg` over all creation/write paths before accepting route/helper inventories.
- Hidden auto-link paths can create data rows outside ingest jobs. Creation-responsibility unification tasks must grep both direct `INSERT` and route/session entry points.
- Internal repository helper additions do not require public API schema changes when endpoint surface and response shapes are unchanged, but aiworkflow ledgers still need same-wave state sync.

## User-Gated Boundary

Commit, push, PR creation, staging deploy/authenticated smoke, and GitHub Issue mutation remain user-gated. The local implementation and deterministic evidence are complete.
