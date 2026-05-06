# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 前 Phase | 6 (実装後半) |
| 次 Phase | 8 (リファクタ) |
| 状態 | spec_created |

## 目的

AC-1〜AC-10 と実装ファイル / テストファイルの突合表を最終確定し、抜けがないことを検証する。

## マトリクス

| AC | 概要 | 実装ファイル | テストファイル | テストケース |
| --- | --- | --- | --- | --- |
| AC-1 | resolve 後 outbox 1 件 enqueue | `routes/admin/requests.ts` + `repository/notificationOutbox.ts` | `routes/admin/requests.test.ts` | "resolve approve enqueues notification with outcome=approved" |
| AC-2 | 同一 (noteId, outcome) 重複 enqueue 拒否 | `repository/notificationOutbox.ts` (UNIQUE 制約) | `repository/__tests__/notificationOutbox.test.ts` | "duplicate enqueue returns reason=duplicate" |
| AC-3 | enqueue 失敗が resolve を rollback しない | `routes/admin/requests.ts` (try/catch) | `routes/admin/requests.test.ts` | "enqueue throws but resolve returns 200 and request_status=resolved" |
| AC-4 | claim CAS で二重送信防止 | `repository/notificationOutbox.ts` (claimNextBatch) | `notificationOutbox.test.ts` | "claimNextBatch transitions pending→dispatching once" |
| AC-5 | 送信成功で sent + ledger | `workflows/notificationDispatchTick.ts` | `notificationDispatchTick.test.ts` | "successful dispatch marks sent and appends ledger" |
| AC-6 | 失敗時 retry_count++ + backoff + pending 復帰 | `workflows/notificationDispatchTick.ts` + `repository/notificationOutbox.ts` | `notificationDispatchTick.test.ts` / `notificationOutbox.test.ts` | "retryable failure increments retry_count, sets status=pending, and schedules backoff[0]=30s" |
| AC-7 | retry_count=5 で dlq + ledger | `workflows/notificationDispatchTick.ts` | `notificationDispatchTick.test.ts` | "fifth failure transitions to dlq with ledger event" |
| AC-8 | template に PII 生文字列なし | `services/notification/templates.ts` | `templates.test.ts` | "rejected template snapshot excludes raw resolutionNote" |
| AC-9 | sanitize: control strip + 200 truncate | `services/notification/templates.ts` | `templates.test.ts` | "sanitizeRejectionNote strips control chars and truncates to 200" |
| AC-10 | 既存 cron `*/5 * * * *` に統合 | `wrangler.toml` + `index.ts` | static check + `scheduled` handler test | "scheduled TAG_QUEUE_TICK_CRON invokes tag queue retry and notification dispatch without adding a fourth cron" |
| AC-11 | 宛先 email が取れない場合は enqueue せず resolve 成功 | `routes/admin/requests.ts` + `repository/notificationOutbox.ts` | `routes/admin/requests.test.ts` | "missing recipient email logs warning and resolve returns 200" |

## 抜けチェック

- [ ] 全 AC が「実装 + テスト」の両側に紐づいている
- [ ] sanitize ロジックが reject 時のみ呼ばれ、approve 時は呼ばれない（仕様）
- [ ] email / `notification_outbox.reason_summary` / `notification_ledger.detail_json` に raw `resolutionNote` を保存しない
- [ ] DLQ 遷移後の人手再投入手順は Phase 12 ドキュメントで記述（implementation guide）

## 成果物

- `outputs/phase-07/main.md`（マトリクス + 抜けチェック結果）

## 完了条件

- [ ] 全 AC が実装 + テストに割り当て済
- [ ] DLQ 再投入運用が Phase 12 タスクとして残っている

## 次 Phase

次: 8 (リファクタリング)。

## 実行タスク

1. AC と実装ファイルを突合する
2. AC とテストファイルを突合する

## 参照資料

- `phase-01.md`
- `phase-04.md`

## 統合テスト連携

Phase 9 の focused tests は本マトリクスを対象にする。
