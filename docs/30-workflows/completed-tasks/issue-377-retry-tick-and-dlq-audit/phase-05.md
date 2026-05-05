# Phase 5: データモデル / constants

## 既存テーブル（変更なし）

- `tag_assignment_queue`: `incrementRetry` / `moveToDlq` が UPDATE する。スキーマ変更なし。
- `audit_log`: `admin.tag.queue_dlq_moved` を INSERT する。スキーマ変更なし。

## 追加 constants

```ts
// apps/api/src/repository/tagQueue.ts に追記
export const TAG_QUEUE_TICK_BATCH_SIZE = 20;
export const TAG_QUEUE_TICK_MAX_RUNTIME_MS = 20_000;
export const TAG_QUEUE_TICK_CRON = "*/5 * * * *";
```

## audit action brand 利用

```ts
// apps/api/src/repository/_shared/brand.ts
// repository 専用 brand helper として auditAction("admin.tag.queue_dlq_moved") を利用
```

## 設定値の根拠

| 値 | 根拠 |
| --- | --- |
| BATCH_SIZE = 20 | D1 free plan の write QPS（~5/s）* maxRuntime 20s で安全に処理可能な上限 |
| MAX_RUNTIME_MS = 20000 | Cloudflare Workers cron の CPU time 上限 30s に対し 10s マージン |
| CRON = `*/5 * * * *` | 滞留 SLA 5 分（max retry 3 + backoff 30s/60s/120s で完結） |

## 完了条件

- [ ] 上記 3 constants の export と auditAction 利用が `outputs/phase-05/main.md` に確定。
- [ ] DB スキーマ変更が無いことを明記。

## 出力

- outputs/phase-05/main.md

## メタ情報

- taskType: implementation
- visualEvidence: NON_VISUAL

## 目的

DB 変更なしで constants と audit action を運用可能にする。

## 実行タスク

- retry tick constants を追加する。

## 参照資料

- `apps/api/src/repository/tagQueue.ts`

## 成果物/実行手順

- `outputs/phase-05/main.md`

## 統合テスト連携

- constants 経由の focused test
