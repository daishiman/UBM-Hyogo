// UT-17: Cloudflare Notifications generic webhook payload を
// 日本語 Slack Block Kit メッセージへ整形する pure function。
// Cloudflare の payload 契約は完全公開されていないため、name/text/data から
// best-effort で metric を分類し、不明分は "unknown" として元 name を保持する。

import type {
  AlertMetric,
  CloudflareNotificationPayload,
} from "../types/cloudflare-notification";

export interface SlackBlockKitMessage {
  readonly blocks: ReadonlyArray<unknown>;
  readonly text: string;
}

const METRIC_LABELS: Record<AlertMetric, string> = {
  workers_daily_requests: "Workers リクエスト（1日）",
  d1_read_rows: "D1 読み取り行数",
  d1_write_rows: "D1 書き込み行数",
  pages_build: "Pages ビルド回数",
  r2_class_a: "R2 Class A 操作回数",
  unknown: "Cloudflare アラート",
};

export function classifyAlertMetric(
  payload: CloudflareNotificationPayload,
): AlertMetric {
  const haystack = `${payload.name ?? ""} ${payload.text ?? ""} ${payload.alert_type ?? ""}`.toLowerCase();
  if (haystack.includes("worker") && haystack.includes("request")) {
    return "workers_daily_requests";
  }
  if (haystack.includes("d1") && haystack.includes("write")) {
    return "d1_write_rows";
  }
  if (haystack.includes("d1") && (haystack.includes("read") || haystack.includes("row"))) {
    return "d1_read_rows";
  }
  if (haystack.includes("pages") && haystack.includes("build")) {
    return "pages_build";
  }
  if (haystack.includes("r2") && (haystack.includes("class a") || haystack.includes("class_a") || haystack.includes("operation"))) {
    return "r2_class_a";
  }
  return "unknown";
}

function pickNumeric(data: Record<string, unknown> | undefined, keys: ReadonlyArray<string>): number | undefined {
  if (!data) return undefined;
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

function classifySeverity(payload: CloudflareNotificationPayload, current?: number, threshold?: number): "WARNING" | "CRITICAL" {
  const sev = (payload.severity ?? "").toLowerCase();
  if (sev.includes("critical") || sev.includes("high")) return "CRITICAL";
  if (typeof current === "number" && typeof threshold === "number" && threshold > 0) {
    const ratio = current / threshold;
    if (ratio >= 0.95) return "CRITICAL";
  }
  return "WARNING";
}

export function formatCloudflareAlertToSlack(
  payload: CloudflareNotificationPayload,
  options?: { readonly dashboardUrl?: string; readonly runbookUrl?: string },
): SlackBlockKitMessage {
  const metric = classifyAlertMetric(payload);
  const metricLabel = METRIC_LABELS[metric];
  const current = pickNumeric(payload.data, ["current", "current_value", "value", "usage"]);
  const threshold = pickNumeric(payload.data, ["threshold", "limit", "quota"]);
  const remaining =
    typeof current === "number" && typeof threshold === "number"
      ? Math.max(threshold - current, 0)
      : undefined;
  const severity = classifySeverity(payload, current, threshold);
  const fallbackName = payload.name ?? payload.text ?? "Cloudflare 通知";

  const headerText =
    severity === "CRITICAL"
      ? `🚨 [CRITICAL] ${metricLabel}`
      : `⚠️ [WARNING] ${metricLabel}`;

  const fields: Array<{ type: "mrkdwn"; text: string }> = [];
  if (typeof current === "number") {
    fields.push({ type: "mrkdwn", text: `*現在値*\n${formatNumber(current)}` });
  }
  if (typeof threshold === "number") {
    fields.push({ type: "mrkdwn", text: `*閾値*\n${formatNumber(threshold)}` });
  }
  if (typeof remaining === "number") {
    fields.push({ type: "mrkdwn", text: `*残量*\n${formatNumber(remaining)}` });
  }
  if (metric === "unknown") {
    fields.push({ type: "mrkdwn", text: `*検出元 name*\n${fallbackName}` });
  }

  const blocks: Array<unknown> = [
    {
      type: "header",
      text: { type: "plain_text", text: headerText, emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Cloudflare の使用量アラートを検知しました。\n*メトリクス*: ${metricLabel}`,
      },
    },
  ];
  if (fields.length > 0) {
    blocks.push({ type: "section", fields });
  }

  const links: string[] = [];
  if (options?.dashboardUrl) links.push(`<${options.dashboardUrl}|Cloudflare Dashboard で確認>`);
  if (options?.runbookUrl) links.push(`<${options.runbookUrl}|対応手順 (runbook)>`);
  if (links.length > 0) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: links.join(" / ") },
    });
  }

  const text = `[${severity}] ${metricLabel} — Cloudflare 使用量アラート（元: ${fallbackName}）`;

  return { blocks, text };
}
