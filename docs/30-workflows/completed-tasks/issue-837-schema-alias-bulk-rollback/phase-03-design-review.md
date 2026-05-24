# Phase 3: Design Review（設計レビューゲート）

## メタ情報
- workflow: issue-837-schema-alias-bulk-rollback
- 入力: `phase-01-requirements.md` / `phase-02-design.md`
- 判定: Phase 4 へ進めるか

## 要件レビュー思考法（5 項目一次結論）

| 観点 | 評価 |
| --- | --- |
| 真の論点 | 「複数 alias を 1 件ずつではなくまとめて取り消す」運用負荷の軽減。API/D1 を変えずに client-side で実現するのが論点 |
| 依存・責務境界 | selection=hook / 表示=modal / panel が統合。既存 single rollback endpoint を per-alias で再利用し、責務境界は #776 bulk resolve と同一構造 |
| 価値とコストの不均衡 | 価値: section 単位 30 件の取消が数分→数十秒。コスト: client helper + modal + hook の追加（中規模）。API/D1 変更ゼロで均衡良好 |
| 改善優先順位 | partial failure の正確な区別表示 > 50 件上限 > 再 submit 導線 |
| 4 条件 | 価値性◯（admin 運用コスト減）/ 実現性◯（既存 endpoint 再利用で 1 サイクル完了可）/ 整合性◯（per-alias 独立 commit で状態所有権が閉じる）/ 運用性◯（per-alias audit で監査追跡可能） |

## 因果ループ確認

- 強化ループ: bulk rollback で取消が容易 → 誤 resolve の心理的コスト減 → schema 改訂時の resolve 試行が活発化 → 運用速度向上。
- バランスループ: 一括取消の誤操作リスク → confirm modal + 50 件上限 + per-row 結果表示で抑制。

## レビュー項目

| # | 項目 | 判定 | 備考 |
| --- | --- | --- | --- |
| R-1 | 不変条件「API/D1 変更なし」を満たすか | PASS | client-side fan-out のみ。新 endpoint / migration なし |
| R-2 | transaction 境界が明示されているか（AC-2） | PASS | per-alias 独立 commit を採用、全件 atomic 不採用の理由明記 |
| R-3 | version mismatch の応答 shape が定義されているか | PASS | `SchemaAliasRollbackBulkRowResult.error.kind = version_mismatch` |
| R-4 | audit 追跡可能性（AC-3） | PASS | 既存 endpoint が per-alias `schema_alias.rollback` を emit。batch parent-child はスコープ外（理由明記） |
| R-5 | 既存 contract 破壊なし（AC-6） | PASS | `rollbackSchemaAlias` / single UI / bulk resolve UI を改変せず並走 |
| R-6 | 命名一貫性（FB-SDK-07-4） | PASS | `postSchemaAliasBulk` ↔ `rollbackSchemaAliasBulk` 等の対称命名 |
| R-7 | a11y / design token | PASS（実装で gate 検証） | 既存 modal の focus trap / OKLch token を踏襲 |
| R-8 | `runWithConcurrency` 重複定義リスク | MINOR | Phase 8 で SSOT（export か同一ファイル内参照）を確認すること |
| R-9 | 50 件上限の二重ガード（UI + helper） | PASS | FR-10 + helper の防御的検証 |
| R-10 | state ロック解放経路の網羅 | PASS | 正常/部分/全失敗/close の 4 経路を Phase 2 に明記 |

## MINOR 指摘の扱い

- R-8（`runWithConcurrency` の SSOT）: Phase 8 リファクタで「export して両 helper が参照」を確定する。実装に影響しない設計上の整理のため、Phase 12 未タスク化は不要（同一 wave で解消）。

## ゲート判定

**PASS — Phase 4 へ進む。**

ブロッカーなし。MINOR（R-8）は Phase 8 内で解消する前提。
