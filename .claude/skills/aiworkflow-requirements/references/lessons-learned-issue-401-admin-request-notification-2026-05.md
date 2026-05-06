# Issue #401 Admin Request Notification Lessons

## L-I401-001: notification enqueue は resolve transaction の外側に置く

`POST /admin/requests/:noteId/resolve` は `member_status` / `admin_member_notes` / `audit_log` を D1 batch で同一 workflow 境界に閉じる。notification enqueue を batch に含めると、mail provider 障害が resolve を rollback する。enqueue は batch 完了後に best-effort で `notification_outbox` に書き、失敗 / missing recipient は warning log のみで resolve 200 を維持する。

## L-I401-002: mail config gate は dispatch tick の claim 前に判定する

`MAIL_PROVIDER_KEY` 未設定や `.example` 末尾の placeholder sender で dispatch を実行すると、pending row が retry を消費して DLQ に流れる。dispatch tick は claim 前に config 健全性を判定し、未準備時は skip してログだけ残す。pending row は次の tick で reclaim される。

## L-I401-003: PII boundary を email / outbox / ledger の三方向に張る

raw `resolutionNote` は admin 自由記述の自由文。email 本文 / `notification_outbox.reason_summary` / `notification_ledger.detail_json` のいずれにもコピーしない。reject の reason は明示的に作る通知用 summary だけを使い、ledger は provider message id / sanitized error class / retryable のみ保存する。provider error body は `mail_provider_4xx` / `network_error` 等の error class に縮約する。

## L-I401-004: claim は CAS、unique 制約は (note_id, outcome)

claim は status `pending → dispatching` の atomic update で取得し、二重送信を防ぐ。同一 `noteId + outcome` の重複 enqueue は `UNIQUE(note_id, outcome)` で拒否する。lease timeout 後の stale `dispatching` row は別 claim で再取得できるようにする。

## L-I401-005: retryable failure は pending、failed は ledger event only

retryable failure（network / 5xx / rate limit）は `pending` に戻して `retry_count++` / `next_attempt_at` を更新する。non-retryable failure（4xx等）は `failed` ledger event を append し、`outbox.status` は遷移させない。max retry 到達は `dlq` に遷移し、人手 reconciliation の対象にする。

## L-I401-006: cron は既存 `*/5` branch に統合する

retry tick の cron 本数 parity（Issue #377 L-I377-003）を維持するため、新規 cron expression は追加せず、既存 `TAG_QUEUE_TICK_CRON=*/5` の scheduled handler 内で `Promise.allSettled` 並列実行する。tagQueue retry と独立した task 単位として log label / error 経路を分ける。

## L-I401-007: recipient lookup は `member_identities.response_email`

`response_email` は Google Form responder の system field。空 / NULL / row 不在は warning log のみで継続し、resolve は成功扱いにする。primary email を勝手に推定しない。

## L-I401-008: workflow root を completed-tasks 配下に置く

Phase 1-12 完了時点で workflow root を `docs/30-workflows/completed-tasks/issue-401-admin-request-notification/` に置く。skill index / quick-reference / resource-map / task-workflow-active / LOGS の path も `completed-tasks/` 込みで参照する。Phase 13 user approval / runtime evidence は別 gate として残し、status 表記は `implemented-local / runtime pending` のままにする。
