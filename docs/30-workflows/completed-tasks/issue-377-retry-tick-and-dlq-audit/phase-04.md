# Phase 4: API / I/O 契約

## 公開 API

```ts
// apps/api/src/workflows/tagQueueRetryTick.ts
export interface RetryTickDeps {
  now?: () => string;
  batchSize?: number;
  maxRuntimeMs?: number;
  processRow?: (row: TagAssignmentQueueRow) => Promise<void>;
  systemActorEmail?: string;
}

export interface RetryTickResult {
  scanned: number;
  retried: number;
  movedToDlq: number;
  noop: number;
  abortedByTimeout: boolean;
  elapsedMs: number;
}

export async function runTagQueueRetryTick(
  env: Env,
  deps?: RetryTickDeps,
): Promise<RetryTickResult>;
```

## 入出力

- 入力: `env`（D1 binding 含む）、`deps`（任意）
- 出力: `RetryTickResult`（観測用・cron handler は読み捨て可）
- 副作用:
  - `tag_assignment_queue` row UPDATE（`incrementRetry` / `moveToDlq` 経由）
  - `audit_log` INSERT（DLQ 移送 1 件につき 1 行、`admin.tag.queue_dlq_moved`）

## 外部 HTTP / RPC API

なし。本タスクは scheduled cron 内部実行に閉じる。

## scheduled handler 契約（編集側）

```ts
// apps/api/src/index.ts (scheduled 内に追記)
if (cron === TAG_QUEUE_TICK_CRON) {
  ctx.waitUntil(runTagQueueRetryTick(env).catch(() => { /* sink: 次 tick で retry */ }));
  return;
}
```

## 完了条件

- [ ] 公開 API シグネチャと `RetryTickResult` が `outputs/phase-04/main.md` に確定記録される。
- [ ] 既存 scheduled 分岐との順序関係（追加位置）が明記される。

## 出力

- outputs/phase-04/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

retry tick の内部 API 契約を固定する。

## 実行タスク

- `runTagQueueRetryTick` の入出力を検証する。

## 参照資料

- `apps/api/src/workflows/tagQueueRetryTick.ts`

## 成果物/実行手順

- `outputs/phase-04/main.md`

## 統合テスト連携

- `RetryTickResult` assertions
