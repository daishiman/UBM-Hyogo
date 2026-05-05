# Unassigned Task Detection

| # | 項目 | 種別 | 現状 | 登録先候補 |
| --- | --- | --- | --- | --- |
| 1 | DLQ → queued の手動 requeue API | 機能未実装 | repository に `requeueFromDlq` なし | `docs/30-workflows/unassigned-task/task-issue-109-dlq-requeue-api-001.md` |
| 2 | retry workflow の自動 tick (cron / queue) | 機能未実装 | `incrementRetry` を呼び出す workflow が未配置 | `docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md` |
| 3 | DLQ 移送時の `admin.tag.queue_dlq_moved` audit | 機能未実装 | `incrementRetry`/`moveToDlq` から audit_log 書き込みなし | `docs/30-workflows/unassigned-task/task-issue-109-retry-tick-and-dlq-audit-001.md` |
| 4 | apps/api/src/repository/schemaDiffQueue.test.ts の既存 fail 2 件 | テスト品質 | 本タスク無関係 fail | `docs/30-workflows/unassigned-task/task-schema-diff-queue-faked1-compat-001.md` |
| 5 | `TAG_QUEUE_PAUSED` 緊急停止 flag | 運用 guard 未実装 | Phase 12/13 rollback note にのみ存在 | `docs/30-workflows/unassigned-task/task-issue-109-tag-queue-pause-flag-001.md` |
| 6 | memberTags.ts 直接書き込み（旧案） | 採用しない | 不変条件 #13 違反のため | — |
| 7 | 自己申告タグ UI | 採用しない | spec 11 / 不変条件 #13 で不採用 | — |
| 8 | DLQ 自動再投入 | 採用しない | 安全側で manual のみ | — |

## 0 件でない理由

本タスクは「Forms→tag 反映パイプラインの **左半分**」のみを担当しており、運用面の retry tick / DLQ requeue / pause flag は別タスクで扱う設計を採用したため、複数の formal な未割当が残る。spec 08/11/12 への idempotency / retry / DLQ 反映は同一 wave で完了済み。
