# Phase 2: 設計 — 成果物

## サマリー

- state machine（`queued / reviewing / resolved / rejected / dlq`）+ idempotency_key UNIQUE + retry/DLQ 列拡張で `tag_assignment_queue` の write 経路を確立する。
- 既存規約（`apps/api/src/repository/tagQueue.ts`）を維持し、新規関数を追加する。仕様書の `repositories/tagAssignmentQueue.ts`（複数形）は採用しない。
- 仕様語↔実装語対応表は spec-extraction-map.md、migration×repo 照合は migration-grep-table.md に分離。

## handler signature（本タスク追加分）

```ts
// apps/api/src/repository/tagQueue.ts に追加
export type IdempotencyKey = string;

export interface NewTagAssignmentQueueRowV2 extends NewTagAssignmentQueueRow {
  idempotencyKey: IdempotencyKey;
}

export async function findByIdempotencyKey(c: DbCtx, key: IdempotencyKey): Promise<TagAssignmentQueueRow | null>;
export async function listPending(c: DbCtx, opts: { now: string; limit?: number }): Promise<TagAssignmentQueueRow[]>;
export async function listDlq(c: DbCtx, opts?: { limit?: number }): Promise<TagAssignmentQueueRow[]>;
export async function incrementRetry(c: DbCtx, queueId: string, errorMessage: string, now: string, maxRetry?: number): Promise<{ moved: 'retry' | 'dlq' }>;
export async function moveToDlq(c: DbCtx, queueId: string, errorMessage: string, now: string): Promise<{ changed: boolean }>;
export async function createIdempotent(c: DbCtx, row: NewTagAssignmentQueueRowV2): Promise<{ row: TagAssignmentQueueRow; isExisting: boolean }>;
```

## 設定値

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| idempotency 単位 | `<memberId>:<responseId>` の deterministic key（hash 化前提） | 再回答で re-evaluate 可能 |
| retry 回数 | 3 | 無料枠 / 体感バランス |
| retry 戦略 | 指数バックオフ 30s / 60s / 120s | transient error 想定 |
| DLQ | 同一 table の `status='dlq'` | migration コスト最小 |
| schema 所有 | `apps/api/src/repository/tagQueue.ts`（単一所有） | 既存規約 |

## 成果物

- main.md (this)
- state-machine.md
- spec-extraction-map.md
- migration-grep-table.md
