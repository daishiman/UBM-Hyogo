---
name: workflow-issue-988-identity-conflicts-merge-optimistic-update-artifact-inventory
workflow_id: issue-988-identity-conflicts-merge-optimistic-update
created_at: 2026-05-30
status: implemented_local_evidence_captured
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Artifact Inventory: issue-988-identity-conflicts-merge-optimistic-update

## Canonical Workflow

| artifact | path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/artifacts.json` |
| Phase 12 compliance | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-12/phase12-task-spec-compliance-check.md` |

## Implementation Artifacts

| artifact | path | status |
| --- | --- | --- |
| row optimistic update | `apps/web/src/components/admin/IdentityConflictRow.tsx` | updated |
| focused component tests | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | updated |
| Playwright mutation spec | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | updated |
| API contract | `apps/api/src/routes/admin/identity-conflicts.ts` | unchanged |
| D1 schema | `apps/api/migrations/` | unchanged |

## Evidence

| evidence | status |
| --- | --- |
| focused Vitest | PASS: `pnpm exec vitest run apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` (1 file / 10 tests) |
| focused Playwright | PASS: `PLAYWRIGHT_SKIP_WEB_SERVER=1 ... playwright test playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium --reporter=list` (8 tests) |
| Phase 11 canonical paths | present |
| screenshots | captured: `outputs/phase-11/screenshots/identity-conflict-row-merge-final.png`, `identity-conflict-row-optimistic-removed.png`, `identity-conflict-row-rollback-error.png` |

## User-Gated Boundary

| item | boundary |
| --- | --- |
| commit / push / PR | user-gated |
| Issue #988 close | user-gated after PR/merge decision |

## Lessons Learned

詳細は [[lessons-learned-issue-988-optimistic-merged-2026-05]] を参照。

| lesson | 要点 |
| --- | --- |
| L-I988-001 | optimistic 可視性は dialog `stage` union と別の独立 boolean (`optimisticMerged`) に分離。`if (optimisticMerged) return null` の 1 行 guard、rollback は `setOptimisticMerged(false)` のみ |
| L-I988-002 | rollback inline alert は API body の文言を出す。`FetchAuthedError.bodyText` を JSON.parse し `message ?? error ?? error.message` 抽出する pure helper（初回 Playwright で文言 drift 検出 → 同サイクル修正） |
| L-I988-003 | reject 時のみ rollback（modal 非閉鎖・reason 保持）、success path は row を `return null` のまま維持し再表示しない（flicker 回避） |
| L-I988-004 | focused test 3 ケース分離: server 応答前 hide / success 後も hide 維持 / 409 rollback で再表示。既存「success 後ボタン再表示」assertion を「row 消失維持」へ更新 |
| L-I988-005 | Playwright `getByText('m_src_01', { exact: true })` で conflict id (`m_src_01__m_dst_01`) の substring 一致を防止 |
| L-I988-006 | VISUAL_ON_EXECUTION screenshot は env-gated (`PLAYWRIGHT_ISSUE988_SCREENSHOT_DIR`) capture にして通常/CI run へ副作用なし。canonical 名は Phase 1 で固定 |
