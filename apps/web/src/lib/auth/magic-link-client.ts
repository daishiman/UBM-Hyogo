// 06b: Client side で /api/auth/magic-link proxy を叩くラッパ。
// 不変条件 #5: 直接 API worker を叩かず、必ず web の同 origin proxy 経由（cf 帰属 + IP 転送のため）。
// 不変条件 #9: response.state を ブラウザ永続ストレージ 等に退避せず、URL query で表現する想定。

import type { LoginGateState } from "../url/login-query";

export interface SendMagicLinkResponse {
  readonly state: LoginGateState;
  readonly email?: string;
}

export class MagicLinkRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MagicLinkRequestError";
    this.status = status;
  }
}

export type MagicLinkRateLimitReason = "edge" | "app";

export class MagicLinkRateLimitedError extends MagicLinkRequestError {
  readonly retryAfterSec: number;
  readonly reason: MagicLinkRateLimitReason | undefined;

  constructor(
    retryAfterSec: number,
    reason?: MagicLinkRateLimitReason,
    message = "rate_limited",
  ) {
    super(429, message);
    this.name = "MagicLinkRateLimitedError";
    this.retryAfterSec = retryAfterSec;
    this.reason = reason;
  }
}

const DEFAULT_RETRY_AFTER_SEC = 60;

const isPositiveInteger = (value: number): boolean =>
  Number.isFinite(value) && Number.isInteger(value) && value >= 1;

const parseRetryAfterSec = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return isPositiveInteger(parsed) ? parsed : null;
};

const parseRateLimitBody = (
  body: unknown,
): {
  readonly retryAfterSec: number | null;
  readonly reason: MagicLinkRateLimitReason | undefined;
} => {
  if (!body || typeof body !== "object") {
    return { retryAfterSec: null, reason: undefined };
  }
  const record = body as { retryAfterSec?: unknown; reason?: unknown };
  const retryAfterSec = parseRetryAfterSec(record.retryAfterSec);
  const reason =
    record.reason === "edge" || record.reason === "app"
      ? record.reason
      : undefined;
  return { retryAfterSec, reason };
};

const isLoginGateState = (value: unknown): value is LoginGateState =>
  value === "input" ||
  value === "sent" ||
  value === "unregistered" ||
  value === "rules_declined" ||
  value === "deleted" ||
  value === "error";

/**
 * `/api/auth/magic-link` POST で magic link を送信し、結果 state を返す。
 * 200 / 202 で `{ state }` を期待。state が壊れている場合は input fallback。
 */
export const sendMagicLink = async (
  email: string,
  redirect: string,
): Promise<SendMagicLinkResponse> => {
  const res = await fetch("/api/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, redirect }),
  });
  if (res.status === 429) {
    const headerSec = parseRetryAfterSec(res.headers.get("Retry-After"));
    const body = await res.json().catch(() => null);
    const { retryAfterSec: bodySec, reason } = parseRateLimitBody(body);
    throw new MagicLinkRateLimitedError(
      headerSec ?? bodySec ?? DEFAULT_RETRY_AFTER_SEC,
      reason,
    );
  }
  if (!res.ok && res.status !== 202) {
    const text = await res.text().catch(() => "");
    throw new MagicLinkRequestError(res.status, text || `HTTP ${res.status}`);
  }
  const data = (await res.json().catch(() => ({}))) as {
    state?: unknown;
    email?: unknown;
  };
  const state: LoginGateState = isLoginGateState(data.state)
    ? data.state
    : "sent";
  const out: SendMagicLinkResponse =
    typeof data.email === "string" ? { state, email: data.email } : { state };
  return out;
};
