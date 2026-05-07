# Phase 3: shadow flag / repository / batch I/F 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 作成日 | 2026-05-07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |
| 前提 | Phase 1 / Phase 2 GO 判定済み |

## 目的

`BACKFILL_CURSOR_MODE` 環境変数の解釈ロジック、`schemaAliasBackfillBatch.ts` の経路分岐、`schemaDiffQueue.ts` の cursor 取得・更新メソッドの関数シグネチャを確定する。`backfill.status` API contract を不変に保つ I/F 境界を明確化し、Phase 4（統合テスト設計）以降の実装が本書の signature に整合することを test gate で保証する。

## 環境変数 `BACKFILL_CURSOR_MODE` 解釈

| 入力 | 解釈 | 副作用 |
| --- | --- | --- |
| 未設定 | `remaining-scan` | warn log なし |
| `"remaining-scan"` | `remaining-scan` | warn log なし |
| `"cursor"` | `cursor` | info log: cursor mode active |
| その他（typo / 大文字小文字違い） | default fallback `remaining-scan` | warn log: invalid value, falling back to default |

### 純関数 signature

```ts
// apps/api/src/workflows/schemaAliasBackfillBatch.ts 内 helper として配置
type BackfillCursorMode = 'remaining-scan' | 'cursor';

function resolveBackfillCursorMode(envValue: string | undefined): BackfillCursorMode;
```

不正値時の log は本関数の副作用とせず、呼び出し側で `console.warn` する（純関数性の維持）。

## `schemaAliasBackfillBatch.ts` 経路分岐

既存の `runSchemaAliasBackfillBatch(...)` エントリポイントは保持し、内部で次のように分岐する:

```ts
// 概念図（実装は Phase 5）
const mode = resolveBackfillCursorMode(env.BACKFILL_CURSOR_MODE);
const rows = mode === 'cursor'
  ? await schemaDiffQueue.getNextBatchByCursor(c, diffId, cursor, BATCH_SIZE)
  : await schemaDiffQueue.getNextBatchRemainingScan(c, diffId, BATCH_SIZE); // 既存ロジック移譲

// ... 共通の row 処理（dedupe / failed_items_json / retry_count 更新）...

if (mode === 'cursor') {
  await schemaDiffQueue.updateBatchCursor(c, diffId, lastProcessedId);
}
await schemaDiffQueue.recordBatchProgress(c, diffId, /* 既存引数 */);
```

### 分岐の不変条件

- `recordBatchProgress` 呼び出しは両経路共通（`backfill.status` レスポンスに影響する唯一の副作用）
- `updateBatchCursor` は cursor 経路のみで呼ばれ、`backfill.status` レスポンスには現れない
- 既存 row 処理ループ（dedupe / failed_items_json / retry_count）は両経路で共有

## `schemaDiffQueue.ts` 新規 repository メソッド

### 関数シグネチャ表

| メソッド | シグネチャ | 副作用 | エラー方針 |
| --- | --- | --- | --- |
| `getNextBatchByCursor` | `(c: DbCtx, diffId: string, cursor: number \| null, limit: number) => Promise<SchemaDiffQueueItemRow[]>` | read-only | cursor 列が存在しない場合は throw（migration 未 apply 検出） |
| `updateBatchCursor` | `(c: DbCtx, diffId: string, lastProcessedId: number) => Promise<void>` | UPDATE 1 行 | 該当 diff 不在時 throw |
| `getNextBatchRemainingScan` | `(c: DbCtx, diffId: string, limit: number) => Promise<SchemaDiffQueueItemRow[]>` | read-only | 既存 remaining-scan ロジックを名前付きでリファクタ抽出（既存呼び出し点も合わせて変更） |

### SQL 概念

```sql
-- getNextBatchByCursor
SELECT id, /* ... */
FROM schema_diff_queue_items
WHERE diff_id = ?1
  AND status = 'pending'
  AND id > COALESCE(?2, 0)
ORDER BY id ASC
LIMIT ?3;

-- updateBatchCursor
UPDATE schema_diff_queue
SET last_processed_id = ?2,
    updated_at = CURRENT_TIMESTAMP
WHERE diff_id = ?1;
```

注: `schema_diff_queue` と row item テーブルの対応は既存実装に従う（Phase 5 で確定）。本書では概念上の SQL のみ示す。

## 想定変更ファイルと変更行数（目安）

| ファイル | 種別 | 想定変更行数 |
| --- | --- | --- |
| `apps/api/src/workflows/schemaAliasBackfillBatch.ts` | 編集 | +40 / -10 |
| `apps/api/src/repository/schemaDiffQueue.ts` | 編集 | +60 / -5 |
| `apps/api/migrations/0015_schema_diff_queue_cursor.sql` | 新規（採用時） | +10 |
| `apps/api/test/**/schemaAliasBackfillBatch.test.ts` | 編集 | +80 / -0 |
| 合計（採用時） | — | +190 / -15 |
| 合計（不採用時） | — | +20 / -5（shadow 経路撤去後） |

## error handling

| 事象 | 経路 | 動作 |
| --- | --- | --- |
| cursor 列が無い（migration 未 apply） | cursor 経路 | repository が throw → batch handler は warn log + remaining-scan 経路に degrade（同 batch 内で再試行） |
| `BACKFILL_CURSOR_MODE` 不正値 | env 解釈 | default fallback + warn log（前述） |
| cursor stale（前回 batch 完了後に新規 row enqueue） | cursor 経路 | `id > last_processed_id` の単調増加性が D1 PK で保証されるため自然に拾われる |
| `updateBatchCursor` で row 不在 | cursor 経路 | throw（caller で再試行 / DLQ 判定は別タスク） |

## API contract 不変保証

`apps/api/src/handlers/backfillStatus.ts`（既存）に変更を加えない。`backfill.status` レスポンスの schema test（既存）が両経路で PASS することを Phase 4 / Phase 10 で gate する。

具体保証項目:

1. `backfill.status` レスポンスのフィールド集合不変
2. 値域（`pending` / `running` / `done` / `failed`）不変
3. `cursor` / `last_processed_id` 等の internal 概念がレスポンスに現れない

## Acceptance Criteria

| ID | 内容 | 計測方法 |
| --- | --- | --- |
| AC-1 | env 解釈の純関数 signature が確定 | spec grep |
| AC-2 | repository 新規 2 メソッドのシグネチャ表が確定 | spec grep |
| AC-3 | batch 分岐構造（共通 row 処理 + cursor 経路のみ updateBatchCursor）が文書化 | spec grep |
| AC-4 | error handling 4 ケースが定義 | spec grep |
| AC-5 | API contract 不変保証 3 項目が明記 | spec grep |

## 成果物

- `outputs/phase-3/phase-3.md`（本ファイル）

## 完了条件

- [ ] env 解釈 / batch 分岐 / repository 新規メソッド / error handling / contract 保証が確定
- [ ] Phase 4（統合テスト設計）着手の GO 判定
