# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 7 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 6 (異常系検証) |
| 下流 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜AC-10 を test と evidence にマップし、Phase 10 の GO/NO-GO 根拠とする。

## 実行タスク

1. AC ↔ test ID 対応表
2. evidence path 確定
3. 閾値再確認
4. outputs/phase-07/ac-matrix.md 生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/test-strategy.md | test 一覧 |
| 必須 | outputs/phase-06/failure-modes.md | 異常系 |

## 統合テスト連携

| Phase | 内容 |
| --- | --- |
| 10 | GO/NO-GO |
| 11 | smoke evidence |

## 多角的チェック観点（不変条件参照）

- 全 AC が不変条件と紐付くこと

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | 対応表 | 7 | pending |
| 2 | evidence | 7 | pending |
| 3 | 閾値 | 7 | pending |
| 4 | outputs | 7 | pending |

## 成果物

| 種別 | パス |
| --- | --- |
| ドキュメント | outputs/phase-07/main.md |
| ドキュメント | outputs/phase-07/ac-matrix.md |
| メタ | artifacts.json |

## 完了条件

- [ ] 10 AC × test × evidence 全件埋まる

## タスク 100% 実行確認【必須】

- [ ] 全 4 サブタスク completed
- [ ] outputs/phase-07/ 2 ファイル
- [ ] AC カバレッジ 10/10

## 次 Phase

- 次: Phase 8
- 引き継ぎ事項: matrix
- ブロック条件: 未充足 AC

## AC マトリクス

| AC | 内容 | test ID | evidence | 不変条件 |
| --- | --- | --- | --- | --- |
| AC-1 | 4 層型カバー | tsc-noEmit | typecheck.log | #1 |
| AC-2 | branded 7 種 | type-test-branded-7 | branded-test.log | #7 |
| AC-3 | zod 31 項目 | zod-31fields | zod-test.log | #1 |
| AC-4 | viewmodel 10 種 | type-test-viewmodel-fields | vm-test.log | #1 |
| AC-5 | consent 統一 | zod-consent-normalize | consent-test.log | #2 |
| AC-6 | responseEmail system | type-test-responseEmail-system | system-field.log | #3 |
| AC-7 | distinct branded | type-test-distinct-branded | distinct.log | #7 |
| AC-8 | Forms auth chain | forms-auth + forms-get + forms-list | forms-test.log | - |
| AC-9 | Forms backoff | forms-backoff-429 + forms-backoff-5xx | backoff-test.log | - |
| AC-10 | apps/web boundary | eslint-boundary-3 | eslint-test.log | #5 |

## 閾値

| AC | 閾値 |
| --- | --- |
| AC-1 | 0 typecheck error |
| AC-2 | 7/7 export 確認 |
| AC-3 | 31/31 fixture PASS |
| AC-4 | 10/10 viewmodel test PASS |
| AC-5 | 0 件の旧キー残存 |
| AC-6 | schema 内に responseEmail 0 件 |
| AC-7 | 1/1 distinct test PASS |
| AC-8 | 3/3 test PASS |
| AC-9 | 2/2 test PASS |
| AC-10 | 3/3 ESLint test PASS, 0 violation |
