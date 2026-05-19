# Issue #766 Profile Dialog router.refresh() 呼び出し順序修正 — Workflow Index

## メタ情報

```yaml
workflow_id: issue-766-dialog-refresh-order
title: profile dialog router.refresh() 呼び出し順序修正
github_issue: 766
issue_state: closed
issue_close_reason: |
  Issue は close 済みだが、コードベース調査の結果、spec が要求する順序
  (router.refresh() → onSubmitted → onClose) は **未実装**。
  RequestActionPanel.tsx:57 の onSubmitted callback で router.refresh() を
  呼んでおり、dialog 側は onSubmitted → onClose の順で、parent から refresh
  を発火しているため spec 通りの順序ではない。本 workflow で根本対応する。
source_spec: docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md
parent_task_spec: docs/30-workflows/unassigned-task/integration-fixes-i03-dialog-refresh-order.md
category: frontend / ux-bugfix
target_feature: apps/web profile マイページ — 公開停止 / 再公開 / 退会 dialog
priority: 中
scale: 小規模 (3 files modify + 2 test files modify)
status: spec_ready_implementation_pending
workflow_state: spec_ready_implementation_pending
taskType: implementation
visualEvidence: VISUAL
implementationCategory: ui-bugfix
implementation_kind: 実装仕様書
implementation_kind_rationale: |
  CONST_004 適用: 対象タスクは「dialog component の副作用呼び出し順序を spec
  通りに固定する」という明確なコード変更である。実装ファイルパス・関数シグネチャ
  ・呼び出し順序・テスト assertion がすべて確定しており、ドキュメントのみで
  完結する余地はない。issue 本文も「stale UI が一瞬見える UX バグ」と
  明示しており、振る舞いを変える必要がある。
read_only_evidence_allowed_pre_gate:
  - "rg -n 'router.refresh|onSubmitted|onClose' apps/web/app/profile/_components"
  - "mise exec -- pnpm typecheck"
  - "mise exec -- pnpm lint"
mutation_commands:
  - "git add apps/web/app/profile/_components/{VisibilityRequestDialog,DeleteRequestDialog,RequestActionPanel}.tsx"
  - "git add apps/web/app/profile/_components/*.component.spec.tsx"
  - "git commit / git push / gh pr create --base dev (Phase 13)"
target_files:
  - apps/web/app/profile/_components/VisibilityRequestDialog.tsx (modify)
  - apps/web/app/profile/_components/DeleteRequestDialog.tsx (modify)
  - apps/web/app/profile/_components/RequestActionPanel.tsx (modify)
  - apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx (modify)
  - apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx (modify)
  - apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx (modify)
```

## Phase 一覧

| Phase | 役割 | ファイル |
|-------|------|---------|
| 1 | 要件定義 | phase-1-requirements.md |
| 2 | 設計 | phase-2-design.md |
| 3 | 設計レビュー | phase-3-design-review.md |
| 4 | テスト計画 | phase-4-test-plan.md |
| 5 | 実装 | phase-5-implementation.md |
| 6 | テスト追加 | phase-6-test-additions.md |
| 7 | カバレッジ | phase-7-coverage.md |
| 8 | リファクタ | phase-8-refactor.md |
| 9 | QA | phase-9-qa.md |
| 10 | 最終レビュー | phase-10-final-review.md |
| 11 | 手動テスト | phase-11-manual-test.md |
| 12 | ドキュメント | phase-12-documentation.md |
| 13 | PR 作成 | phase-13-pr.md |

## 現状調査サマリ (2026-05-17)

`apps/web/app/profile/_components/RequestActionPanel.tsx:57-60`:

```ts
const onSubmitted = () => {
  router.refresh();   // ← parent 側で発火（spec 違反）
};
```

`VisibilityRequestDialog.tsx:77-80` / `DeleteRequestDialog.tsx:68-70`:

```ts
if (res.ok) {
  onSubmitted(res.accepted);   // ← parent の refresh が起動
  onClose();                   // ← 直後に unmount → race condition
}
```

spec が要求する順序 (`router.refresh() → onSubmitted → onClose`) は **dialog 内で完結する形に未到達**。本 workflow で対応する。
