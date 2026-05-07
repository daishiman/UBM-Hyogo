# Phase 6: repository 層 cursor 拡張（`schemaDiffQueue.ts`）

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-6/phase-6.md` |
| 実装区分 | 実装仕様書（repository） |

## 目的
`apps/api/src/repository/schemaDiffQueue.ts` に cursor 取得・更新メソッドを追加する仕様を確定する。既存 `getNextBatch` / `recordBatchProgress` は無変更とし、cursor mode 経路は新規 `getNextBatchByCursor` / `updateBatchCursor` を追加する形で分岐させる。

## 実行タスク
詳細は `outputs/phase-6/phase-6.md` を正本とする。

## 統合テスト連携
- `mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaDiffQueue` で repository 単体 test を回し、新メソッドの単体テストと既存 `recordBatchProgress` の non-regression を確認する。
- D1 トランザクション内で cursor 更新と row 処理を 1 batch 単位でまとめる仕様を Phase 4 の A/B parity 仕様と整合させる。

## 参照資料
- `outputs/phase-6/phase-6.md`
- `apps/api/src/repository/schemaDiffQueue.ts`
- `apps/api/src/repository/schemaDiffQueue.test.ts`
- 起票元 §3.2 / §7 リスク表 row-2

## 成果物
- `outputs/phase-6/phase-6.md`
- `apps/api/src/repository/schemaDiffQueue.ts` への追加メソッド仕様（実装は Phase 13 まで保留）

## 完了条件
- `getNextBatchByCursor(cursor: number | null, limit: number)` / `updateBatchCursor(batchId: string, cursor: number)` のシグネチャが確定。
- cursor が NaN / 負値の場合 0 として扱う異常系が仕様化されている。
- 既存 `getNextBatch` の行は変更しない方針が明記されている。
