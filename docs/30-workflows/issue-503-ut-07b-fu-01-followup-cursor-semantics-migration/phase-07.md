# Phase 7: workflow 層 shadow flag 実装（`schemaAliasBackfillBatch.ts`）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-7/phase-7.md` |
| 実装区分 | 実装仕様書（workflow） |

## 目的
`apps/api/src/workflows/schemaAliasBackfillBatch.ts` に `BACKFILL_CURSOR_MODE` env による remaining-scan / cursor の切替分岐を実装する仕様を確定する。API contract `backfill.status` の出力 schema は両 mode で同一であることを不変条件とする。

## 実行タスク
詳細は `outputs/phase-7/phase-7.md` を正本とする。

## 統合テスト連携
- Phase 4 の `describe('BACKFILL_CURSOR_MODE=cursor', ...)` と `describe('A/B parity', ...)` が本 Phase の分岐実装の契約となる。
- 不正値 (`BACKFILL_CURSOR_MODE=invalid` 等) のときは warn log を出して remaining-scan に fallback する仕様を vitest で検証する。

## 参照資料
- `outputs/phase-7/phase-7.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- 起票元 §3.2 / §4 Phase 3 / §7 リスク表 row-3

## 成果物
- `outputs/phase-7/phase-7.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts` の env 分岐仕様（実装は Phase 13 まで保留）

## 完了条件
- env 読み取り箇所と default fallback (`remaining-scan`) が明記されている。
- 不正値時の warn log + fallback 挙動が仕様化されている。
- cursor mode の処理ループ（`getNextBatchByCursor` → 処理 → `updateBatchCursor`）が手順として確定している。
- 構造化ログ仕様（`logInfo({ code, context: { mode, cursor, batchSize } })`）が確定している。
