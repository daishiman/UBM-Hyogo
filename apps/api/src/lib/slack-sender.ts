// UT-17: Slack Incoming Webhook 送信 + exponential backoff retry。
// 429 / 5xx は最大 maxRetries 回まで指数バックオフで retry する。
// その他 4xx は URL や request detail を返さず即時失敗にする。

import type { SlackBlockKitMessage } from "./cloudflare-alert-formatter";

export interface SendSlackResult {
  readonly ok: boolean;
  readonly status: number;
  readonly attempts: number;
  readonly error?: string;
}

export interface SendSlackOptions {
  readonly fetch?: typeof fetch;
  readonly maxRetries?: number;
  readonly backoffMs?: ReadonlyArray<number>;
  readonly sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_BACKOFF_MS: ReadonlyArray<number> = [200, 500, 1500];

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export async function sendSlackMessage(
  webhookUrl: string,
  message: SlackBlockKitMessage,
  options?: SendSlackOptions,
): Promise<SendSlackResult> {
  const fetchImpl = options?.fetch ?? fetch;
  const maxRetries = options?.maxRetries ?? 3;
  const backoff = options?.backoffMs ?? DEFAULT_BACKOFF_MS;
  const sleep =
    options?.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));

  let attempts = 0;
  let lastStatus = 0;
  let lastError: string | undefined;

  for (let i = 0; i < maxRetries; i += 1) {
    attempts += 1;
    try {
      const res = await fetchImpl(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(message),
      });
      lastStatus = res.status;
      if (res.status >= 200 && res.status < 300) {
        return { ok: true, status: res.status, attempts };
      }
      if (RETRYABLE_STATUSES.has(res.status)) {
        lastError = `slack retryable status (${res.status})`;
      } else if (res.status >= 400 && res.status < 500) {
        return {
          ok: false,
          status: res.status,
          attempts,
          error: `slack non-retryable status (${res.status})`,
        };
      } else {
        lastError = `slack retryable status (${res.status})`;
      }
    } catch (e) {
      lastError = e instanceof Error ? e.name : "FetchError";
    }
    if (i < maxRetries - 1) {
      const waitMs = backoff[Math.min(i, backoff.length - 1)] ?? 1000;
      await sleep(waitMs);
    }
  }

  return { ok: false, status: lastStatus, attempts, error: lastError ?? "slack send failed" };
}
