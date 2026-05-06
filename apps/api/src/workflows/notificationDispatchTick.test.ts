// @vitest-environment node
// Issue #401: notification dispatch tick tests
import { describe, it, expect } from "vitest";
import {
  runNotificationDispatchTick,
  DEFAULT_BACKOFF_SCHEDULE,
} from "./notificationDispatchTick";
import type {
  NotificationOutboxRepository,
  NotificationOutboxRow,
} from "../repository/notificationOutbox";
import type {
  DispatchResult,
  NotificationDispatcher,
} from "../services/notification/dispatcher";

interface FakeOutboxState {
  rows: NotificationOutboxRow[];
  ledger: Array<{
    notificationId: string;
    eventType: string;
    attempt: number;
    detail: unknown;
  }>;
}

const makeRow = (override: Partial<NotificationOutboxRow> = {}): NotificationOutboxRow => ({
  notificationId: "nid_1",
  noteId: "note_1",
  memberId: "m_1",
  recipientEmail: "u@example.com",
  outcome: "approved",
  requestType: "visibility_request",
  reasonSummary: null,
  status: "dispatching",
  retryCount: 0,
  nextAttemptAt: "2026-05-06T00:00:00Z",
  lastError: null,
  providerMessageId: null,
  createdAt: "2026-05-06T00:00:00Z",
  updatedAt: "2026-05-06T00:00:00Z",
  ...override,
});

const makeFakeOutbox = (rows: NotificationOutboxRow[]): {
  outbox: NotificationOutboxRepository;
  state: FakeOutboxState;
} => {
  const state: FakeOutboxState = { rows: [...rows], ledger: [] };
  const outbox: NotificationOutboxRepository = {
    async enqueue() {
      return { ok: false, reason: "db_error" };
    },
    async claimNextBatch() {
      const claimed = state.rows.filter((r) => r.status === "dispatching");
      return claimed;
    },
    async markSent(id, providerMessageId) {
      const r = state.rows.find((x) => x.notificationId === id);
      if (r) {
        r.status = "sent";
        r.providerMessageId = providerMessageId;
      }
    },
    async markRetryableFailure(id, error, nextAttemptAt) {
      const r = state.rows.find((x) => x.notificationId === id);
      if (r) {
        r.status = "pending";
        r.retryCount += 1;
        r.lastError = error;
        r.nextAttemptAt = nextAttemptAt;
      }
    },
    async moveToDlq(id, error) {
      const r = state.rows.find((x) => x.notificationId === id);
      if (r) {
        r.status = "dlq";
        r.lastError = error;
        r.retryCount += 1;
      }
    },
    async appendLedger(notificationId, eventType, attempt, detailJson) {
      state.ledger.push({
        notificationId,
        eventType,
        attempt,
        detail: detailJson ? JSON.parse(detailJson) : null,
      });
    },
    async findRecipientEmail() {
      return null;
    },
  };
  return { outbox, state };
};

const makeDispatcher = (results: DispatchResult[]): NotificationDispatcher => {
  let i = 0;
  return {
    async dispatch() {
      const r = results[i++];
      if (!r) throw new Error("dispatcher called more times than results provided");
      return r;
    },
  };
};

const FIXED_NOW = new Date("2026-05-06T12:00:00Z");

describe("runNotificationDispatchTick", () => {
  it("AC-5: 送信成功 → status='sent' + ledger 'sent' (with providerMessageId)", async () => {
    const { outbox, state } = makeFakeOutbox([makeRow()]);
    const dispatcher = makeDispatcher([
      { ok: true, providerMessageId: "msg_abc", retryable: false },
    ]);
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 1, sent: 1, failed: 0, dlq: 0 });
    expect(state.rows[0]!.status).toBe("sent");
    expect(state.rows[0]!.providerMessageId).toBe("msg_abc");
    expect(state.ledger).toHaveLength(2);
    expect(state.ledger[0]!.eventType).toBe("dispatching");
    expect(state.ledger[1]!.eventType).toBe("sent");
    expect(state.ledger[1]!.attempt).toBe(1);
  });

  it("AC-6: retryable 失敗 → retry_count++, status='pending', backoff[0]=30s", async () => {
    const { outbox, state } = makeFakeOutbox([makeRow({ retryCount: 0 })]);
    const dispatcher = makeDispatcher([
      { ok: false, errorMessage: "5xx upstream", retryable: true },
    ]);
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 1, sent: 0, failed: 1, dlq: 0 });
    expect(state.rows[0]!.status).toBe("pending");
    expect(state.rows[0]!.retryCount).toBe(1);
    const expectedNext = new Date(
      FIXED_NOW.getTime() + DEFAULT_BACKOFF_SCHEDULE[0]! * 1000,
    ).toISOString();
    expect(state.rows[0]!.nextAttemptAt).toBe(expectedNext);
    expect(state.ledger.map((x) => x.eventType)).toEqual(["dispatching", "failed"]);
  });

  it("AC-7: retry_count=4 + retryable 失敗 → 5回目で dlq + ledger 'dlq'", async () => {
    const { outbox, state } = makeFakeOutbox([makeRow({ retryCount: 4 })]);
    const dispatcher = makeDispatcher([
      { ok: false, errorMessage: "5xx upstream", retryable: true },
    ]);
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 1, sent: 0, failed: 0, dlq: 1 });
    expect(state.rows[0]!.status).toBe("dlq");
    expect(state.ledger.map((x) => x.eventType)).toEqual(["dispatching", "dlq"]);
    expect(state.ledger[1]!.attempt).toBe(5);
  });

  it("AC-7: non-retryable 失敗は 1 回目でも dlq", async () => {
    const { outbox, state } = makeFakeOutbox([makeRow({ retryCount: 0 })]);
    const dispatcher = makeDispatcher([
      { ok: false, errorMessage: "mail_provider_400: bad request", retryable: false },
    ]);
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 1, sent: 0, failed: 0, dlq: 1 });
    expect(state.rows[0]!.status).toBe("dlq");
    expect(state.ledger.map((x) => x.eventType)).toEqual(["dispatching", "dlq"]);
  });

  it("複数 row を順次処理し sent / failed / dlq を集計", async () => {
    const rows = [
      makeRow({ notificationId: "nid_a" }),
      makeRow({ notificationId: "nid_b" }),
      makeRow({ notificationId: "nid_c", retryCount: 4 }),
    ];
    const { outbox } = makeFakeOutbox(rows);
    const dispatcher = makeDispatcher([
      { ok: true, providerMessageId: "msg_a", retryable: false },
      { ok: false, errorMessage: "5xx", retryable: true },
      { ok: false, errorMessage: "5xx", retryable: true },
    ]);
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 3, sent: 1, failed: 1, dlq: 1 });
  });

  it("dispatcher throw は sanitized error で retryable failure として pending に戻す", async () => {
    const { outbox, state } = makeFakeOutbox([makeRow()]);
    const dispatcher: NotificationDispatcher = {
      async dispatch() {
        throw new Error("network ECONNRESET recipient=u@example.com");
      },
    };
    const result = await runNotificationDispatchTick({
      outbox,
      dispatcher,
      now: () => FIXED_NOW,
    });
    expect(result).toEqual({ claimed: 1, sent: 0, failed: 1, dlq: 0 });
    expect(state.rows[0]!.status).toBe("pending");
    expect(state.rows[0]!.lastError).toBe("network_error");
    expect(state.ledger[1]!.detail).toMatchObject({ error: "network_error" });
  });
});
