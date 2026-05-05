# task-issue-109-retry-tick-and-dlq-audit-001

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | task-issue-109-retry-tick-and-dlq-audit-001 |
| 分類 | implementation / scheduled workflow |
| 優先度 | 中 |
| ステータス | consumed_by_issue_377 |
| 発見元 | issue-109 UT-02A Phase 12 unassigned-task-detection |
| 後継 workflow | docs/30-workflows/issue-377-retry-tick-and-dlq-audit/ |

## 概要

`incrementRetry` / `moveToDlq` を呼び出す scheduled tick または queue consumer を実装し、DLQ 移送時に `admin.tag.queue_dlq_moved` 監査ログを残す。

## Consumed Status

2026-05-05 に `docs/30-workflows/issue-377-retry-tick-and-dlq-audit/` へ昇格し、scheduled cron 実装として消化済み。後継 workflow は `runTagQueueRetryTick`、`incrementRetryWithDlqAudit`、`moveToDlqWithAudit`、`TAG_QUEUE_TICK_CRON=*/5`、`admin.tag.queue_dlq_moved` audit を実装する。以後このファイルは再実装用 backlog ではなく、起票元トレースとして扱う。

## 苦戦箇所【記入必須】

UT-02A は repository contract を実装したが、運用 tick は実行環境・cron頻度・エラー分類が未確定のため分離した。repository だけでは retry / DLQ が自動発火しない。

## リスクと対策

| リスク | 対策 |
| --- | --- |
| cron が過剰に D1 writes を消費する | batch size / interval / maxRuntime を設定化する |
| DLQ 移送が監査されない | `admin.tag.queue_dlq_moved` を必須 assertion にする |

## 検証方法

- retryable error は `attempt_count` と `next_visible_at` を更新する。
- max retry 超過時は `status='dlq'` と audit が同時に記録される。

## スコープ

含む: retry tick workflow、DLQ audit、設定値、unit / D1 fixture test。
含まない: manual requeue API。
