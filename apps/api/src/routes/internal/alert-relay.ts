// UT-17: Cloudflare Notifications generic webhook を受信し、
// 日本語 Slack Block Kit に整形して Slack Incoming Webhook へ転送する relay route。
// 認証は cf-webhook-auth header の固定シークレット検証（Phase 02 設計）。

import { Hono } from "hono";
import {
  verifyCfWebhookAuth,
  type VerifyCfWebhookAuthEnv,
} from "../../middleware/verify-cf-webhook-auth";
import {
  classifyAlertMetric,
  formatCloudflareAlertToSlack,
} from "../../lib/cloudflare-alert-formatter";
import { sendSlackMessage } from "../../lib/slack-sender";
import type { CloudflareNotificationPayload } from "../../types/cloudflare-notification";

export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
}

export interface AlertRelayDeps {
  readonly fetch?: typeof fetch;
  readonly dashboardUrl?: string;
  readonly runbookUrl?: string;
  readonly maxRetries?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
  readonly dedupeTtlMs?: number;
}

export function createAlertRelayRoute(deps: AlertRelayDeps = {}): Hono<{ Bindings: AlertRelayEnv }> {
  const app = new Hono<{ Bindings: AlertRelayEnv }>();
  const seenAlerts = new Map<string, number>();
  const dedupeTtlMs = deps.dedupeTtlMs ?? 5 * 60 * 1000;
  const now = deps.now ?? Date.now;

  app.post("/", verifyCfWebhookAuth, async (c) => {
    let payload: CloudflareNotificationPayload;
    try {
      payload = (await c.req.json()) as CloudflareNotificationPayload;
    } catch {
      return c.json({ error: "invalid json" }, 400);
    }

    const webhookUrl = c.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return c.json({ error: "slack webhook not configured" }, 503);
    }

    const timestamp =
      typeof payload.ts === "number" && Number.isFinite(payload.ts)
        ? payload.ts
        : now();
    const minuteBucket = Math.floor(timestamp / 60_000);
    const dedupeKey = [
      classifyAlertMetric(payload),
      payload.policy_id ?? payload.name ?? payload.alert_type ?? "unknown",
      String(minuteBucket),
    ].join(":");
    const lastSeen = seenAlerts.get(dedupeKey);
    if (typeof lastSeen === "number" && now() - lastSeen < dedupeTtlMs) {
      return c.json({ ok: true, deduped: true });
    }
    seenAlerts.set(dedupeKey, now());
    for (const [key, seenAt] of seenAlerts) {
      if (now() - seenAt >= dedupeTtlMs) seenAlerts.delete(key);
    }

    const fmtOptions: { dashboardUrl?: string; runbookUrl?: string } = {};
    const dashboardUrl = deps.dashboardUrl ?? c.env.CF_ALERT_DASHBOARD_URL;
    const runbookUrl = deps.runbookUrl ?? c.env.CF_ALERT_RUNBOOK_URL;
    if (dashboardUrl !== undefined) fmtOptions.dashboardUrl = dashboardUrl;
    if (runbookUrl !== undefined) fmtOptions.runbookUrl = runbookUrl;
    const message = formatCloudflareAlertToSlack(payload, fmtOptions);

    const sendOptions: {
      fetch?: typeof fetch;
      maxRetries?: number;
      sleep?: (ms: number) => Promise<void>;
    } = {};
    if (deps.fetch !== undefined) sendOptions.fetch = deps.fetch;
    if (deps.maxRetries !== undefined) sendOptions.maxRetries = deps.maxRetries;
    if (deps.sleep !== undefined) sendOptions.sleep = deps.sleep;
    const result = await sendSlackMessage(webhookUrl, message, sendOptions);

    if (!result.ok) {
      return c.json(
        { ok: false, attempts: result.attempts, status: result.status, error: "slack delivery failed" },
        502,
      );
    }
    return c.json({ ok: true, attempts: result.attempts });
  });

  return app;
}
