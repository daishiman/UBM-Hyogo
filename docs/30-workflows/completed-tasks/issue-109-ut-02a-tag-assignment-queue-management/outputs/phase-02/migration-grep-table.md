# Migration × Repository Grep 照合表

## grep raw 出力

```bash
$ grep -n "tag_assignment_queue" apps/api/migrations/*.sql
apps/api/migrations/0002_admin_managed.sql:53:CREATE TABLE IF NOT EXISTS tag_assignment_queue (
apps/api/migrations/0002_admin_managed.sql:88:  ON tag_assignment_queue(status, created_at);
```

## 既存 column（migration 0002）

| column | DDL | repository TypeScript 型 | 確認 |
| --- | --- | --- | --- |
| queue_id | TEXT PRIMARY KEY | `queueId: string` | ✅ |
| member_id | TEXT NOT NULL | `memberId: MemberId (branded string)` | ✅ |
| response_id | TEXT NOT NULL | `responseId: ResponseId` | ✅ |
| status | TEXT NOT NULL DEFAULT 'queued' | `'queued' \| 'reviewing' \| 'resolved' \| 'rejected'` | ✅ |
| suggested_tags_json | TEXT NOT NULL DEFAULT '[]' | `suggestedTagsJson: string` | ✅ |
| reason | TEXT | `reason: string \| null` | ✅ |
| created_at | TEXT NOT NULL DEFAULT (datetime('now')) | `createdAt: string` | ✅ |
| updated_at | TEXT NOT NULL DEFAULT (datetime('now')) | `updatedAt: string` | ✅ |
| INDEX idx_tag_queue_status | `(status, created_at)` | listQueue 経路で利用 | ✅ |

## 本タスクで追加する column（新規 migration 0009）

| column | DDL | repository TypeScript 型 | 用途 |
| --- | --- | --- | --- |
| idempotency_key | TEXT (UNIQUE) | `idempotencyKey: string \| null` | INSERT 重複防止 |
| attempt_count | INTEGER NOT NULL DEFAULT 0 | `attemptCount: number` | retry カウンタ |
| last_error | TEXT | `lastError: string \| null` | retry / DLQ 用 |
| next_visible_at | TEXT | `nextVisibleAt: string \| null` | 指数バックオフ |
| dlq_at | TEXT | `dlqAt: string \| null` | DLQ 移送時刻 |
| status CHECK 拡張 | `IN ('queued','reviewing','resolved','rejected','dlq')` | enum 拡張 | DLQ 状態追加 |
| INDEX idx_tag_queue_idempotency | UNIQUE (idempotency_key) WHERE idempotency_key IS NOT NULL | createIdempotent | partial unique |
| INDEX idx_tag_queue_visible | (status, next_visible_at) | listPending | retry 復活時 |

## 完全一致

- 既存 8 column + 本タスクで 5 column 追加 = 計 13 column。
- 全 column が repository 型と 1:1 対応。
- migration 順序: `0002_admin_managed.sql`（既存） → `0009_tag_queue_idempotency_retry.sql`（本タスク）。
