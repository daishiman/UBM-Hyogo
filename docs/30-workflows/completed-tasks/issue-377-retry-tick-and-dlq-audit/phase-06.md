# Phase 6: 関数シグネチャと擬似コード

## `apps/api/src/workflows/tagQueueRetryTick.ts`（新規）

```ts
import { ulid } from "ulid"; // 既存使用箇所と同じ ulid を使用（無ければ ad-hoc）
import {
  TAG_QUEUE_TICK_BATCH_SIZE,
  TAG_QUEUE_TICK_MAX_RUNTIME_MS,
  incrementRetry,
  listPending,
  moveToDlq,
  type TagAssignmentQueueRow,
} from "../repository/tagQueue";
import { auditAction } from "../repository/_shared/brand";
import type { Env } from "../env";
import { getDbCtx } from "../repository/_shared/db"; // 既存パターンに合わせる

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

class NonRetryableError extends Error {
  constructor(message: string) { super(message); this.name = "NonRetryableError"; }
}

export async function runTagQueueRetryTick(
  env: Env,
  deps: RetryTickDeps = {},
): Promise<RetryTickResult> {
  const c = getDbCtx(env);
  const now = deps.now ?? (() => new Date().toISOString());
  const batchSize = deps.batchSize ?? TAG_QUEUE_TICK_BATCH_SIZE;
  const maxRuntimeMs = deps.maxRuntimeMs ?? TAG_QUEUE_TICK_MAX_RUNTIME_MS;
  const processRow = deps.processRow ?? (async () => { /* default noop */ });
  const actor = deps.systemActorEmail ?? "system@retry-tick";

  const startedAt = Date.now();
  const result: RetryTickResult = {
    scanned: 0, retried: 0, movedToDlq: 0, noop: 0,
    abortedByTimeout: false, elapsedMs: 0,
  };

  const rows = await listPending(c, { now: now(), limit: batchSize });
  for (const row of rows) {
    if (Date.now() - startedAt > maxRuntimeMs) {
      result.abortedByTimeout = true;
      break;
    }
    result.scanned++;
    try {
      await processRow(row);
      // 成功時は本タスクでは status 遷移しない（呼出側 processRow に委譲。default は noop）
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (err instanceof NonRetryableError) {
        const r = await moveToDlq(c, row.queueId, message, now());
        if (r.changed) {
          await emitDlqAudit(c, { row, message, actor, now: now() });
          result.movedToDlq++;
        } else {
          result.noop++;
        }
      } else {
        const r = await incrementRetry(c, row.queueId, message, now());
        if (r.moved === "dlq") {
          await emitDlqAudit(c, { row, message, actor, now: now() });
          result.movedToDlq++;
        } else if (r.moved === "retry") {
          result.retried++;
        } else {
          result.noop++;
        }
      }
    }
  }

  result.elapsedMs = Date.now() - startedAt;
  return result;
}

async function emitDlqAudit(
  c: ReturnType<typeof getDbCtx>,
  args: { row: TagAssignmentQueueRow; message: string; actor: string; now: string },
): Promise<void> {
  const { row, message, actor, now } = args;
  const auditId = `audit_${ulid()}`;
  const after = JSON.stringify({
    attemptCount: row.attemptCount + 1,
    lastError: message,
    dlqAt: now,
  });
  await c.db
    .prepare(
      "INSERT INTO audit_log (audit_id, actor_email, actor_id, action, target_type, target_id, after_json, created_at) VALUES (?1, ?2, NULL, ?3, ?4, ?5, ?6, ?7)",
    )
    .bind(
      auditId,
      actor,
      auditAction("admin.tag.queue_dlq_moved"),
      "tag_queue",
      row.queueId,
      after,
      now,
    )
    .run();
}

export { NonRetryableError };
```

> 実装結果: `ctx(env)` / `crypto.randomUUID()` を使い、外部 `ulid` dependency は追加しない。plain human-review `queued` row は retry tick 対象外として skip する。

## `apps/api/src/index.ts`（編集 diff 方針）

```diff
@@
+import { runTagQueueRetryTick } from "./workflows/tagQueueRetryTick";
+import { TAG_QUEUE_TICK_CRON } from "./repository/tagQueue";
@@
   async scheduled(event, env, ctx) {
     const cron = (event as ScheduledController & { cron?: string }).cron ?? "";
+    if (cron === TAG_QUEUE_TICK_CRON) {
+      ctx.waitUntil(runTagQueueRetryTick(env).catch(() => { /* sink */ }));
+      return;
+    }
     if (cron === "*/15 * * * *") { ... }
```

## `apps/api/wrangler.toml`（編集 diff 方針）

```diff
 [triggers]
-crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
+crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *", "*/5 * * * *"]

 [env.production.triggers]
-crons = ["0 18 * * *", "*/15 * * * *"]
+crons = ["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]   # 計 3 本（free plan 上限内）

 [env.staging.triggers]
-crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
+crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *", "*/5 * * * *"]
```

> staging が free plan 上限（3 本）を超える場合は Phase 10 で staging cron を整理（`0 * * * *` を一時 off）する判断を行う。

## 完了条件

- [ ] 上記擬似コードと diff 方針が `outputs/phase-06/main.md` に格納される。
- [ ] `getDbCtx` / `Env` / `ulid` の実 import パスが現行コードと一致することを Phase 11 で確認する旨が明記される。

## 出力

- outputs/phase-06/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

関数実装と cron wiring を固定する。

## 実行タスク

- `tagQueueRetryTick.ts` と scheduled branch を実装する。

## 参照資料

- `apps/api/src/index.ts`
- `apps/api/src/workflows/tagQueueRetryTick.ts`

## 成果物/実行手順

- `outputs/phase-06/main.md`

## 統合テスト連携

- focused Vitest
