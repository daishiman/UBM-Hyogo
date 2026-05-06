# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| 前 Phase | 1 (要件定義) |
| 次 Phase | 3 (アーキ確認) |
| 状態 | spec_created |

## 目的

schema / repository interface / dispatcher interface / template / cron 起動契約を実装着手可能なシグネチャとして固定する。

## D1 schema 設計（migration 0014）

ファイル: `apps/api/migrations/0014_notification_outbox.sql`

```sql
CREATE TABLE IF NOT EXISTS notification_outbox (
  notification_id     TEXT PRIMARY KEY,        -- ulid
  note_id             TEXT NOT NULL,           -- admin_member_notes.note_id への FK 相当（FK 制約は付けない: D1 運用方針）
  member_id           TEXT NOT NULL,
  recipient_email     TEXT NOT NULL,
  outcome             TEXT NOT NULL,           -- 'approved' | 'rejected'
  request_type        TEXT NOT NULL,           -- 'visibility_request' | 'delete_request'
  reason_summary      TEXT,                    -- 明示的な通知用 summary がある場合のみ使用。raw resolutionNote はコピーしない
  status              TEXT NOT NULL DEFAULT 'pending', -- pending | dispatching | sent | dlq
  retry_count         INTEGER NOT NULL DEFAULT 0,
  next_attempt_at     TEXT NOT NULL,           -- ISO8601
  last_error          TEXT,
  provider_message_id TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  UNIQUE (note_id, outcome)
);
CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending ON notification_outbox (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS notification_ledger (
  ledger_id        TEXT PRIMARY KEY,           -- ulid
  notification_id  TEXT NOT NULL,
  event_type       TEXT NOT NULL,              -- 'enqueued' | 'dispatching' | 'sent' | 'failed' | 'dlq'
  attempt          INTEGER NOT NULL,
  detail_json      TEXT,                       -- provider message id / error class / retryable 等の監査情報。PII 生文字列は入れない
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notification_ledger_notification ON notification_ledger (notification_id);
```

## Repository interface

ファイル: `apps/api/src/repository/notificationOutbox.ts`

```ts
export interface NotificationOutboxRow {
  notificationId: string;
  noteId: string;
  memberId: string;
  recipientEmail: string;
  outcome: "approved" | "rejected";
  requestType: "visibility_request" | "delete_request";
  reasonSummary: string | null;
  status: "pending" | "dispatching" | "sent" | "dlq";
  retryCount: number;
  nextAttemptAt: string;
  lastError: string | null;
  providerMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueNotificationInput {
  noteId: string;
  memberId: string;
  recipientEmail: string;
  outcome: "approved" | "rejected";
  requestType: "visibility_request" | "delete_request";
  reasonSummaryRaw?: string;   // raw resolutionNote は渡さない
  nowIso: string;
}

export interface NotificationOutboxRepository {
  enqueue(input: EnqueueNotificationInput): Promise<{ ok: boolean; notificationId?: string; reason?: "duplicate" | "db_error" }>;
  claimNextBatch(limit: number, nowIso: string, staleDispatchingBeforeIso?: string): Promise<NotificationOutboxRow[]>;  // pending/stale dispatching → dispatching CAS
  markSent(notificationId: string, providerMessageId: string, nowIso: string): Promise<void>;
  markRetryableFailure(notificationId: string, error: string, nextAttemptAt: string, nowIso: string): Promise<void>;
  moveToDlq(notificationId: string, error: string, nowIso: string): Promise<void>;
  appendLedger(notificationId: string, eventType: NotificationOutboxRow["status"] | "enqueued" | "failed", attempt: number, detailJson: string | null, nowIso: string): Promise<void>;
  findRecipientEmail(memberId: string): Promise<{ memberId: string; responseEmail: string } | null>;
}
```

retry state machine:

| 現状態 | イベント | 次状態 | 備考 |
| --- | --- | --- | --- |
| `pending` | `claimNextBatch(now)` | `dispatching` | `next_attempt_at <= now` の行だけを CAS で取得 |
| `dispatching` | `claimNextBatch(now, staleBefore)` | `dispatching` | lease timeout を過ぎた stuck row を再取得 |
| `dispatching` | provider success | `sent` | `notification_ledger.event_type='sent'` |
| `dispatching` | retryable failure and `retry_count + 1 < maxRetries` | `pending` | `retry_count++`, `next_attempt_at` を backoff 後に更新。`failed` は ledger event_type としてのみ使い、outbox 再取得不能状態にしない |
| `dispatching` | non-retryable failure or `retry_count + 1 >= maxRetries` | `dlq` | `notification_ledger.event_type='dlq'` |
| `sent` / `dlq` | any dispatch tick | 変更なし | terminal |

`notification_outbox.status='failed'` は使わない。失敗履歴は `notification_ledger.event_type='failed'` で表現する。

## Dispatcher service

ファイル: `apps/api/src/services/notification/dispatcher.ts`

```ts
import type { MailSender, MailMessage } from "../mail/magic-link-mailer";
import type { NotificationOutboxRow } from "../../repository/notificationOutbox";

export interface DispatchResult {
  ok: boolean;
  providerMessageId?: string;
  errorMessage?: string;
  retryable: boolean;       // 4xx → false, 5xx/network → true
}

export interface NotificationDispatcher {
  dispatch(row: NotificationOutboxRow): Promise<DispatchResult>;
}

export const createMailDispatcher = (params: {
  mailSender: MailSender;
  fromAddress: string;
  buildMessage: (row: NotificationOutboxRow, fromAddress: string) => MailMessage;
}): NotificationDispatcher;
```

env / provider 境界:

- provider credential は 05b-A 正本に合わせて `MAIL_PROVIDER_KEY`（Cloudflare Secret）を使う。旧 `RESEND_API_KEY` は新規 provisioning 禁止の stale 名なので使わない。
- sender address は `MAIL_FROM_ADDRESS`（Cloudflare Variable）を使う。旧 `RESEND_FROM_EMAIL` は使わない。
- 実装上 Resend SDK を使う場合も、外部に出す契約名は `MailSender` + `MAIL_PROVIDER_KEY` に閉じる。

## Template service

ファイル: `apps/api/src/services/notification/templates.ts`

```ts
export const sanitizeRejectionNote = (raw: string | null | undefined): string => {
  // 制御文字除去 + 200 char truncate + trim
};

export const buildApprovedMessage = (params: {
  to: string;
  from: string;
  requestType: "visibility_request" | "delete_request";
}): MailMessage;

export const buildRejectedMessage = (params: {
  to: string;
  from: string;
  requestType: "visibility_request" | "delete_request";
  reasonSummary: string | null;  // sanitize 済
}): MailMessage;
```

## Workflow（cron tick）

ファイル: `apps/api/src/workflows/notificationDispatchTick.ts`

```ts
export interface DispatchTickDeps {
  outbox: NotificationOutboxRepository;
  dispatcher: NotificationDispatcher;
  now: () => Date;
  batchSize: number;          // default 20
  maxRetries: number;         // default 5
  backoffSchedule: number[];  // [30, 120, 600, 3600, 21600] seconds
}

export const runNotificationDispatchTick = async (deps: DispatchTickDeps): Promise<{
  claimed: number;
  sent: number;
  failed: number;
  dlq: number;
}>;
```

## Resolve route 統合

ファイル: `apps/api/src/routes/admin/requests.ts`（既存ファイル編集）

resolve API のレスポンス return 直前で best-effort enqueue を呼ぶ。宛先は handler 内の架空 `member` 変数に依存せず、repository/helper で `member_identities.response_email` を取得する:

```ts
// resolve transaction が成功した後
try {
  const recipient = await outboxRepo.findRecipientEmail(note.memberId);
  if (!recipient) {
    c.env.LOGGER?.warn?.("notification_enqueue_skipped", {
      noteId: note.noteId,
      reason: "missing_email",
    });
  } else {
    await outboxRepo.enqueue({
      noteId: note.noteId,
      memberId: note.memberId,
      recipientEmail: recipient.responseEmail,
      outcome: resolution === "approve" ? "approved" : "rejected",
      requestType: note.noteType,
      reasonSummaryRaw: null,
      nowIso,
    });
  }
} catch (e) {
  c.env.LOGGER?.warn?.("notification_enqueue_failed", { noteId: note.noteId, error: String(e) });
  // resolve は成功として返す（AC-3）
}
```

取得元は `member_identities.response_email` とする。空文字 / NULL / member 不在は enqueue せず warning log のみを残し、resolve result は成功として返す。

## Cron trigger

ファイル: `apps/api/wrangler.toml`（既存ファイル編集）

既存 `*/5 * * * *` は tag queue retry tick と共有するため、新しい cron expression は追加しない。`wrangler.toml` の top-level / staging / production triggers は現行の `["0 18 * * *", "*/15 * * * *", "*/5 * * * *"]` を維持し、`*/5` branch 内で tag queue retry と notification dispatch を task 単位に `Promise.allSettled` で実行する。

scheduled handler（`apps/api/src/index.ts` の `scheduled`）で `runNotificationDispatchTick` を呼ぶ分岐を追加。

既存 scheduled task（Forms sync / tag queue retry 等）がある場合は、`scheduled()` 内で順次呼び出す。1 つの cron trigger を複数 worker に分けず、失敗ログと戻り値を task 単位に分けて記録する。

## 成果物

- `outputs/phase-02/main.md`（schema DDL / interface / 配信契約サマリ）

## 完了条件

- [ ] migration DDL が固定されている
- [ ] repository interface のシグネチャが固定されている
- [ ] dispatcher / template / workflow の interface が固定されている
- [ ] resolve route の enqueue 呼出箇所が決まっている
- [ ] cron trigger の登録方式が決まっている

## 次 Phase

次: 3 (アーキ確認)。不変条件・疎結合・既存システムへの影響を確認する。

## 実行タスク

1. D1 schema / repository / dispatcher / cron 契約を固定する
2. recipient lookup と retry state machine を固定する

## 参照資料

- `apps/api/src/routes/admin/requests.ts`
- `apps/api/src/index.ts`
- `.claude/skills/aiworkflow-requirements/references/api-endpoints.md`

## 統合テスト連携

Phase 4 の test matrix で本 Phase の契約を検証する。
