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
import type { Context } from "hono";

export interface SheetsAuthAlertPayload {
  readonly category: "sheets-auth";
  readonly code: "SHEETS_AUTH_401_KEY_INVALID" | "SHEETS_AUTH_403_FORBIDDEN";
  readonly status: number;
  readonly message: string;
  readonly jobName: string;
  readonly spreadsheetId?: string;
  readonly ts: string;
  readonly rollbackRunbookUrl?: string;
}

function isSheetsAuthAlertPayload(p: unknown): p is SheetsAuthAlertPayload {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    o.category === "sheets-auth" &&
    (o.code === "SHEETS_AUTH_401_KEY_INVALID" ||
      o.code === "SHEETS_AUTH_403_FORBIDDEN") &&
    typeof o.status === "number" &&
    typeof o.message === "string" &&
    typeof o.jobName === "string" &&
    typeof o.ts === "string"
  );
}

function tenMinuteWindow(ts: number): number {
  return Math.floor(ts / (10 * 60_000));
}

function parseSheetsAuthSeenCount(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

async function handleSheetsAuthAlert(
  c: Context<{ Bindings: AlertRelayEnv }>,
  payload: SheetsAuthAlertPayload,
  webhookUrl: string,
  deps: AlertRelayDeps,
  dedupeTtlMs: number,
  now: () => number,
): Promise<Response> {
  const tsMs = Date.parse(payload.ts);
  const windowKey = tenMinuteWindow(Number.isFinite(tsMs) ? tsMs : now());
  const dedupeKey = `alert:sheets-auth:${payload.code}:${windowKey}`;

  let seen: string | null = null;
  try {
    seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
  } catch (error) {
    await logKvOperationError("get", error, dedupeKey);
  }
  const seenCount = parseSheetsAuthSeenCount(seen);
  if (seenCount >= 2) {
    return c.json({ ok: true, deduped: true, count: seenCount + 1 });
  }

  const runbookUrl =
    payload.rollbackRunbookUrl ??
    "https://github.com/daishiman/UBM-Hyogo/blob/main/docs/30-workflows/completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md";

  const text = `:rotating_light: Google Sheets API SA key 失効検知 (${payload.code})`;
  const message = {
    text,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: ":rotating_light: SA key 失効検知" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*code*\n${payload.code}` },
          { type: "mrkdwn", text: `*status*\n${payload.status}` },
          { type: "mrkdwn", text: `*jobName*\n${payload.jobName}` },
          { type: "mrkdwn", text: `*ts*\n${payload.ts}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*対応 runbook*: <${runbookUrl}|rollback-runbook.md>\n*message*: ${payload.message.slice(0, 300)}`,
        },
      },
    ],
  } as const;

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
    await c.env.ALERT_DEDUP_KV.put(dedupeKey, String(seenCount + 1), {
      expirationTtl: Math.ceil(Math.max(dedupeTtlMs, 10 * 60 * 1000) / 1000),
    });
  } catch (error) {
    await logKvOperationError("put", error, dedupeKey);
    return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
  }
  return c.json({ ok: true, attempts: result.attempts });
}

let cachedIsolateId: string | undefined;

function getIsolateId(): string {
  if (cachedIsolateId === undefined) {
    cachedIsolateId = crypto.randomUUID();
  }
  return cachedIsolateId;
}

const textEncoder = new TextEncoder();
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed";

export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  // ut-17-followup-002: isolate 跨ぎ dedup を永続化する Cloudflare KV namespace。
  // generic alert は value "1"、sheets-auth は同一 10 分窓の送信 count。
  // metadata 不使用、TTL は dedupeTtlMs を秒換算した expirationTtl。
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
    isolateId: getIsolateId(),
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
    let payload: CloudflareNotificationPayload | SheetsAuthAlertPayload;
    try {
      payload = (await c.req.json()) as
        | CloudflareNotificationPayload
        | SheetsAuthAlertPayload;
    } catch {
      return c.json({ error: "invalid json" }, 400);
    }

    const webhookUrl = c.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return c.json({ error: "slack webhook not configured" }, 503);
    }

    // UT-25-DERIV-02: sheets-auth カテゴリは専用の dedup キー + 固定 Slack message を使う。
    if (isSheetsAuthAlertPayload(payload)) {
      return handleSheetsAuthAlert(c, payload, webhookUrl, deps, dedupeTtlMs, now);
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
