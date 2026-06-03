# Workflow Artifact Inventory: issue-1042-dismiss-confirm-optimistic-update

## Metadata

| Field | Value |
| --- | --- |
| workflow_id | `issue-1042-dismiss-confirm-optimistic-update` |
| status | `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION` |
| date | 2026-06-01 |
| issue | #1042 OPEN（state mutation user-gated） |

## Workflow Artifacts

| Artifact | Path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/` |
| index | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/index.md` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/artifacts.json` |
| Phase 11 | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/phase-11.md` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Targets

| Path | Change |
| --- | --- |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | component-local `optimisticDismissed` state, dismiss trigger-before-hide, catch rollback, render guard OR |
| `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | dismiss optimistic hide / success-stays-hidden / rollback + reason retention tests |
| `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | dismiss optimistic and rollback focused cases + env-gated screenshot capture |

## Evidence

| Evidence | Path | Result |
| --- | --- | --- |
| focused Vitest | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/evidence/focused-vitest.log` | PASS（1 file / 14 tests） |
| Playwright focused | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/evidence/playwright-dismiss.log` | PASS（desktop-chromium / 2 tests） |
| screenshot | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/screenshots/identity-conflict-row-dismiss-optimistic-removed.png` | present |
| screenshot | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/screenshots/identity-conflict-row-dismiss-rollback-error.png` | present |
| canonical paths | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/canonical-paths.json` | present |
| capture metadata | `docs/30-workflows/completed-tasks/issue-1042-dismiss-confirm-optimistic-update/outputs/phase-11/phase11-capture-metadata.json` | present |

## Boundaries

- API endpoint, D1 schema, Server Component page, `useAdminMutation` hook, and merge behavior are unchanged.
- Commit, push, PR creation, and Issue #1042 close/state mutation are user-gated.
- #988 merge optimistic L-OPTMUT pattern (L-I988-001..006) is inherited as the dismiss mirror base; #1042-specific knowledge is recorded in a dedicated lesson file (see below).

## Lessons Learned

詳細は [[lessons-learned-issue-1042-dismiss-optimistic-2026-06]] を参照。#988（[[lessons-learned-issue-988-optimistic-merged-2026-05]]）の L-I988-001..006 を継承し、#1042 固有知見のみ以下に記録する。

| lesson | 要点 |
| --- | --- |
| L-I1042-001 | 同一 component の merge `optimisticMerged` と dismiss `optimisticDismissed` を統合せず独立保持し、render guard だけ `if (optimisticMerged \|\| optimisticDismissed) return null;` で OR 合流（dual-mirror・rollback 取り違え回避 = AC-1） |
| L-I1042-002 | rollback は可視性 boolean のみ巻き戻し、`dismissReason` は catch で clear せず success path でのみ clear する非対称 reset（AC-3 reason retention） |
| L-I1042-003 | focused test に #988 の 3 ケース + (4) rollback 後の再実行で 2 回目 trigger / (5) dismiss rollback 後の merge 経路非干渉（cross-mirror）を追加 |
| L-I1042-004 | 同一 component の VISUAL screenshot を操作経路で名前空間分離（`-dismiss-` prefix・`PLAYWRIGHT_ISSUE1042_SCREENSHOT_DIR`）し #988 merge screenshot と衝突回避 |
