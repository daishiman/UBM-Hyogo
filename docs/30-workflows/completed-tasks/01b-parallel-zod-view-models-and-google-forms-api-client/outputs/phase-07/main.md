# Phase 7: AC マトリクス（成果物）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | zod-view-models-and-google-forms-api-client |
| Wave | 1 |
| 実行種別 | parallel |
| Phase 番号 | 7 / 13 |
| 状態 | completed |
| 上流 Phase | 6 (異常系検証) |
| 下流 Phase | 8 (DRY 化) |

## 概要

AC-1〜AC-10 を実装した test ID および evidence ログにマップし、Phase 10 の GO/NO-GO 判定の客観的根拠とする。実装結果に基づき、すべての AC が PASS していることを確認した。

## サブタスク実行結果

| # | サブタスク | 状態 | 結果 |
| --- | --- | --- | --- |
| 1 | AC ↔ test ID 対応表 | completed | `ac-matrix.md` の対応表に集約 |
| 2 | evidence path 確定 | completed | `outputs/phase-11/{typecheck,vitest,eslint-boundary}.log` に確定 |
| 3 | 閾値再確認 | completed | 全閾値 PASS（130 tests / 0 typecheck error / 0 boundary violation） |
| 4 | outputs 生成 | completed | `outputs/phase-07/main.md`, `ac-matrix.md` 配置 |

## 実装結果サマリ

| 観点 | 期待値 | 実測 | 結果 |
| --- | --- | --- | --- |
| typecheck | 0 error | 0 error（5 workspace project すべて Done） | PASS |
| Vitest 合計 | ≥ 全 AC 該当 test PASS | 9 files / 130 tests passed | PASS |
| branded 種類 | 7 | 7 (`MemberId` / `ResponseId` / `ResponseEmail` / `StableKey` / `SessionId` / `TagId` / `AdminId`) | PASS |
| zod 31 項目 | 31 / 31 | 63 件の field test 全 PASS（31 項目 × 複数ケース） | PASS |
| viewmodel 数 | 10 | 11 vitest cases（10 viewmodel + 一覧整合 1） | PASS |
| ESLint boundary | 0 違反 | `apps/web → @ubm-hyogo/integrations-google` 直接 import 禁止が機能 | PASS |

## 完了確認

- [x] 10 AC × test × evidence 全件が `ac-matrix.md` に埋まっている
- [x] 全閾値が evidence ログ（phase-11）で裏付けられている
- [x] 不変条件（#1〜#7）と紐付け済み

## 次 Phase への引き継ぎ

- AC マトリクス（10 件）が確定し、Phase 10 GO/NO-GO の根拠資料として参照可能
- evidence パスは `outputs/phase-11/` に集約済み（typecheck.log / vitest.log / eslint-boundary.log）
