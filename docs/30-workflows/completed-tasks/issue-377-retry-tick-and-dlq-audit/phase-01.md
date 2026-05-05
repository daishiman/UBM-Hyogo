# Phase 1: 要件定義

## 目的

UT-02A repository contract（`incrementRetry` / `moveToDlq` / `listPending`）を runtime で駆動する operational tick の要件を確定する。

## 真の論点

- 駆動経路: Cloudflare scheduled cron か Cloudflare Queues の consumer か（free plan 制約・既存 cron との衝突回避を最重視）
- batch / interval / maxRuntime の妥当な既定値（D1 writes コストと滞留 SLA の両立）
- error 分類: retryable（D1 transient / network 一過性）vs non-retryable（validation / schema mismatch → 即 DLQ）
- DLQ audit の actor 値（system actor 表現）と target shape

## 4 条件評価

| 条件 | 内容 |
| --- | --- |
| 価値 | 不変条件 #5（audit 完備）・#13（queue lifecycle 完結性）の runtime 化 |
| 実現 | 既存 `scheduled` handler に分岐追加・既存 repository 関数を呼ぶだけ |
| 整合 | 既存 cron `*/15` `0 *` `0 18` と衝突しない 5 分粒度の追加 |
| 運用 | rollback は cron 削除 1 行 + 分岐削除のみ |

## 確定要件

- 駆動経路: **scheduled cron `*/5 * * * *`**（dev / staging のみ毎 5 分、production は free plan 制約評価のうえ最終 Phase 3 で確定。最大 cron 本数 3 本以内）
- batch size: 既定 20（`TAG_QUEUE_TICK_BATCH_SIZE`）
- maxRuntime: 既定 20000ms（`TAG_QUEUE_TICK_MAX_RUNTIME_MS`）
- DLQ 移送時の audit: `action='admin.tag.queue_dlq_moved'` / `actor_email='system@retry-tick'` / `target_type='tag_queue'` / `target_id=queueId` / `after_json={ attemptCount, lastError, dlqAt }`
- error 分類は Phase 8 で確定。既定は「ハンドラ呼出に成功しなかった例外は retryable、ビジネス validation 例外は non-retryable で即 DLQ」

## artifacts.json metadata

```json
{
  "taskType": "implementation",
  "visualEvidence": "NON_VISUAL",
  "workflow_state": "spec_created"
}
```

## AC（再掲）

index.md AC-1〜AC-10 を本 Phase で確定とする。

## 完了条件

- [ ] cron 経路 vs Queues 経路の比較を `outputs/phase-01/main.md` に記述。
- [ ] batch / maxRuntime / cron 既定値を確定。
- [ ] 不変条件 #5 / #13 との対応付けを記述。

## 出力

- outputs/phase-01/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 実行タスク

- retry tick 要件を実装済み状態へ同期する。

## 参照資料

- `index.md`
- `apps/api/src/workflows/tagQueueRetryTick.ts`

## 成果物/実行手順

- `outputs/phase-01/main.md`

## 統合テスト連携

- `apps/api/src/workflows/tagQueueRetryTick.test.ts`
