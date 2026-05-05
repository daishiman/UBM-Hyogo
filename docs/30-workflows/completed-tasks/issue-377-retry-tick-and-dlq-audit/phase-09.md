# Phase 9: テスト計画

## Unit test — `apps/api/src/workflows/tagQueueRetryTick.test.ts`（新規）

| # | ケース | setup | 検証 |
| - | - | - | - |
| 1 | retry 成功（1 件 retryable error）| queued row × 1, processRow が `throw new Error("D1 transient")` | result.retried === 1 / row.attempt_count === 1 / next_visible_at が 30s 後 |
| 2 | default scheduled path | retry-eligible queued row × 1, processRow injection なし | result.retried === 1 / row.attempt_count が進む |
| 3 | max retry 超過 → DLQ + audit | queued row（attempt_count=3）× 1, processRow が retryable error throw | result.movedToDlq === 1 / row.status === 'dlq' / audit_log に `admin.tag.queue_dlq_moved` 1 行 |
| 4 | batch 上限 | queued row × 30, batchSize = 10 | result.scanned === 10 |
| 5 | maxRuntime 経過で中断 | queued row × 50, processRow が 100ms sleep, maxRuntimeMs = 200 | result.abortedByTimeout === true / scanned < 50 |
| 6 | NonRetryableError → 即 DLQ + audit | queued row × 1, processRow が `throw new NonRetryableError("validation")` | result.movedToDlq === 1 / attempt_count は変化なし / audit 1 行 |
| 7 | human-review queued skip | plain queued row, retry marker なし | result.skipped === 1 / row unchanged |

`fakeD1` は `apps/api/src/repository/__fixtures__/` の既存 helper を使用（`tagQueue.test.ts` のパターンを踏襲）。

## D1 fixture test — `apps/api/src/workflows/tagQueueRetryTick.test.ts`

| # | ケース | 検証 |
| - | - | - |
| 1 | Miniflare D1 fixture に対し retry tick → DLQ → audit_log 連鎖 | `audit_log` に `action='admin.tag.queue_dlq_moved'` / `target_type='tag_queue'` row が `target_id` 指定で取得できる |

> 現行 repo では `apps/api/src/workflows/tagQueueRetryTick.test.ts` の Miniflare D1 fixture に統合し、別 `apps/api/test/integration/` は新設しない。

## scheduled handler テスト

`apps/api/src/index.ts` の `scheduled` 分岐は既存テスト方針に従う。新規ケースとして「`cron === '*/5 * * * *'` で `runTagQueueRetryTick` が呼ばれる」を 1 ケース追加（既存 `index.test.ts` 等が無ければ skip し、unit / integration の合算で AC-2 を満たす）。

## 実行コマンド

```bash
pnpm exec vitest run --config=vitest.config.ts apps/api/src/workflows/tagQueueRetryTick.test.ts
pnpm --filter @ubm-hyogo/api test
pnpm --filter @ubm-hyogo/api typecheck
pnpm --filter @ubm-hyogo/api lint
```

## 完了条件

- [ ] テスト 7 ケースの setup / assertion が `outputs/phase-09/main.md` に記録される。
- [ ] 上記コマンドが Phase 11 で実行され全 pass することを確認。

## 出力

- outputs/phase-09/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

テスト計画を実行可能な focused suite として固定する。

## 実行タスク

- retry tick focused tests を実装する。

## 参照資料

- `apps/api/src/workflows/tagQueueRetryTick.test.ts`

## 成果物/実行手順

- `outputs/phase-09/main.md`

## 統合テスト連携

- D1 fixture tests
