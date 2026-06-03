# workflow-admin-member-detail-status-404-fix artifact inventory

## Metadata

| Item | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/` |
| status | `implemented_local_evidence_captured / implementation / NON_VISUAL` |
| task type | apps/api bugfix / data integrity / admin-managed data |
| visual evidence | NON_VISUAL (`apps/web` diff 0) |

## Implementation Targets

| Path | Role |
| --- | --- |
| `apps/api/src/repository/status.ts` | Adds `ensureMemberStatusRow` and `defaultMemberStatusRow` as the single status-row default/ensure source |
| `apps/api/src/repository/_shared/builder.ts` | Keeps admin detail 200 for missing `member_status` or missing current response; 404 remains identity-missing only |
| `apps/api/src/routes/admin/member-status.ts` | Changes PATCH 404 boundary to `member_identities` existence and ensures status row before mutation |
| `apps/api/src/jobs/sync-forms-responses.ts` | Creates default `member_status` row when a new identity is created |
| `apps/api/migrations/0024_backfill_member_status.sql` | Backfills orphan identities with default status rows via idempotent `INSERT OR IGNORE` |
| `vitest.d1.config.ts` | Includes migration D1 specs |

## Workflow Artifacts

| Path | Role |
| --- | --- |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/index.md` | workflow root summary / AC / dependency boundary |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/artifacts.json` | root machine-readable ledger |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/outputs/artifacts.json` | output mirror ledger |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/outputs/phase-11/manual-test-result.md` | local focused evidence |
| `docs/30-workflows/completed-tasks/admin-member-detail-status-404-fix/outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 strict compliance check |

## Evidence

| Command | Result |
| --- | --- |
| `mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts apps/api/src/repository/__tests__/status.repository.spec.ts apps/api/src/repository/__tests__/builder.repository.spec.ts apps/api/src/routes/admin/member-status.contract.spec.ts apps/api/src/jobs/sync-forms-responses.contract.spec.ts apps/api/migrations/__tests__/0024_backfill_member_status.spec.ts` | PASS (5 files / 67 tests) |
| `mise exec -- pnpm typecheck` | PASS |
| `mise exec -- pnpm lint` | PASS |
| `git diff --name-only \| rg '^apps/web/'` | PASS (0 matches) |

## User-Gated

Remote D1 migration apply, staging deploy, authenticated admin smoke, commit, push, and PR creation remain user-gated.

## Lessons Learned

| ID | 要約 |
| --- | --- |
| L-ADMDET-001 | orphan child-row 由来の 404 は「耐性化（builder degraded view）・予防（ingest 後 ensure）・backfill（idempotent migration）」3 層で根絶する |
| L-ADMDET-002 | degraded view の既定値は DB DEFAULT と 1:1 一致させ `defaultMemberStatusRow()` 純関数で builder / ensure / spec が共有する |
| L-ADMDET-003 | NON_VISUAL かつ apps/web diff 0 の bugfix は screenshots ディレクトリ / .gitkeep を作らず D1 focused test PASS を主証跡にする |
| L-ADMDET-004 | implemented_local close-out の Step 1-A〜1-C は N/A にせず明示記録し、Step 2 は内部 helper・API surface 不変の N/A 根拠を添える |
| L-ADMDET-005 | ensure / backfill は INSERT OR IGNORE で冪等性を担保し migration の 2 回適用テストで固定する |

正本: `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-member-detail-status-404-fix-2026-06.md`
