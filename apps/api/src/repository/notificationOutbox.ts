// Issue #401: notification outbox + ledger repository
//
// 不変条件 #5: D1 アクセスは apps/api 内に閉じる。
//
// state machine:
//   pending → dispatching (claim CAS)
//   dispatching → sent (markSent)
//   dispatching → pending (markRetryableFailure: retry_count++ / next_attempt_at)
//   dispatching → dlq    (moveToDlq)
//
// 失敗履歴は notification_ledger.event_type='failed' で表現する
// (outbox.status='failed' は使わず、再取得可能な pending に戻す)。

import type { DbCtx } from "./_shared/db";

export type NotificationOutcome = "approved" | "rejected";
export type NotificationRequestType = "visibility_request" | "delete_request";
export type NotificationOutboxStatus = "pending" | "dispatching" | "sent" | "dlq";
export type NotificationLedgerEvent =
  | "enqueued"
  | "dispatching"
  | "sent"
  | "failed"
  | "dlq";

export interface NotificationOutboxRow {
  notificationId: string;
  noteId: string;
  memberId: string;
  recipientEmail: string;
  outcome: NotificationOutcome;
  requestType: NotificationRequestType;
  reasonSummary: string | null;
  status: NotificationOutboxStatus;
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
  outcome: NotificationOutcome;
  requestType: NotificationRequestType;
  reasonSummaryRaw?: string | null;
  nowIso: string;
}

export interface EnqueueResult {
  ok: boolean;
  notificationId?: string;
  reason?: "duplicate" | "db_error";
}

export interface NotificationOutboxRepository {
  enqueue(input: EnqueueNotificationInput): Promise<EnqueueResult>;
  claimNextBatch(
    limit: number,
    nowIso: string,
    staleDispatchingBeforeIso?: string,
  ): Promise<NotificationOutboxRow[]>;
  markSent(
    notificationId: string,
    providerMessageId: string,
    nowIso: string,
  ): Promise<void>;
  markRetryableFailure(
    notificationId: string,
    error: string,
    nextAttemptAt: string,
    nowIso: string,
  ): Promise<void>;
  moveToDlq(
    notificationId: string,
    error: string,
    nowIso: string,
  ): Promise<void>;
  appendLedger(
    notificationId: string,
    eventType: NotificationLedgerEvent,
    attempt: number,
    detailJson: string | null,
    nowIso: string,
  ): Promise<void>;
  findRecipientEmail(
    memberId: string,
  ): Promise<{ memberId: string; responseEmail: string } | null>;
}

export interface CreateOutboxRepositoryDeps {
  newId?: () => string;
}

const CONTROL_CHAR_RE = /[\x00-\x08\x0B-\x1F\x7F]/g;
export const sanitizeReasonSummary = (
  raw: string | null | undefined,
): string | null => {
  if (raw === null || raw === undefined) return null;
  const cleaned = raw.replace(CONTROL_CHAR_RE, "").trim().slice(0, 200);
  return cleaned.length > 0 ? cleaned : null;
};

interface RawOutboxRow {
  notification_id: string;
  note_id: string;
  member_id: string;
  recipient_email: string;
  outcome: string;
  request_type: string;
  reason_summary: string | null;
  status: string;
  retry_count: number;
  next_attempt_at: string;
  last_error: string | null;
  provider_message_id: string | null;
  created_at: string;
  updated_at: string;
}

const toRow = (r: RawOutboxRow): NotificationOutboxRow => ({
  notificationId: r.notification_id,
  noteId: r.note_id,
  memberId: r.member_id,
  recipientEmail: r.recipient_email,
  outcome: r.outcome as NotificationOutcome,
  requestType: r.request_type as NotificationRequestType,
  reasonSummary: r.reason_summary,
  status: r.status as NotificationOutboxStatus,
  retryCount: Number(r.retry_count),
  nextAttemptAt: r.next_attempt_at,
  lastError: r.last_error,
  providerMessageId: r.provider_message_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const SELECT_COLS =
  "notification_id, note_id, member_id, recipient_email, outcome, request_type, reason_summary, status, retry_count, next_attempt_at, last_error, provider_message_id, created_at, updated_at";

export const createOutboxRepository = (
  c: DbCtx,
  deps: CreateOutboxRepositoryDeps = {},
): NotificationOutboxRepository => {
  const newId = deps.newId ?? (() => crypto.randomUUID());
  return {
    async enqueue(input) {
      const notificationId = newId();
      const reasonSummary = sanitizeReasonSummary(input.reasonSummaryRaw ?? null);
      try {
        const insertOutbox = c.db.prepare(
            `INSERT INTO notification_outbox
              (notification_id, note_id, member_id, recipient_email, outcome, request_type,
               reason_summary, status, retry_count, next_attempt_at, last_error,
               provider_message_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'pending', 0, ?8, NULL, NULL, ?9, ?10)`,
          )
          .bind(
            notificationId,
            input.noteId,
            input.memberId,
            input.recipientEmail,
            input.outcome,
            input.requestType,
            reasonSummary,
            input.nowIso,
            input.nowIso,
            input.nowIso,
          );
        const insertLedger = c.db.prepare(
            `INSERT INTO notification_ledger (ledger_id, notification_id, event_type, attempt, detail_json, created_at)
             VALUES (?1, ?2, 'enqueued', 0, NULL, ?3)`,
          )
          .bind(newId(), notificationId, input.nowIso);
        const results = await (
          c.db as D1Database & {
            batch: (statements: D1PreparedStatement[]) => Promise<D1Result[]>;
          }
        ).batch([insertOutbox, insertLedger] as unknown as D1PreparedStatement[]);
        if (results.some((result) => !result.success)) {
          return { ok: false, reason: "db_error" };
        }
        return { ok: true, notificationId };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("UNIQUE constraint") ||
          msg.includes("constraint failed")
        ) {
          return { ok: false, reason: "duplicate" };
        }
        return { ok: false, reason: "db_error" };
      }
    },

    async claimNextBatch(limit, nowIso, staleDispatchingBeforeIso) {
      // CAS: pending → dispatching を 1 文で実行する。
      // D1 の RETURNING に対応するため UPDATE ... WHERE notification_id IN (SELECT ...) RETURNING * を使う。
      // worker crash 等で dispatching のまま残った行は lease timeout 後に再 claim する。
      const staleBefore = staleDispatchingBeforeIso ?? null;
      const result = await c.db
        .prepare(
          `UPDATE notification_outbox
              SET status = 'dispatching',
                  updated_at = ?1
            WHERE notification_id IN (
              SELECT notification_id FROM notification_outbox
               WHERE (
                   status = 'pending'
                   AND next_attempt_at <= ?2
                 )
                  OR (
                   status = 'dispatching'
                   AND updated_at <= ?4
                 )
               ORDER BY next_attempt_at ASC
               LIMIT ?3
            )
            RETURNING ${SELECT_COLS}`,
        )
        .bind(nowIso, nowIso, limit, staleBefore)
        .all<RawOutboxRow>();
      return (result.results ?? []).map(toRow);
    },

    async markSent(notificationId, providerMessageId, nowIso) {
      await c.db
        .prepare(
          `UPDATE notification_outbox
              SET status = 'sent',
                  provider_message_id = ?1,
                  last_error = NULL,
                  updated_at = ?2
            WHERE notification_id = ?3`,
        )
        .bind(providerMessageId, nowIso, notificationId)
        .run();
    },

    async markRetryableFailure(notificationId, error, nextAttemptAt, nowIso) {
      await c.db
        .prepare(
          `UPDATE notification_outbox
              SET status = 'pending',
                  retry_count = retry_count + 1,
                  last_error = ?1,
                  next_attempt_at = ?2,
                  updated_at = ?3
            WHERE notification_id = ?4`,
        )
        .bind(error, nextAttemptAt, nowIso, notificationId)
        .run();
    },

    async moveToDlq(notificationId, error, nowIso) {
      await c.db
        .prepare(
          `UPDATE notification_outbox
              SET status = 'dlq',
                  retry_count = retry_count + 1,
                  last_error = ?1,
                  updated_at = ?2
            WHERE notification_id = ?3`,
        )
        .bind(error, nowIso, notificationId)
        .run();
    },

    async appendLedger(notificationId, eventType, attempt, detailJson, nowIso) {
      await c.db
        .prepare(
          `INSERT INTO notification_ledger (ledger_id, notification_id, event_type, attempt, detail_json, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(newId(), notificationId, eventType, attempt, detailJson, nowIso)
        .run();
    },

    async findRecipientEmail(memberId) {
      const row = await c.db
        .prepare(
          `SELECT member_id AS memberId, response_email AS responseEmail
             FROM member_identities
            WHERE member_id = ?1`,
        )
        .bind(memberId)
        .first<{ memberId: string; responseEmail: string | null }>();
      if (!row) return null;
      const email = row.responseEmail;
      if (!email || email.trim().length === 0) return null;
      return { memberId: row.memberId, responseEmail: email };
    },
  };
};
