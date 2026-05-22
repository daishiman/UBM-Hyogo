# Workflow Artifact Inventory: parallel-i03-dialog-refresh-order

## Workflow Root

`docs/30-workflows/{,completed-tasks/}parallel-i03-dialog-refresh-order/`

> Phase 12 通過後は `completed-tasks/` 配下へ自動移送される（task-specification-creator の completed-tasks move policy）。external reference は両 path 探索すること。

## State

`implemented_local_evidence_captured / implementation / NON_VISUAL / implementation_complete_pending_pr`

## Implementation Files

- `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`
- `apps/web/app/profile/_components/DeleteRequestDialog.tsx`
- `apps/web/app/profile/_components/RequestActionPanel.tsx`
- `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx`
- `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx`
- `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx`

## Evidence

- `docs/30-workflows/parallel-i03-dialog-refresh-order/outputs/phase-11/visual-verification-skip.md`
- `docs/30-workflows/parallel-i03-dialog-refresh-order/outputs/phase-11/evidence/test-output.md`
- `docs/30-workflows/parallel-i03-dialog-refresh-order/outputs/phase-12/phase12-task-spec-compliance-check.md`

## Lessons Learned

- `.claude/skills/aiworkflow-requirements/references/lessons-learned-parallel-i03-dialog-refresh-order-2026-05.md`
  - L-PARALLEL-I03-001: dialog 内で `router.refresh()` を最先発火する順序契約
  - L-PARALLEL-I03-002: 409 duplicate pending 分岐の refresh 漏れは review gate でしか検知できない
  - L-PARALLEL-I03-003: `vi.hoisted` + `vi.mock("next/navigation")` で callOrder を spec 間共有
  - L-PARALLEL-I03-004: 親 spec で子 dialog を inline mock 化して navigation mock 衝突を回避
  - L-PARALLEL-I03-005: ワークフロー dir の `completed-tasks/` 自動移送と canonical path drift

## User Gates

Commit, push, and PR creation are pending explicit user approval.
