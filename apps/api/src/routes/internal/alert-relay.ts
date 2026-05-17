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

const isolateId = crypto.randomUUID();
const textEncoder = new TextEncoder();
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed";

export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  // ut-17-followup-002: isolate 跨ぎ dedup を永続化する Cloudflare KV namespace。
  // value は "1" 固定、metadata 不使用、TTL は dedupeTtlMs を秒換算した expirationTtl。
  readonly ALERT_DEDUP_KV: KVNamespace;
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

async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(dedupeKey));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

function getErrorClass(err: unknown): string {
  return err instanceof Error ? err.constructor.name : typeof err;
}

function emitKvOperationError(payload: {
  readonly op: "get" | "put";
  readonly errorClass: string;
  readonly dedupeKeyHash: string;
}): void {
  console.warn(JSON.stringify({
    event: KV_OP_FAILED_EVENT,
    op: payload.op,
    errorClass: payload.errorClass,
    dedupeKeyHash: payload.dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  }));
}

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass = getErrorClass(err);
  try {
    emitKvOperationError({
      op,
      errorClass,
      dedupeKeyHash: await computeDedupeKeyHash(dedupeKey),
    });
  } catch {
    try {
      emitKvOperationError({ op, errorClass, dedupeKeyHash: "hash_error" });
    } catch {
      // Logging must never alter alert delivery or dedup response semantics.
    }
  }
}

export function createAlertRelayRoute(deps: AlertRelayDeps = {}): Hono<{ Bindings: AlertRelayEnv }> {
  const app = new Hono<{ Bindings: AlertRelayEnv }>();
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
    // ut-17-followup-002: dedup state は KV 永続化。eventual consistency により
    // 同一リクエスト内 race（複数 isolate からの同時 read→put）は許容スコープ外。
    let seen: string | null = null;
    try {
      seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
    } catch (error) {
      await logKvOperationError("get", error, dedupeKey);
    }
    if (seen !== null) {
      return c.json({ ok: true, deduped: true });
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
    try {
      await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
        expirationTtl: Math.ceil(dedupeTtlMs / 1000),
      });
    } catch (error) {
      await logKvOperationError("put", error, dedupeKey);
      return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
    }
    return c.json({ ok: true, attempts: result.attempts });
  });

  return app;
}
