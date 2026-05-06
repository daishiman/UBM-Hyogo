# Implementation Guide: Issue #401 admin resolve notification

## Part 1: 中学生レベルの説明

管理者が「この申請を認めます」または「今回は見送ります」と決めたあと、本人にお知らせメールを送る仕組みを作る。

たとえば、これは学校の先生が連絡帳を書く場面に似ている。先生はまず出席簿の記録をきちんと直す。そのあとで、連絡帳に「あとで家に知らせること」を書いておく。電話がつながらなくても、出席簿の記録まで元に戻ると困るから。

この仕様でも同じ考え方にする。管理者の処理は先に確実に終わらせる。そのあと「送るべきメールのリスト」に1件追加し、別の係が5分ごとに順番に送る。送れなかったときは少し待ってからもう一度試し、それでもだめなら「人が確認する箱」に入れる。

### むずかしい言葉の言い換え

| 用語 | 言い換え |
| --- | --- |
| outbox | 送る予定のメールリスト |
| dispatcher | メールを実際に送る係 |
| cron | 決まった時間ごとに動く係 |
| DLQ | 何度やってもだめだったものを入れる確認箱 |
| ledger | 何が起きたかを書く記録帳 |

## Part 2: 技術者向け

### Architecture

```text
POST /admin/requests/:noteId/resolve
  -> D1 batch: member_status / admin_member_notes / audit_log
  -> best-effort notification_outbox enqueue
  -> scheduled */5 tick
  -> claim pending rows or stale dispatching rows
  -> MailSender dispatch
  -> notification_ledger append
```

resolve transaction と notification enqueue は疎結合。enqueue / recipient lookup / provider failure は resolve transaction を rollback しない。

### Interfaces

```ts
type NotificationStatus = "pending" | "dispatching" | "sent" | "dlq";

interface NotificationOutboxRepository {
  enqueue(input: EnqueueNotificationInput): Promise<{ ok: boolean; notificationId?: string; reason?: "duplicate" | "db_error" }>;
  claimNextBatch(limit: number, nowIso: string, staleDispatchingBeforeIso?: string): Promise<NotificationOutboxRow[]>;
  markSent(notificationId: string, providerMessageId: string, nowIso: string): Promise<void>;
  markRetryableFailure(notificationId: string, error: string, nextAttemptAt: string, nowIso: string): Promise<void>;
  moveToDlq(notificationId: string, error: string, nowIso: string): Promise<void>;
  appendLedger(notificationId: string, eventType: NotificationStatus | "enqueued" | "failed", attempt: number, detailJson: string | null, nowIso: string): Promise<void>;
  findRecipientEmail(memberId: string): Promise<{ memberId: string; responseEmail: string } | null>;
}
```

### Runtime Path x Evidence

| Runtime path | Evidence |
| --- | --- |
| migration apply | `outputs/phase-11/migration-apply.log` |
| schema verification | `outputs/phase-11/schema-verification.log` |
| resolve enqueue | `outputs/phase-11/resolve-enqueue-evidence.log` |
| dispatch tick | `outputs/phase-11/dispatch-tick-evidence.log` |
| DLQ simulation | `outputs/phase-11/dlq-simulation.log` |
| template PII grep | `outputs/phase-11/template-grep-evidence.log` |
| secret readiness | `outputs/phase-11/secret-list-check.log` (`MAIL_PROVIDER_KEY` only, value omitted) |
| screenshots | N/A: `NON_VISUAL` task. Phase 11 uses D1/log/API evidence instead of screenshots. |

### State Machine

| From | Event | To |
| --- | --- | --- |
| `pending` | claim | `dispatching` |
| `dispatching` | success | `sent` |
| `dispatching` | retryable failure | `pending` |
| `dispatching` | non-retryable failure / max retries | `dlq` |

`failed` は ledger event only。outbox status には使わない。

### Parameters

| Name | Value |
| --- | --- |
| `batchSize` | `20` |
| `maxRetries` | `5` |
| `backoffSchedule` | `[30, 120, 600, 3600, 21600]` seconds |
| `claimLeaseSeconds` | `900` seconds |
| secret | `MAIL_PROVIDER_KEY` |
| from address | `MAIL_FROM_ADDRESS` (must be a provider-verified, non-placeholder sender; `.example` placeholders skip dispatch before claim) |

### Error Handling

- missing recipient email: enqueue skip + warning log, resolve remains success.
- missing or placeholder mail config: scheduled notification dispatch skips before claim, so pending rows are preserved.
- duplicate `(noteId, outcome)`: repository returns duplicate, no second email.
- stale `dispatching` row: lease timeout allows a later tick to reclaim the row.
- retryable provider/network error: status returns to `pending`.
- non-retryable 4xx or max retry reached: `dlq`.
- provider error body: reduced to error class before writing `last_error` / `notification_ledger.detail_json`.
- raw `resolutionNote`: not written to email, `notification_outbox.reason_summary`, or `notification_ledger.detail_json`.
