# Implementation Guide

## Part 1: 中学生レベル

### 何を直したか

タグ候補の行には「あとでもう一度試すべき失敗」と「管理者が見るだけの待ち行」があります。この仕組みは、前者だけを5分ごとに確認します。まだ直らない失敗は回数を増やして少し待ち、上限を超えたら DLQ という保留棚へ移します。DLQ に移した時は、あとから確認できるように監査ログも必ず残します。

### 用語

| 用語 | 意味 |
| --- | --- |
| retry tick | 5分ごとに「もう一度試すべき行」を見に行く係 |
| DLQ | 何度試しても失敗した行を置く保留棚 |
| audit | 誰が何をしたかを後から確認できる記録 |
| human-review queue | 人が確認するための待ち行。機械が勝手に処理しない |

### なぜ必要か

前は「失敗したら次にどう進めるか」を動かす係がありませんでした。そのため、失敗したタグ候補がずっと同じ場所に残る可能性がありました。今回の修正で、失敗行は少し待って再試行され、上限を超えたらDLQへ移り、監査ログも残ります。

### セルフチェック

- 人が見るだけの行は処理しない。
- 失敗行は既存のrepository関数で再試行回数を増やす。
- DLQへ移した行は必ず `admin.tag.queue_dlq_moved` として記録する。
- 画面変更はないため、スクリーンショットは不要。

## Part 2: 技術者レベル

- `TAG_QUEUE_TICK_CRON = "*/5 * * * *"` を追加し、Worker scheduled handler から `runTagQueueRetryTick` を呼ぶ。
- retry tick は `reason='retry_tick'`、`attempt_count > 0`、`last_error IS NOT NULL`、`next_visible_at IS NOT NULL` のいずれかを満たす行だけを retry 対象にする。
- plain `queued` 行は admin review queue として扱い、tick では skip する。
- retryable row は `incrementRetryWithDlqAudit` 経由で exponential backoff の `attempt_count` / `next_visible_at` を更新する。workflow 側で retry SQL を重複実装しない。
- max retry 超過または `NonRetryableTagQueueError` は `status='dlq'` へ移し、`admin.tag.queue_dlq_moved` audit を `target_type='tag_queue'` として同じ D1 batch で書く。
- staging / production / top-level triggers は3本以内にそろえ、legacy Sheets hourly cron は手動限定へ寄せた。

## Evidence / Visual Boundary

This task is `implementation / NON_VISUAL`. No `apps/web` files changed, no browser route changed, and no screenshot is required. Phase 11 evidence is command/test output plus D1 row assertions.
