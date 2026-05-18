# issue-746 parallel-09 Playwright visual evidence completion — canonical workflow root

[実装区分: 実装仕様書]

## 判定根拠

ユーザー指示は「issue は CLOSED のまま」だが、本タスクの目的達成には **以下のコード変更が必須** のため実装仕様書として作成する（CONST_004 ラベルより実態優先）:

1. `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts` の `evidenceDir` パス修正（現状 `docs/30-workflows/parallel-09-ux-cross-cutting/...` を指すが workflow は `completed-tasks/` 配下に移動済みで broken）
2. Playwright spec 実行による **12 PNG 物理生成**
3. evidence state 文字列を含む `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md` の `runtime_pending → completed` 更新（ドキュメント変更だが evidence 生成と一体不可分）

## 背景（Why this workflow）

- Issue #746 は `unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md` を指して 2026-05-16 に closed されたが、deliverables 未完了。
- 親 workflow (`parallel-09-ux-cross-cutting`) は既に `completed-tasks/` へ移動済みのため、closed issue canonical workflow root recovery パターン（`refs_only`）で本ディレクトリを後付け生成する。
- 後続 visual regression（task-18 / task-22）が parallel-09 primitives baseline に依存するため、本タスク完了が前提条件。

## 不変条件

1. Issue は **re-open しない**。コミット文言は `Refs #746` のみ（`Closes #746` 禁止）。
2. Playwright spec / config / harness の **設計変更は禁止**（既存実装を流用）。`evidenceDir` パス修正のみ許可。
3. PNG 配置先は `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/`（親 workflow の正本 evidence path）。本 workflow root の `outputs/phase-11/screenshots/` には参照 README のみ置く。
4. PNG 個別サイズ ≤ 500KB 目安。CLAUDE.md 不変条件3「プロトタイプ正本順位」を満たすこと。
5. コミット・push・PR はユーザー指示があるまで実行禁止。

## 親仕様 / 参照

- `docs/30-workflows/unassigned-task/parallel-09-followup-001-playwright-visual-evidence-completion.md`
- `docs/30-workflows/completed-tasks/parallel-09-ux-cross-cutting/outputs/phase-11/main.md`
- `apps/web/playwright.parallel09.config.ts`
- `apps/web/playwright/tests/visual/parallel-09-primitives.spec.ts`
- `apps/web/app/visual-harness/[name]/`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`

## Phase 構成

| Phase | ファイル | 内容 |
|-------|---------|------|
| 1 | phase-1-requirements.md | 要件・受入条件 |
| 2 | phase-2-design.md | spec パス修正と PNG 取得フローの設計 |
| 3 | phase-3-architecture.md | 影響範囲・依存・配置ポリシー |
| 4 | phase-4-implementation-plan.md | 実装手順（spec パッチ + harness 起動 + PNG 取得） |
| 5 | phase-5-test-plan.md | spec 実行と再現性確認 |
| 6 | phase-6-quality-gates.md | typecheck / lint / PNG サイズ / 視覚的整合 |
| 7 | phase-7-evidence-collection.md | 12 PNG + log の evidence 整理 |
| 8 | phase-8-state-transition.md | runtime_pending → completed 更新 |
| 9 | phase-9-rollback.md | 失敗時の cleanup 手順 |
| 10 | phase-10-operational-runbook.md | ENOSPC 再発時 runbook |
| 11 | phase-11-visual-evidence.md | snapshot 配置・README |
| 12 | phase-12-open-runtime-boundary.md | unassigned-task consumed 化と概念説明 |
| 13 | phase-13-pr.md | PR 本文テンプレート（`Refs #746`） |
