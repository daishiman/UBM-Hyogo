# Issue #377 Retry Tick + DLQ Audit Lessons

## L-I377-001: human-review queue と machine-retry queue を分ける

`status='queued'` だけを retry tick 対象にすると、管理者レビュー待ち行を機械処理してしまう。retry tick は `reason='retry_tick'` / `attempt_count > 0` / `last_error IS NOT NULL` / `next_visible_at IS NOT NULL` のいずれかで対象を絞る。

## L-I377-002: DLQ state と audit は同じ wave で書く

DLQ 更新後に audit insert が失敗すると、次回 tick では `status='dlq'` が `listPending` から外れ、監査欠落を回復できない。DLQ 移送と `admin.tag.queue_dlq_moved` audit は同じ D1 batch で扱う。

## L-I377-003: cron 追加は全 env の本数 parity を見る

production だけでなく top-level / staging も Cloudflare cron trigger 本数を3以内に維持する。retry tick 追加時は legacy Sheets hourly cron を手動限定に寄せた。

## L-I377-004: NON_VISUAL evidence は focused suite から始める

Cron runtime は deploy/tail が user-gated のため、まず D1 fixture の focused Vitest で retry / DLQ / audit / timeout / skip を固定する。

## L-I377-005: default scheduled path を必ずテストする

injected `processRow` が throw するテストだけでは、本番 cron が呼ぶ `runTagQueueRetryTick(env)` の挙動を証明できない。Issue #377 の初回実装では valid JSON row が default processor で `noop` になり、retry/DLQ が進まなかった。dependency injection なしの default scheduled path test を Phase 9 / 11 に必ず置く。

## L-I377-006: retry/DLQ SQL は repository primitive に寄せる

workflow 層で `attempt_count` / `next_visible_at` / `dlq_at` の SQL を複製すると、`TAG_QUEUE_MAX_RETRY` や audit taxonomy の変更時に drift する。DLQ audit atomicity が必要な場合は `incrementRetryWithDlqAudit` / `moveToDlqWithAudit` のように repository primitive を拡張し、workflow はそれを呼ぶ。

## L-I377-007: tag queue audit target_type は `tag_queue`

既存 resolve/reject audit は `target_type='tag_queue'` を使う。DLQ 移送だけ `tag_assignment_queue` にすると admin audit filter が同一ドメインを分断するため、`admin.tag.queue_dlq_moved` も `target_type='tag_queue'` に統一する。
