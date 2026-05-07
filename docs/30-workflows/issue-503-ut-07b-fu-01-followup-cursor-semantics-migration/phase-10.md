# Phase 10: 単体テスト実装仕様

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-10/phase-10.md` |

## 目的
vitest による cursor mode / parity / fallback の決定論テスト仕様を確定する。`schemaAliasBackfillBatch` を対象に、cursor 進行 / cursor null 開始 / 不正 env fallback / 失敗 row 含む batch / dedupe 衝突の最低 5 ケースを記述し、両経路（remaining-scan / cursor）が test PASS することを保証する。

## 実行タスク
詳細は `outputs/phase-10/phase-10.md` を正本とする。

## 統合テスト連携
本 Phase の vitest PASS を Phase 11 staging runtime evidence 取得の前提とする。

## 参照資料
- `outputs/phase-10/phase-10.md`
- `apps/api/src/workflows/schemaAliasBackfillBatch.ts`
- `apps/api/src/repository/schemaDiffQueue.ts`

## 成果物
- `outputs/phase-10/phase-10.md`
- vitest テスト追加ケース一覧（spec 確定）

## 完了条件
- 最低 5 ケースの追加テスト仕様が確定。
- 実行コマンド `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaAliasBackfillBatch` が記述。
- 期待 coverage 増分（best-effort）と決定論性（retry_count / cursor 値 assert）が仕様化。
