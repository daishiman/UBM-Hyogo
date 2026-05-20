# issue-768-login-loading-and-error-focus

> Source issue: [#768](https://github.com/daishiman/UBM-Hyogo/issues/768)（CLOSED のまま仕様書化）
> Parent spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i05-login-loading-and-error-focus/spec.md`
> 実装区分: **実装仕様書**
> 状態: spec_ready_implementation_pending

## 概要

`/login` route の loading boundary 新規作成、error boundary に focus 管理・`aria-live="assertive"`・digest 表示・Card layout を追加する a11y タスク。parallel-07 DoD line 141, 142 を消し込む。

## Phase 一覧

| Phase | File | 内容 |
|---|---|---|
| 1 | [phase-1-requirements.md](phase-1-requirements.md) | 要件定義 |
| 2 | [phase-2-design.md](phase-2-design.md) | 設計 |
| 3 | [phase-3-design-review.md](phase-3-design-review.md) | 設計レビュー |
| 4 | [phase-4-test-plan.md](phase-4-test-plan.md) | テスト計画 |
| 5 | [phase-5-implementation.md](phase-5-implementation.md) | 実装手順 |
| 6 | [phase-6-test-additions.md](phase-6-test-additions.md) | テスト追加 |
| 7 | [phase-7-coverage.md](phase-7-coverage.md) | カバレッジ |
| 8 | [phase-8-refactor.md](phase-8-refactor.md) | リファクタ（本タスクではなし） |
| 9 | [phase-9-qa.md](phase-9-qa.md) | QA |
| 10 | [phase-10-final-review.md](phase-10-final-review.md) | 最終レビュー |
| 11 | [phase-11-manual-test.md](phase-11-manual-test.md) | 手動テスト |
| 12 | [phase-12-documentation.md](phase-12-documentation.md) | ドキュメント（概念説明含む） |
| 13 | [phase-13-pr.md](phase-13-pr.md) | PR 作成 |

## 変更対象ファイル

- `apps/web/app/login/loading.tsx`（新規）
- `apps/web/app/login/error.tsx`（修正）
- `apps/web/app/login/loading.spec.tsx`（新規）
- `apps/web/app/login/error.spec.tsx`（新規）
- `apps/web/src/styles/globals.css`（`bg-surface-2` utility 未定義時のみ）

## スコープ外（CONST_007 例外）

- root `apps/web/app/error.tsx` → i06 で別 issue
- `apps/web/app/profile/loading.tsx` → i07 で別 issue
- `useAutoFocusOnMount` hook 抽出 → i05/i06 完了後の refactor PR
