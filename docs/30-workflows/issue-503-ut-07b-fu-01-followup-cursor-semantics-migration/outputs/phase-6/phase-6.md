# Phase 6: repository 層 cursor 拡張（`schemaDiffQueue.ts`）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 / 13 |
| 作成日 | 2026-05-07 |
| 状態 | spec-confirmed |
| 対象 | `apps/api/src/repository/schemaDiffQueue.ts` / `apps/api/src/repository/schemaDiffQueue.test.ts` |

## 目的

cursor mode が必要とする「cursor 取得」「cursor 更新」を repository 層に追加する。既存 `getNextBatch` / `recordBatchProgress` は **無変更**（remaining-scan 経路の正本）とし、cursor mode 経路は新規メソッドを追加する形で分岐させる。1 D1 トランザクション内で cursor 更新と row 処理を 1 batch 単位でまとめることで dedupe / failed_items_json と整合させる（起票元 §7 リスク表 row-2 への対策）。failed row が残る場合は、その row より先に cursor を進めない。

## 変更対象ファイル

| パス | 変更種別 |
| --- | --- |
| `apps/api/src/repository/schemaDiffQueue.ts` | 既存編集（メソッド追加 + SELECT 列追加） |
| `apps/api/src/repository/schemaDiffQueue.test.ts` | 既存編集（test 追加） |

## 関数シグネチャ

### `getNextBatchByCursor`

```ts
/**
 * cursor mode 用: last_processed_id より大きい id を持つ未処理 row を 1 batch 取得する。
 * cursor が null の場合は先頭から取得する。
 * cursor が NaN / 負値の場合は 0 として扱う（防御的正規化）。
 */
export async function getNextBatchByCursor(
  c: DbCtx,
  questionId: string,
  cursor: number | null,
  limit: number,
): Promise<BatchRow[]>;
```

入力検証:

| 入力 | 正規化 |
| --- | --- |
| `cursor === null` または `undefined` | `0` として扱う |
| `Number.isNaN(cursor)` | `0` |
| `cursor < 0` | `0` |
| `limit <= 0` | `DEFAULT_MAX_BATCH_ROWS` (`500`) にフォールバック |

SQL（仕様）:

```sql
SELECT rf.id, rf.response_id, rf.stable_key, ...
FROM response_fields rf
WHERE rf.stable_key = ?1
  AND rf.id > ?2
  AND rf.response_id NOT IN (
    SELECT mi.current_response_id FROM member_identities mi
    INNER JOIN deleted_members dm ON dm.member_id = mi.member_id
  )
ORDER BY rf.id ASC
LIMIT ?3;
```

> `schema_diff_queue(last_processed_id)` の追加 index ではなく、`response_fields(stable_key, id)` 既存 index を利用する。Phase 11 staging の `EXPLAIN QUERY PLAN` で確認する。

### `updateBatchCursor`

```ts
/**
 * cursor mode 用: 1 batch 完了時に diff_id 行の last_processed_id を更新する。
 * recordBatchProgress とは独立 SQL で発火するが、
 * 呼び出し側 workflow で同一 D1 transaction にまとめる。
 */
export async function updateBatchCursor(
  c: DbCtx,
  diffId: string,
  cursor: number,
): Promise<void>;
```

SQL（仕様）:

```sql
UPDATE schema_diff_queue
SET last_processed_id = ?1, last_processed_at = ?2
WHERE diff_id = ?3;
```

異常系:

| 条件 | 挙動 |
| --- | --- |
| `cursor` が NaN / 負値 | 呼び出し前に `Math.max(0, cursor | 0)` で正規化 |
| `diff_id` が存在しない | UPDATE 0 行で no-op（warn log を呼び出し側で出す） |

### 既存 SELECT 列リストの追加

`schemaDiffQueue.ts:96` 付近の SELECT 列リストに `last_processed_id` を追加し、`Row` 型 / マッパに `lastProcessedId: number | null` を追加する。`backfill_cursor` は温存し既存 `backfillCursor` フィールドと併存させる。

## 既存 `getNextBatch` / `recordBatchProgress` の扱い

| メソッド | 変更 | 理由 |
| --- | --- | --- |
| `getNextBatch` | 無変更 | remaining-scan 経路の正本。cursor mode は新規メソッド経由で分岐 |
| `recordBatchProgress` | 無変更（patch 列に `lastProcessedId` を渡したい場合は別 PR で拡張） | cursor 更新は `updateBatchCursor` に責務分離 |

## トランザクション境界

cursor mode 1 batch の処理ループ:

```
BEGIN
  1) getNextBatchByCursor() で row 取得
  2) backfillResponseFields() で UPDATE
  3) failed row が無い、または retry/DLQ 状態へ明示遷移済みであることを確認
  4) updateBatchCursor() で last_processed_id 更新
  5) recordBatchProgress() で status / retry_count 更新
COMMIT
```

D1 はトランザクションをサポートするため、(2)(3)(4) は同一 transaction にまとめる。Phase 7 の workflow 層で `c.db.batch([...])` または `prepare().bind().run()` の連結で実装する。

## エラーハンドリング

| ケース | 挙動 |
| --- | --- |
| `getNextBatchByCursor` が 0 行返した | cursor は進めず、上位で `completed` と判断（`countRemaining` も 0 なら `completed`） |
| `updateBatchCursor` が UPDATE 0 行 | warn log + retry 対象としない |
| transaction 失敗 | rollback。cursor は前回値のまま、retry_count++ |
| failed row が未記録のまま残る | cursor は failed row より先に進めない。次 batch で再対象に含める |

## テスト方針（Phase 4 と整合）

vitest 単体テスト追加項目:

- `getNextBatchByCursor` cursor=null で先頭から limit 件返す
- `getNextBatchByCursor` cursor=NaN / 負値で 0 として扱う
- `updateBatchCursor` 正常更新
- `updateBatchCursor` diff_id 不在時 no-op + warn log

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- --run schemaDiffQueue \
  | tee outputs/phase-6/repository-test.log
```

## DoD（完了定義）

- [ ] `getNextBatchByCursor` / `updateBatchCursor` のシグネチャ確定
- [ ] cursor 異常値の正規化仕様確定
- [ ] 既存 `getNextBatch` / `recordBatchProgress` 無変更
- [ ] SELECT 列リストへの `last_processed_id` 追加が明記
- [ ] トランザクション境界が明記
- [ ] vitest 追加項目が列挙されている

## 次 Phase の前提条件

Phase 7 で `schemaAliasBackfillBatch.ts` から本 Phase の新規メソッドを呼び出す分岐を実装する。
