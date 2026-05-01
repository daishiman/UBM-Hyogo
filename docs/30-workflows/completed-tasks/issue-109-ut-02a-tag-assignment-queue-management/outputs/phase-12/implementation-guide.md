# Implementation Guide

## Part 1: 中学生レベル概念説明

`tag_assignment_queue` は **学級委員が候補者を整理券順に並べる箱**。

- **整理券（idempotency_key）**: 同じ人を 2 回並ばせない。同じボタンを 2 回押しても 1 個しか注文されない仕組み。
- **キュー（queue）**: 給食の配膳列・銀行の整理券のように、順番待ち。先着順に admin が処理する。
- **管理者承認（admin queue）**: 先生（admin）が呼び出して、認める / 却下を決める。先生の確認後に名簿（member_tags）に書く。
- **リトライ / DLQ（保留棚）**: 配達できなかった荷物を「保留棚（DLQ）」に移す例え。3 回呼び出しても返事がない人は保留棚へ。
- **困りごと**: 自己申告タグが濫用されると正確性が落ちる。処理中断時に重複付与されると名簿が汚れる。
- **解決後**: 整理券で重複なし・先生の承認で正確性確保・DLQ で運用監視可能。

## Part 2: 開発者・技術者レベル

### Schema (DDL)

```sql
-- 既存（0002_admin_managed.sql）
CREATE TABLE tag_assignment_queue (
  queue_id            TEXT PRIMARY KEY,
  member_id           TEXT NOT NULL,
  response_id         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'queued',
  suggested_tags_json TEXT NOT NULL DEFAULT '[]',
  reason              TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 0009_tag_queue_idempotency_retry.sql（本タスク）
ALTER TABLE tag_assignment_queue ADD COLUMN idempotency_key TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tag_assignment_queue ADD COLUMN last_error TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN next_visible_at TEXT;
ALTER TABLE tag_assignment_queue ADD COLUMN dlq_at TEXT;
CREATE UNIQUE INDEX idx_tag_queue_idempotency
  ON tag_assignment_queue(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_tag_queue_visible ON tag_assignment_queue(status, next_visible_at);
CREATE INDEX idx_tag_queue_dlq ON tag_assignment_queue(status, dlq_at);
```

### Repository interface

```ts
// apps/api/src/repository/tagQueue.ts
export type TagQueueStatus = "queued" | "reviewing" | "resolved" | "rejected" | "dlq";
export const TAG_QUEUE_MAX_RETRY = 3;
export const TAG_QUEUE_BACKOFF_BASE_SEC = 30;

// 既存
export function listQueue(c, status?): Promise<Row[]>;
export function findQueueById(c, queueId): Promise<Row | null>;
export function enqueue(c, row): Promise<Row>;
export function transitionStatus(c, queueId, next): Promise<Row>;

// 本タスク追加
export function findByIdempotencyKey(c, key): Promise<Row | null>;
export function createIdempotent(c, row): Promise<{ row, isExisting }>;
export function listPending(c, { now, limit? }): Promise<Row[]>;
export function listDlq(c, { limit? }): Promise<Row[]>;
export function incrementRetry(c, id, error, now, maxRetry?): Promise<{ moved: 'retry' | 'dlq' | 'noop' }>;
export function moveToDlq(c, id, error, now): Promise<{ changed: boolean }>;
export function deriveIdempotencyKey({ memberId, responseId }): string;
```

### state machine

| from | allowed to |
| --- | --- |
| queued | reviewing, resolved, rejected, dlq |
| reviewing | resolved, rejected |
| resolved | (なし) |
| rejected | (なし) |
| dlq | (なし、手動 requeue は将来) |

### idempotency 設計

- key: `<memberId>:<responseId>`（`deriveIdempotencyKey` 関数で生成、deterministic）
- 現行 candidate row は `suggested_tags_json='[]'` で投入し、admin が後から tagCodes を確定するため、idempotency key に `tagCode` は含めない
- UNIQUE 制約: partial unique index `idx_tag_queue_idempotency`（NULL 許容）
- 既存行存在時は INSERT を試みず、`isExisting=true` で既存行を返す

### retry policy

- max retries: `TAG_QUEUE_MAX_RETRY = 3`
- backoff: `30s × 2^(attempt-1)` → 30s / 60s / 120s
- 上限超過: `status='dlq'`、`dlq_at` 記録、`last_error` 確定
- guarded UPDATE: `WHERE status='queued'`（terminal 行は noop）

### zod schema / error mapping

- 入力 schema は既存 `apps/api/src/schemas/tagQueueResolve.ts` を流用（07a workflow 用）
- error: 400 (validation) / 409 (state conflict) / 422 (FK violation) / 500 (D1 error)

### audit log payload

- `admin.tag.queue_resolved` / `admin.tag.queue_rejected`（07a workflow 内で記録）
- 将来: `admin.tag.queue_dlq_moved`（retry workflow 実装時に追加予定。今回 wave では未タスク化）

### Evidence references

| 種別 | path |
| --- | --- |
| Phase 11 top | `outputs/phase-11/main.md` |
| NON_VISUAL evidence | `outputs/phase-11/non-visual-evidence.md` |
| manual verification log | `outputs/phase-11/manual-verification-log.md` |
| member_tags write grep | `outputs/phase-11/grep/membertags-write.txt` |
| apps/web D1 boundary grep | `outputs/phase-11/grep/web-direct-d1.txt` |
| migration grep | `outputs/phase-11/sql/migration-grep.txt` |

### 検証コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api test
```

### AC 充足状況

| AC | 状態 |
| --- | --- |
| AC-1 CRUD | ✅ |
| AC-2 状態遷移 unidirectional | ✅ |
| AC-3 idempotency | ✅ |
| AC-4 retry/DLQ | ✅ |
| AC-5 memberTags read-only | ✅ |
| AC-6 boundary | ✅ |
| AC-7 audit | ✅（07a 既存 workflow） |
| AC-8 alias map | ✅ |
| AC-9 migration grep | ✅ |
| AC-10 enqueue public API | ✅（既存 enqueueTagCandidate） |

### 変更ファイル一覧

| 種別 | path |
| --- | --- |
| 追加 | `apps/api/migrations/0009_tag_queue_idempotency_retry.sql` |
| 修正 | `apps/api/src/repository/tagQueue.ts` |
| 追加 | `apps/api/src/repository/tagQueueIdempotencyRetry.test.ts` |
| 追加 | `apps/api/src/repository/__tests__/memberTags.readonly.test-d.ts` |
| 追加 | `docs/30-workflows/issue-109-ut-02a-tag-assignment-queue-management/outputs/phase-01〜12/...` |

### テスト結果サマリ

- 本タスク対象範囲: 49/49 PASS（typecheck + 13 新規 unit + 36 既存）
- 全体: 497/499 PASS（fail 2 件は schemaDiffQueue.test.ts の既存問題、本タスク無関係）

### 既存実装との関係

| 既存ファイル | 関係 |
| --- | --- |
| `apps/api/src/repository/tagQueue.ts` | 本タスクで拡張（CRUD + status enum + 新規関数追加） |
| `apps/api/src/workflows/tagCandidateEnqueue.ts` | 既存（AC-10 を既に満たす）。本タスクで変更なし |
| `apps/api/src/workflows/tagQueueResolve.ts` | 既存 07a workflow。本タスクの transitionStatus 拡張と互換 |
| `apps/api/src/repository/memberTags.ts` | read-only 規約維持。本タスクで変更なし。新規 type-level test を追加 |
