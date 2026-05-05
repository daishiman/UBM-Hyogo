# Phase 3: 設計

## 設計概要

```
Cloudflare scheduled cron */5 * * * *
  → apps/api/src/index.ts#scheduled (cron === TAG_QUEUE_TICK_CRON)
    → ctx.waitUntil(runTagQueueRetryTick(env, deps))
       ├─ listPending(c, {now, limit: BATCH_SIZE})
       ├─ skip plain human-review queued row
       └─ for each row:
          ├─ try processRow(row)        // 既存ハンドラ呼出（後続実装で差し込む拡張点）
          ├─ on retryable error  → incrementRetry(c, queueId, errorMessage, now)
          │     ├─ result.moved === 'retry' → next iteration
          │     └─ result.moved === 'dlq'   → emitDlqAudit(c, row, errorMessage, now)
          └─ on non-retryable error → moveToDlq(c, queueId, errorMessage, now)
                                       + emitDlqAudit(...)
       └─ break if elapsedMs > MAX_RUNTIME_MS
```

## モジュール境界

| モジュール | 責務 |
| --- | --- |
| `tagQueueRetryTick.ts` | tick orchestration / batch loop / 時間予算 / audit emit |
| `tagQueue.ts`（既存） | retry / DLQ / list の永続化 |
| `_shared/brand.ts`（既存・拡張） | audit action brand |
| `index.ts`（既存・拡張） | cron 分岐 |

## 依存注入

`runTagQueueRetryTick` は test 性のため `deps` を受け取る:

```ts
interface RetryTickDeps {
  now?: () => string;                       // default: () => new Date().toISOString()
  batchSize?: number;                       // default: TAG_QUEUE_TICK_BATCH_SIZE
  maxRuntimeMs?: number;                    // default: TAG_QUEUE_TICK_MAX_RUNTIME_MS
  processRow?: (row: TagAssignmentQueueRow) => Promise<void>; // default: noop（拡張点）
  systemActorEmail?: string;                // default: 'system@retry-tick'
}
```

## audit shape

```json
{
  "audit_id": "audit_<ulid>",
  "actor_email": "system@retry-tick",
  "actor_id": null,
  "action": "admin.tag.queue_dlq_moved",
  "target_type": "tag_queue",
  "target_id": "<queueId>",
  "after_json": "{\"attemptCount\":<n>,\"lastError\":\"<msg>\",\"dlqAt\":\"<iso>\"}",
  "created_at": "<iso>"
}
```

## cron 設計

| 環境 | cron | 備考 |
| --- | --- | --- |
| top-level | `*/5 * * * *` | legacy Sheets hourly を手動限定へ寄せ、3 本以内 |
| staging | `*/5 * * * *` | production parity。legacy Sheets hourly を手動限定へ寄せ、3 本以内 |
| production | `*/5 * * * *` | 既存 2 本 + 1 本 = 3 本 |

retry tick 対象条件は `reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL` のいずれか。plain `queued` は admin review queue として skip し、cron が人間レビュー待ちを誤処理しないことを最優先にする。

## 完了条件

- [ ] sequence 図 / モジュール境界 / DI 契約 / audit shape / cron 表が `outputs/phase-03/main.md` に記録されている。

## 出力

- outputs/phase-03/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

retry tick の実装設計を固定する。

## 実行タスク

- queue taxonomy / cron / audit atomicity を設計する。

## 参照資料

- `apps/api/src/workflows/tagQueueRetryTick.ts`
- `apps/api/wrangler.toml`

## 成果物/実行手順

- `outputs/phase-03/main.md`

## 統合テスト連携

- `apps/api/src/workflows/tagQueueRetryTick.test.ts`
