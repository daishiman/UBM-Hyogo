// @vitest-environment node
// Issue #401: dispatcher unit tests (4xx/5xx retryable 分岐)
import { describe, it, expect } from "vitest";
import { createMailDispatcher } from "../dispatcher";
import { sanitizeProviderError } from "../dispatcher";
import { createFakeMailSender } from "../__fixtures__/fake-mail-sender";
import { buildNotificationMessage } from "../templates";
import type { NotificationOutboxRow } from "../../../repository/notificationOutbox";

const makeRow = (
  override: Partial<NotificationOutboxRow> = {},
): NotificationOutboxRow => ({
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

describe("createMailDispatcher", () => {
  it("成功時 ok=true + providerMessageId を伝播", async () => {
    const fake = createFakeMailSender();
    fake.setNextResult({ ok: true, providerMessageId: "msg_xyz" });
    const dispatcher = createMailDispatcher({
      mailSender: fake,
      fromAddress: "from@example.com",
      buildMessage: (row, from) =>
        buildNotificationMessage({
          to: row.recipientEmail,
          from,
          outcome: row.outcome,
          requestType: row.requestType,
          reasonSummary: row.reasonSummary,
        }),
    });
    const r = await dispatcher.dispatch(makeRow());
    expect(r.ok).toBe(true);
    expect(r.providerMessageId).toBe("msg_xyz");
    expect(r.retryable).toBe(false);
    expect(fake.sent).toHaveLength(1);
    expect(fake.sent[0]!.to).toBe("u@example.com");
  });

  it("4xx 失敗 → retryable=false (即 dlq 対象)", async () => {
    const fake = createFakeMailSender();
    fake.setNextResult({
      ok: false,
      errorMessage: "mail_provider_400: bad request",
    });
    const dispatcher = createMailDispatcher({
      mailSender: fake,
      fromAddress: "from@example.com",
      buildMessage: (row, from) =>
        buildNotificationMessage({
          to: row.recipientEmail,
          from,
          outcome: row.outcome,
          requestType: row.requestType,
          reasonSummary: row.reasonSummary,
        }),
    });
    const r = await dispatcher.dispatch(makeRow());
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(false);
    expect(r.errorMessage).toBe("mail_provider_400");
  });

  it("5xx 失敗 → retryable=true", async () => {
    const fake = createFakeMailSender();
    fake.setNextResult({
      ok: false,
      errorMessage: "mail_provider_503: upstream",
    });
    const dispatcher = createMailDispatcher({
      mailSender: fake,
      fromAddress: "from@example.com",
      buildMessage: (row, from) =>
        buildNotificationMessage({
          to: row.recipientEmail,
          from,
          outcome: row.outcome,
          requestType: row.requestType,
          reasonSummary: row.reasonSummary,
        }),
    });
    const r = await dispatcher.dispatch(makeRow());
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(true);
    expect(r.errorMessage).toBe("mail_provider_503");
  });

  it("send() throw → retryable=true (network 等)", async () => {
    const fake = createFakeMailSender();
    fake.setNextThrow(new Error("network ECONNRESET"));
    const dispatcher = createMailDispatcher({
      mailSender: fake,
      fromAddress: "from@example.com",
      buildMessage: (row, from) =>
        buildNotificationMessage({
          to: row.recipientEmail,
          from,
          outcome: row.outcome,
          requestType: row.requestType,
          reasonSummary: row.reasonSummary,
        }),
    });
    const r = await dispatcher.dispatch(makeRow());
    expect(r.ok).toBe(false);
    expect(r.retryable).toBe(true);
    expect(r.errorMessage).toBe("network_error");
  });

  it("provider error body is reduced to a non-PII error class", () => {
    expect(
      sanitizeProviderError("mail_provider_400: recipient alice@example.com rejected"),
    ).toBe("mail_provider_400");
    expect(sanitizeProviderError("MAIL_PROVIDER_KEY not configured")).toBe(
      "mail_provider_unconfigured",
    );
  });
});
