// @vitest-environment node
// Issue #401: notification outbox repository tests
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  createOutboxRepository,
  sanitizeReasonSummary,
  type NotificationOutboxRepository,
} from "../notificationOutbox";

const seedMember = async (env: InMemoryD1, memberId: string, email: string | null) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?3, ?4, ?4, ?4)`,
    )
    .bind(memberId, email, `resp_${memberId}`, "2026-04-01T00:00:00Z")
    .run();
};

describe("notificationOutbox repository", () => {
  let env: InMemoryD1;
  let repo: NotificationOutboxRepository;
  beforeEach(async () => {
    env = await setupD1();
    let counter = 0;
    repo = createOutboxRepository(env.ctx, {
      newId: () => `nid_${++counter}`,
    });
  });

  it("AC-1: enqueue が pending row を作成し ledger に enqueued を記録", async () => {
    const r = await repo.enqueue({
      noteId: "note_1",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    expect(r.ok).toBe(true);
    expect(r.notificationId).toBe("nid_1");

    const row = await env.db
      .prepare("SELECT status, retry_count, recipient_email, outcome FROM notification_outbox WHERE notification_id = ?1")
      .bind("nid_1")
      .first<{ status: string; retry_count: number; recipient_email: string; outcome: string }>();
    expect(row?.status).toBe("pending");
    expect(row?.retry_count).toBe(0);
    expect(row?.recipient_email).toBe("u@example.com");
    expect(row?.outcome).toBe("approved");

    const ledger = await env.db
      .prepare("SELECT event_type, attempt FROM notification_ledger WHERE notification_id = ?1")
      .bind("nid_1")
      .all<{ event_type: string; attempt: number }>();
    expect(ledger.results).toHaveLength(1);
    expect(ledger.results[0]!.event_type).toBe("enqueued");
  });

  it("AC-2: 同一 (noteId, outcome) の二度目 enqueue は duplicate を返す", async () => {
    const input = {
      noteId: "note_dup",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved" as const,
      requestType: "visibility_request" as const,
      nowIso: "2026-05-06T00:00:00Z",
    };
    const first = await repo.enqueue(input);
    expect(first.ok).toBe(true);
    const second = await repo.enqueue(input);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe("duplicate");
  });

  it("AC-9: reasonSummary は sanitize される (制御文字除去 + 200 char truncate)", async () => {
    const longRaw = "abcdef\n\nghi" + "x".repeat(300);
    await repo.enqueue({
      noteId: "note_san",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "rejected",
      requestType: "delete_request",
      reasonSummaryRaw: longRaw,
      nowIso: "2026-05-06T00:00:00Z",
    });
    const row = await env.db
      .prepare("SELECT reason_summary FROM notification_outbox WHERE note_id = ?1")
      .bind("note_san")
      .first<{ reason_summary: string }>();
    expect(row?.reason_summary).toBeTruthy();
    expect(row?.reason_summary.length).toBeLessThanOrEqual(200);
    expect(row?.reason_summary).not.toContain("");
  });

  it("AC-4: claimNextBatch は pending → dispatching の CAS で二度目は同 row を返さない", async () => {
    await repo.enqueue({
      noteId: "note_a",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    const first = await repo.claimNextBatch(10, "2026-05-06T00:00:01Z");
    expect(first).toHaveLength(1);
    expect(first[0]!.status).toBe("dispatching");
    const second = await repo.claimNextBatch(10, "2026-05-06T00:00:02Z");
    expect(second).toHaveLength(0);
  });

  it("claimNextBatch は next_attempt_at が未来の row を取得しない", async () => {
    await repo.enqueue({
      noteId: "note_future",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:10:00Z",
    });
    // claim with now < next_attempt_at
    const claimed = await repo.claimNextBatch(10, "2026-05-06T00:05:00Z");
    expect(claimed).toHaveLength(0);
  });

  it("stale dispatching row は lease timeout 後に再 claim できる", async () => {
    await repo.enqueue({
      noteId: "note_stale",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    const first = await repo.claimNextBatch(10, "2026-05-06T00:00:01Z");
    expect(first).toHaveLength(1);

    const tooEarly = await repo.claimNextBatch(
      10,
      "2026-05-06T00:05:00Z",
      "2026-05-05T23:59:59Z",
    );
    expect(tooEarly).toHaveLength(0);

    const reclaimed = await repo.claimNextBatch(
      10,
      "2026-05-06T00:20:00Z",
      "2026-05-06T00:10:00Z",
    );
    expect(reclaimed).toHaveLength(1);
    expect(reclaimed[0]!.notificationId).toBe(first[0]!.notificationId);
  });

  it("markSent は status='sent' + provider_message_id を更新", async () => {
    await repo.enqueue({
      noteId: "note_sent",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    const claimed = await repo.claimNextBatch(10, "2026-05-06T00:00:01Z");
    await repo.markSent(claimed[0]!.notificationId, "msg_xyz", "2026-05-06T00:00:02Z");
    const row = await env.db
      .prepare("SELECT status, provider_message_id FROM notification_outbox WHERE notification_id = ?1")
      .bind(claimed[0]!.notificationId)
      .first<{ status: string; provider_message_id: string }>();
    expect(row?.status).toBe("sent");
    expect(row?.provider_message_id).toBe("msg_xyz");
  });

  it("markRetryableFailure は status='pending' に戻し retry_count++ + next_attempt_at を更新 (AC-6)", async () => {
    await repo.enqueue({
      noteId: "note_retry",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    const claimed = await repo.claimNextBatch(10, "2026-05-06T00:00:01Z");
    await repo.markRetryableFailure(
      claimed[0]!.notificationId,
      "5xx upstream",
      "2026-05-06T00:00:30Z",
      "2026-05-06T00:00:02Z",
    );
    const row = await env.db
      .prepare("SELECT status, retry_count, next_attempt_at, last_error FROM notification_outbox WHERE notification_id = ?1")
      .bind(claimed[0]!.notificationId)
      .first<{ status: string; retry_count: number; next_attempt_at: string; last_error: string }>();
    expect(row?.status).toBe("pending");
    expect(row?.retry_count).toBe(1);
    expect(row?.next_attempt_at).toBe("2026-05-06T00:00:30Z");
    expect(row?.last_error).toBe("5xx upstream");
  });

  it("moveToDlq は status='dlq' に遷移 (AC-7)", async () => {
    await repo.enqueue({
      noteId: "note_dlq",
      memberId: "m_1",
      recipientEmail: "u@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      nowIso: "2026-05-06T00:00:00Z",
    });
    const claimed = await repo.claimNextBatch(10, "2026-05-06T00:00:01Z");
    await repo.moveToDlq(claimed[0]!.notificationId, "permanent failure", "2026-05-06T00:00:02Z");
    const row = await env.db
      .prepare("SELECT status FROM notification_outbox WHERE notification_id = ?1")
      .bind(claimed[0]!.notificationId)
      .first<{ status: string }>();
    expect(row?.status).toBe("dlq");
  });

  it("findRecipientEmail: 空文字 / 行不在は null を返す", async () => {
    await seedMember(env, "m_with_email", "real@example.com");
    await seedMember(env, "m_empty_email", "");

    expect(await repo.findRecipientEmail("m_with_email")).toEqual({
      memberId: "m_with_email",
      responseEmail: "real@example.com",
    });
    expect(await repo.findRecipientEmail("m_empty_email")).toBeNull();
    expect(await repo.findRecipientEmail("m_missing")).toBeNull();
  });
});

describe("sanitizeReasonSummary unit", () => {
  it("AC-9: 制御文字除去 + trim + 200 char truncate", () => {
    expect(sanitizeReasonSummary("  hello world  ")).toBe("helloworld");
    expect(sanitizeReasonSummary("a".repeat(300))?.length).toBe(200);
    expect(sanitizeReasonSummary(null)).toBeNull();
    expect(sanitizeReasonSummary("")).toBeNull();
    expect(sanitizeReasonSummary("")).toBeNull();
  });
});
