# Phase 4: 統合テスト設計（cursor / remaining-scan A/B parity）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-4/phase-4.md` |
| 実装区分 | テスト設計仕様書 |

## 目的
`apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts`（既存編集）に対し、`BACKFILL_CURSOR_MODE` env で切り替えた cursor mode と remaining-scan mode の双方が同一の API contract（`backfill.status` 出力 / `processed` / `remaining` / `retryCount` / `failedItems` / `needsReEnqueue`）を返すことを保証する vitest シナリオを設計する。

## 実行タスク
詳細は `outputs/phase-4/phase-4.md` を正本とする。

## 統合テスト連携
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch` で cursor / remaining-scan 両経路の test PASS を確認する。
- A/B parity describe block (`describe('A/B parity', ...)`) で同一 fixture を両 mode に流し、最終 row 数・dedupe 結果・`backfill.status` 出力の deep equal を assert する。
- `EXPLAIN QUERY PLAN` 取得は unit test では skip し、Phase 11 staging で取得する。

## 参照資料
- `outputs/phase-4/phase-4.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.test.ts`
- `outputs/phase-3/phase-3.md`（Agent A 担当の I/F）
- 起票元 §3.2 / §4 Phase 3 / §5 機能要件

## 成果物
- `outputs/phase-4/phase-4.md`
- `apps/api/src/workflows/__tests__/schemaAliasBackfillBatch.test.ts` への追加 describe（仕様確定。実装は Phase 13 まで保留）

## 完了条件
- cursor mode / remaining-scan mode / A/B parity / dedupe 衝突 / failed_items_json 残存 4 シナリオが describe ブロック単位で網羅されている。
- 100 行 / 1,000 行 / dedupe 衝突 / failed_items_json 残存の fixture 設計が確定している。
- 両 mode で `backfill.status` 出力が一致することの assert 方針が確定している。
