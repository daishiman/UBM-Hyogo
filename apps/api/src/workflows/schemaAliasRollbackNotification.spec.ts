// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  buildRollbackNotificationPayload,
  dispatchSchemaAliasRollbackNotification,
  recordRollbackNotificationAudit,
} from "./schemaAliasRollbackNotification";
import type { SchemaAliasRollbackResult } from "./schemaAliasRollback";
import type { MailSender } from "../services/mail/magic-link-mailer";
import type { sendSlackMessage } from "../lib/slack-sender";
import type { SlackBlockKitMessage } from "../lib/cloudflare-alert-formatter";

const rollbackResult = (): SchemaAliasRollbackResult => ({
  aliasId: "alias-1",
  rolledBackAt: "2026-05-24T00:00:00.000Z",
  relatedAuditId: "audit-1",
  newVersion: 2,
  impact: { affectedResponseCount: 3, recomputeRequired: true },
});

describe("schema alias rollback notification", () => {
  it("sends Slack first and redacts actor email from payload", async () => {
    const sendSlackMock = vi.fn(async (_url: string, _message: SlackBlockKitMessage) => ({
      ok: true,
      status: 200,
      attempts: 1,
    }));
    const sendSlack = sendSlackMock as unknown as typeof sendSlackMessage;
    const payload = buildRollbackNotificationPayload(
      rollbackResult(),
      "admin@example.com",
    );
    const result = await dispatchSchemaAliasRollbackNotification(
      {
        slackWebhookUrl: "https://hooks.slack.com/services/T/B/X",
        sendSlack,
        now: () => "2026-05-24T00:00:01.000Z",
      },
      payload,
    );

    expect(result).toMatchObject({ status: "sent", channel: "slack", attempts: 1 });
    expect(payload.actorRef).toBe("admin:redacted");
    const firstCall = sendSlackMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const message = firstCall?.[1] as { text: string; blocks: unknown[] };
    expect(JSON.stringify(message)).not.toContain("admin@example.com");
    expect(JSON.stringify(message)).not.toContain("full_name");
  });

  it("falls back to mail when Slack fails", async () => {
    const sendSlack = vi.fn(async () => ({
      ok: false,
      status: 500,
      attempts: 2,
      error: "slack retryable status (500)",
    }));
    const mailSender: MailSender = {
      send: vi.fn(async () => ({ ok: true, providerMessageId: "mail-1" })),
    };
    const result = await dispatchSchemaAliasRollbackNotification(
      {
        slackWebhookUrl: "https://hooks.slack.com/services/T/B/X",
        sendSlack,
        mailSender,
        opsEmail: "ops@example.com",
        fromEmail: "noreply@example.com",
      },
      buildRollbackNotificationPayload(rollbackResult(), "admin@example.com"),
    );

    expect(result).toMatchObject({ status: "sent", channel: "mail", attempts: 3 });
    expect(mailSender.send).toHaveBeenCalledTimes(1);
  });

  it("escapes dynamic values in mail html body", async () => {
    const mailSender: MailSender = {
      send: vi.fn(async () => ({ ok: true, providerMessageId: "mail-1" })),
    };
    await dispatchSchemaAliasRollbackNotification(
      {
        mailSender,
        opsEmail: "ops@example.com",
        fromEmail: "noreply@example.com",
      },
      {
        ...buildRollbackNotificationPayload(rollbackResult(), "admin@example.com"),
        aliasId: "alias-<script>",
      },
    );

    const message = vi.mocked(mailSender.send).mock.calls[0]?.[0];
    expect(message?.text).toContain("alias-<script>");
    expect(message?.html).toContain("alias-&lt;script&gt;");
    expect(message?.html).not.toContain("alias-<script>");
  });

  it("returns skipped when no channel is configured", async () => {
    const result = await dispatchSchemaAliasRollbackNotification(
      { now: () => "2026-05-24T00:00:01.000Z" },
      buildRollbackNotificationPayload(rollbackResult(), "admin@example.com"),
    );
    expect(result).toEqual({
      status: "skipped",
      channel: "none",
      attempts: 0,
      dispatchedAt: "2026-05-24T00:00:01.000Z",
    });
  });

  it("returns failed with sanitized errorClass when all configured channels fail", async () => {
    const mailSender: MailSender = {
      send: vi.fn(async () => ({
        ok: false,
        errorMessage: "mail_provider_401: token https://secret.example/path",
      })),
    };
    const result = await dispatchSchemaAliasRollbackNotification(
      {
        mailSender,
        opsEmail: "ops@example.com",
        fromEmail: "noreply@example.com",
      },
      buildRollbackNotificationPayload(rollbackResult(), "admin@example.com"),
    );

    expect(result.status).toBe("failed");
    expect(result.channel).toBe("mail");
    expect(result.errorClass).toBe("mail_provider_401");
    expect(JSON.stringify(result)).not.toContain("secret.example");
  });

  it("records notification status to audit_log after_json without raw actor email", async () => {
    const calls: unknown[][] = [];
    const db = {
      prepare: vi.fn(() => ({
        bind: (...args: unknown[]) => {
          calls.push(args);
          return { run: vi.fn(async () => ({ success: true })) };
        },
      })),
    };
    await recordRollbackNotificationAudit({ db: db as unknown as D1Database }, {
      aliasId: "alias-1",
      actorEmail: "admin@example.com",
      result: {
        status: "sent",
        channel: "slack",
        attempts: 1,
        dispatchedAt: "2026-05-24T00:00:01.000Z",
      },
    });

    expect(db.prepare).toHaveBeenCalledWith(
      expect.stringContaining("schema_alias.rollback_notification"),
    );
    const bindArgs = calls[0] ?? [];
    expect(bindArgs[2]).toBe("alias-1");
    const afterJson = bindArgs[3] as string;
    const after = JSON.parse(afterJson) as Record<string, unknown>;
    expect(after).toMatchObject({
      status: "sent",
      channel: "slack",
      attempts: 1,
      errorClass: null,
      dispatchedAt: "2026-05-24T00:00:01.000Z",
    });
    expect(afterJson).not.toContain("admin@example.com");
  });
});
