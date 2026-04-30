# Phase 1 成果物: 要件定義

## scope 確定

### 入力 (POST /admin/schema/aliases)

```json
{
  "diffId?": "string",
  "questionId": "string (required)",
  "stableKey": "string (required)"
}
```

クエリ: `?dryRun=true|false` (default false)

### 出力

apply mode (200):
```json
{
  "ok": true,
  "mode": "apply",
  "questionId": "...",
  "oldStableKey": "...",
  "newStableKey": "...",
  "affectedResponseFields": 42,
  "queueStatus": "resolved"
}
```

dryRun mode (200):
```json
{
  "ok": true,
  "mode": "dryRun",
  "questionId": "...",
  "currentStableKey": "...",
  "proposedStableKey": "...",
  "affectedResponseFields": 42,
  "currentStableKeyCount": 1,
  "conflictExists": false
}
```

### error matrix

| http | 条件 |
|------|------|
| 400 | invalid json / zod 失敗 |
| 401 | session 不在 |
| 403 | 非 admin |
| 404 | questionId 該当なし / diffId 不一致 |
| 409 | diff の questionId 不一致 |
| 422 | 同 revision で別 questionId が同 stableKey 既使用 (collision) |

## 状態遷移表

| from | to | 条件 |
|------|----|------|
| (none) | queued | 03a sync hook の diff 検出投入 |
| queued | queued | dryRun 実行（書き込みなし） |
| queued | resolved | apply 成功（stableKey 更新 + back-fill 完了） |
| resolved | resolved | idempotent 再 apply は no-op |
| resolved | queued | 禁止（unidirectional） |
| queued | (削除) | 不可（API なし） |

備考: 既存 schema_diff_queue の status enum は `queued | resolved` で実装済み。仕様書の `queued | resolved` を実DB enum にマップする（`queued`, `resolved`）。

## AC 量的指標

| AC | 指標 |
|----|------|
| AC-1 | http=200, schema_questions.stable_key 更新, schema_diff_queue.status='resolved' |
| AC-2 | http=200, DB 完全に不変, audit_log 増加なし |
| AC-3 | http=422 + body.error includes 'collision' |
| AC-4 | response_fields の `__extra__:<questionId>` stable_key が新値に更新 |
| AC-5 | back-fill batch=100, 単一 request で完了 |
| AC-6 | audit_log に action='schema_diff.alias_assigned' 1 件 |
| AC-7 | GET /diff の各 item に recommendedStableKeys: string[] (最大 5) |
| AC-8 | コード grep で stableKey/questionId の string literal 検出 0 件 |
| AC-9 | 削除済み response (deleted_members) は skip |
| AC-10 | session 無し→401, isAdmin=false→403 |

## true issue

1. 実 DB の `response_fields` には questionId/is_deleted カラムがない。stable_key の `__extra__:<questionId>` 形式が back-fill ターゲット
2. collision pre-check は revision_id ベース（実DBでは schema_version_id ではなく revision_id）
3. 削除済み response は `deleted_members` テーブルとの NOT IN サブクエリで除外
4. 実 DB の status enum は queued/resolved（07b の正本）
