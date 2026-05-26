import type { DbCtx } from "../repository/_shared/db";
import type { SlackBlockKitMessage } from "../lib/cloudflare-alert-formatter";
import {
  sendSlackMessage,
  type SendSlackResult,
} from "../lib/slack-sender";
import type { MailSender, MailSendResult } from "../services/mail/magic-link-mailer";
import type { SchemaAliasRollbackResult } from "./schemaAliasRollback";

export type RollbackNotificationStatus = "sent" | "failed" | "skipped";
export type RollbackNotificationChannel = "slack" | "mail" | "none";

export interface RollbackNotificationPayload {
  readonly aliasId: string;
  readonly rolledBackAt: string;
  readonly newVersion: number;
  readonly affectedResponseCount: number;
  readonly recomputeRequired: boolean;
  readonly actorRef: string;
}

export interface RollbackNotificationResult {
  readonly status: RollbackNotificationStatus;
  readonly channel: RollbackNotificationChannel;
  readonly attempts: number;
  readonly errorClass?: string;
  readonly dispatchedAt: string;
}

export interface RollbackNotificationDeps {
  readonly slackWebhookUrl?: string | undefined;
  readonly mailSender?: MailSender | undefined;
  readonly opsEmail?: string | undefined;
  readonly fromEmail?: string | undefined;
  readonly sendSlack?: typeof sendSlackMessage;
  readonly now?: () => string;
}

export interface RecordRollbackNotificationAuditInput {
  readonly result: RollbackNotificationResult;
  readonly aliasId: string;
  readonly actorEmail: string;
}

const newAuditId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `aud_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

const trimToValue = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const sanitizeErrorClass = (value: unknown): string => {
  if (value instanceof Error) return value.name || "Error";
  if (typeof value !== "string") return "Error";
  const token = value.match(/[A-Za-z][A-Za-z0-9_.-]{0,63}/)?.[0];
  return token ?? "Error";
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const redactRollbackActor = (actorEmail: string | null | undefined): string => {
  const value = trimToValue(actorEmail ?? undefined);
  if (!value || value === "unknown") return "admin:unknown";
  return "admin:redacted";
};

export const buildRollbackNotificationPayload = (
  result: SchemaAliasRollbackResult,
  actorEmail: string | null | undefined,
): RollbackNotificationPayload => ({
  aliasId: result.aliasId,
  rolledBackAt: result.rolledBackAt,
  newVersion: result.newVersion,
  affectedResponseCount: result.impact.affectedResponseCount,
  recomputeRequired: result.impact.recomputeRequired,
  actorRef: redactRollbackActor(actorEmail),
});

const buildSlackMessage = (
  payload: RollbackNotificationPayload,
): SlackBlockKitMessage => {
  const text = `Schema alias rollback completed for ${payload.aliasId}`;
  return {
    text,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Schema alias rollback completed",
          emoji: false,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Alias ID*\n${payload.aliasId}` },
          { type: "mrkdwn", text: `*New version*\n${payload.newVersion}` },
          { type: "mrkdwn", text: `*Affected responses*\n${payload.affectedResponseCount}` },
          { type: "mrkdwn", text: `*Recompute required*\n${payload.recomputeRequired ? "yes" : "no"}` },
          { type: "mrkdwn", text: `*Actor*\n${payload.actorRef}` },
          { type: "mrkdwn", text: `*Rolled back at*\n${payload.rolledBackAt}` },
        ],
      },
    ],
  };
};

const buildMailMessage = (
  payload: RollbackNotificationPayload,
  to: string,
  from: string,
) => {
  const lines = [
    "Schema alias rollback completed.",
    "",
    `Alias ID: ${payload.aliasId}`,
    `New version: ${payload.newVersion}`,
    `Affected responses: ${payload.affectedResponseCount}`,
    `Recompute required: ${payload.recomputeRequired ? "yes" : "no"}`,
    `Actor: ${payload.actorRef}`,
    `Rolled back at: ${payload.rolledBackAt}`,
  ];
  const text = lines.join("\n");
  return {
    to,
    from,
    subject: "Schema alias rollback completed",
    text,
    html: `<pre>${escapeHtml(text)}</pre>`,
  };
};

const sentResult = (
  channel: "slack" | "mail",
  attempts: number,
  dispatchedAt: string,
): RollbackNotificationResult => ({
  status: "sent",
  channel,
  attempts,
  dispatchedAt,
});

const failedResult = (
  channel: RollbackNotificationChannel,
  attempts: number,
  error: unknown,
  dispatchedAt: string,
): RollbackNotificationResult => ({
  status: "failed",
  channel,
  attempts,
  errorClass: sanitizeErrorClass(error),
  dispatchedAt,
});

export async function dispatchSchemaAliasRollbackNotification(
  deps: RollbackNotificationDeps,
  payload: RollbackNotificationPayload,
): Promise<RollbackNotificationResult> {
  const dispatchedAt = (deps.now ?? (() => new Date().toISOString()))();
  const slackWebhookUrl = trimToValue(deps.slackWebhookUrl);
  const opsEmail = trimToValue(deps.opsEmail);
  const fromEmail = trimToValue(deps.fromEmail);
  const sendSlack = deps.sendSlack ?? sendSlackMessage;

  let attempts = 0;
  let lastError: unknown = "notification_not_configured";
  let lastChannel: RollbackNotificationChannel = "none";

  if (slackWebhookUrl) {
    lastChannel = "slack";
    try {
      const slackResult: SendSlackResult = await sendSlack(
        slackWebhookUrl,
        buildSlackMessage(payload),
      );
      attempts += slackResult.attempts;
      if (slackResult.ok) {
        return sentResult("slack", attempts, dispatchedAt);
      }
      lastError = slackResult.error ?? `slack_status_${slackResult.status}`;
    } catch (error) {
      attempts += 1;
      lastError = error;
    }
  }

  if (deps.mailSender && opsEmail && fromEmail) {
    lastChannel = "mail";
    try {
      const mailResult: MailSendResult = await deps.mailSender.send(
        buildMailMessage(payload, opsEmail, fromEmail),
      );
      attempts += 1;
      if (mailResult.ok) {
        return sentResult("mail", attempts, dispatchedAt);
      }
      lastError = mailResult.errorMessage ?? "mail_send_failed";
    } catch (error) {
      attempts += 1;
      lastError = error;
    }
  }

  if (!slackWebhookUrl && !(deps.mailSender && opsEmail && fromEmail)) {
    return {
      status: "skipped",
      channel: "none",
      attempts: 0,
      dispatchedAt,
    };
  }

  return failedResult(lastChannel, attempts, lastError, dispatchedAt);
}

export async function recordRollbackNotificationAudit(
  c: DbCtx,
  input: RecordRollbackNotificationAuditInput,
): Promise<void> {
  await c.db
    .prepare(
      `INSERT INTO audit_log
       (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at)
       VALUES (?1, ?2, 'schema_alias.rollback_notification', 'schema_alias', ?3, NULL, ?4, ?5)`,
    )
    .bind(
      newAuditId(),
      input.actorEmail,
      input.aliasId,
      JSON.stringify({
        status: input.result.status,
        channel: input.result.channel,
        attempts: input.result.attempts,
        errorClass: input.result.errorClass ?? null,
        dispatchedAt: input.result.dispatchedAt,
      }),
      input.result.dispatchedAt,
    )
    .run();
}
