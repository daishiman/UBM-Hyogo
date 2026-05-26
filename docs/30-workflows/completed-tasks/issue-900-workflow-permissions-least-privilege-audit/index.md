---
task_id: issue-900-workflow-permissions-least-privilege-audit
spec_classification: implementation_spec
status: implemented_local_evidence_captured
issue: https://github.com/daishiman/UBM-Hyogo/issues/900
issue_state: closed
base_branch: dev
work_branch: feat/issue-900-workflow-permissions-audit
created_date: 2026-05-25
---

# Issue #900: 全 workflow の top-level permissions 最小権限監査

[実装区分: 実装仕様書]

判断根拠: GitHub Actions の `.github/workflows/*.yml` 12 件に top-level `permissions:` ブロックを追加するコード変更を伴う。docs-only 例外条件には該当しない。

## issue 現状調査結果（2026-05-25）

- issue #900 は CLOSED だが、コード側は未解決だったため、本サイクルで実装まで完了した。
- top-level `permissions:` が**未宣言**だった対象 12 workflow は、2026-05-25 時点の本ワークツリーで全件解消済み:
  - `backend-ci.yml` / `d1-migration-verify.yml` / `e2e-tests.yml` / `lighthouse.yml` / `playwright-smoke.yml` / `playwright-visual-baseline-update.yml` / `playwright-visual-full.yml` / `validate-build.yml` / `verify-design-tokens.yml` / `verify-esbuild.yml` / `verify-primitive-adoption.yml` / `web-cd.yml`
- 検証コマンド: `bash scripts/verify-workflow-top-level-permissions.sh`
- 検証結果: `All workflows declare top-level permissions`
- 別タスクでの解決履歴なし。issue が古いわけではなく、根本問題は現行コードでも未対処。
- 仕様書は **CLOSED 維持のまま** 作成する（ユーザー指示）。

## Phase 一覧

| Phase | ファイル | 目的 |
|-------|---------|------|
| 1 | phase-1-requirements.md | 要件定義 |
| 2 | phase-2-design.md | 設計 |
| 3 | phase-3-design-review.md | 設計レビュー |
| 4 | phase-4-test-plan.md | テスト計画 |
| 5 | phase-5-implementation.md | 実装手順 |
| 6 | phase-6-test-additions.md | テスト追加 |
| 7 | phase-7-coverage.md | カバレッジ |
| 8 | phase-8-refactor.md | リファクタ |
| 9 | phase-9-qa.md | QA |
| 10 | phase-10-final-review.md | 最終レビュー |
| 11 | phase-11-manual-test.md | 手動テスト |
| 12 | phase-12-documentation.md | ドキュメント同期 |
| 13 | phase-13-pr.md | commit/PR |
