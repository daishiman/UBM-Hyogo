# Workflow Artifact Inventory: issue-1042-identity-conflicts-dismiss-optimistic-update

| item | path |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/` |
| root artifacts | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/artifacts.json` |
| output artifacts | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/artifacts.json` |
| Phase 11 evidence | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-11/phase-11.md` |
| Phase 11 canonical paths | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-11/canonical-paths.json` |
| Phase 11 screenshots | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-11/screenshots/{identity-conflict-row-dismiss-confirm,identity-conflict-row-dismiss-optimistic-removed,identity-conflict-row-dismiss-rollback-error}.png` |
| Phase 12 strict outputs | `docs/30-workflows/completed-tasks/issue-1042-identity-conflicts-dismiss-optimistic-update/outputs/phase-12/{main,implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report,phase12-task-spec-compliance-check}.md` |

## Implementation Summary

- Status: `implemented_local_evidence_captured / implementation / VISUAL_ON_EXECUTION`.
- Issue: #1042 CLOSED; PR context must use `Refs #1042` only.
- Parent: `issue-988-identity-conflicts-merge-optimistic-update`.
- Implementation targets:
  - `apps/web/src/components/admin/IdentityConflictRow.tsx`
  - `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx`
  - `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`
- Invariant: API endpoint, D1 schema, Server Component page, merge behavior, and `useAdminMutation` signature are unchanged.
- Evidence:
  - focused Vitest target `IdentityConflictRow.spec.tsx` 15 tests PASS.
  - Playwright desktop focused 2 tests PASS.
  - Phase 11 screenshots 3 PNG captured.
- User-gated: commit, push, PR.

## Lessons Learned

本ワークフローの知見は `lessons-learned/lessons-learned-issue-1042-identity-conflicts-dismiss-optimistic-update-2026-06.md`（L-I1042-001..005）に体系化した。要点:

| ID | classification | 要点 |
| --- | --- | --- |
| L-I1042-001 | design/sibling-task-symmetric-reuse | 親 #988（merge optimistic）の確定コードを `onMerge`→`onDismiss` / `optimisticMerged`→`optimisticDismissed` の 1:1 写像で対称適用し設計コストを最小化。 |
| L-I1042-002 | design/optimistic-state-separation | `optimisticMerged` / `optimisticDismissed` を独立 boolean として持ち、`stage` union にも混ぜず、合流は render guard 1 箇所に限定して cross-operation rollback race を構造排除。 |
| L-I1042-003 | design/rollback-input-preservation | clear タイミングを非対称化（success=`dismissReason` clear / error rollback=保持）し、失敗時の理由再入力を不要にする。 |
| L-I1042-004 | accessibility/optimistic-live-region-focus-handoff | optimistic 非表示は `return null` でなく、両 flag から導出した `optimisticStatus` の sr-only `role="status"` + `focus()` 移譲で merge/dismiss を合流（implementation-guide 簡略コードとの差分は a11y 強化の意図的昇格）。 |
| L-I1042-005 | workflow/visual-on-execution-screenshot-captured | screenshot canonical 名を Phase 1 で早期固定し複数 artifact で同名参照、実装同一サイクルで present→captured へ昇格（FB-VISUAL-CAP-001）。 |

## 関連リンク

| リンク先 | 用途 |
| --- | --- |
| `lessons-learned/lessons-learned-issue-1042-identity-conflicts-dismiss-optimistic-update-2026-06.md` | 本ワークフローの教訓（L-I1042-001..005）正本 |
| `references/task-workflow-active.md` → `### issue-1042-identity-conflicts-dismiss-optimistic-update` | ワークフロー実装状態の正本 |
| `indexes/resource-map.md` | skill 全体 resource 索引（本 inventory への参照行） |
| `indexes/quick-reference.md` | 実装 quick reference |
| `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/` | 親 workflow（merge 側 optimistic / 対称写像の正本元） |
