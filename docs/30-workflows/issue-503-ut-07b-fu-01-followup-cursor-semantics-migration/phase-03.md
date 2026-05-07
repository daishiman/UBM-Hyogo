# Phase 3: shadow flag / repository / batch I/F 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| Source | `outputs/phase-3/phase-3.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

環境変数 `BACKFILL_CURSOR_MODE`（値域: `remaining-scan` / `cursor`、default: `remaining-scan`）の解釈ロジック、`schemaAliasBackfillBatch.ts` の経路分岐構造、`schemaDiffQueue.ts` repository の cursor 取得・更新メソッド（`getNextBatchByCursor` / `updateBatchCursor`）の関数シグネチャ・入出力・副作用・エラーハンドリングを設計する。public API `backfill.status` の contract を不変に保つ I/F 境界を確定する。

## 実行タスク

詳細は `outputs/phase-3/phase-3.md` を正本とする。要点:

- `BACKFILL_CURSOR_MODE` env 解釈の純関数化（不正値は default fallback + warn log）
- `schemaAliasBackfillBatch.ts` の switch（remaining-scan / cursor の分岐戦略）
- repository 新規メソッド 2 つの関数シグネチャ
- 既存 `recordBatchProgress` / `markBackfill` との呼び出し順序
- error handling（cursor 列 not exist 時 / staleness 時の degrade 方針）
- 想定変更行数とテスト境界

## 統合テスト連携

Phase 4 で env による経路分岐 test、Phase 6 の repository 実装 test、Phase 10 の cursor 経路 / remaining-scan 経路双方の test が、本 phase で確定したシグネチャ table を参照して書かれる。

## 参照資料

- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `outputs/phase-1/phase-1.md`
- `outputs/phase-2/phase-2.md`

## 成果物

- `outputs/phase-3/phase-3.md`

## 完了条件

- shadow flag 解釈・batch 分岐・repository I/F の関数シグネチャ表が確定し、API contract 不変保証の根拠が文書化されている。
