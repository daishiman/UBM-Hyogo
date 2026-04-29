// 05b: Magic Link / Gate State 用 rate limit middleware
// AC-1〜AC-4 配信時の email 列挙攻撃を緩和する。
// 不変条件 #10: D1 writes / mail コストを抑制
//
// 実装方針: Workers isolate ローカルメモリでのカウンター（既存 rate-limit-self-request と同方式）
// MVP として cross-isolate 厳密性は KV / WAF 移行で担保する（Phase 5 Q1）。

import type { MiddlewareHandler } from "hono";

interface RateLimitState {
  readonly windowStart: number;
  count: number;
}

interface RateLimitOptions {
  readonly bucket: Map<string, RateLimitState>;
  readonly windowMs: number;
  readonly limit: number;
  readonly keyOf: (req: Request) => Promise<string>;
}

export const POST_MAGIC_LINK_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const POST_MAGIC_LINK_EMAIL_LIMIT = 5;
export const POST_MAGIC_LINK_IP_LIMIT = 30;
export const GET_GATE_STATE_IP_LIMIT = 60;

const emailBucket = new Map<string, RateLimitState>();
const postIpBucket = new Map<string, RateLimitState>();
const getIpBucket = new Map<string, RateLimitState>();

export const __resetRateLimitMagicLinkForTests = (): void => {
  emailBucket.clear();
  postIpBucket.clear();
  getIpBucket.clear();
};

const ipFromRequest = (req: Request): string => {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
};

const sha256Hex = async (s: string): Promise<string> => {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const arr = new Uint8Array(digest);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
};

const checkAndIncrement = (
  bucket: Map<string, RateLimitState>,
  key: string,
  now: number,
  windowMs: number,
  limit: number,
): { allowed: true } | { allowed: false; retryAfterSec: number } => {
  const state = bucket.get(key);
  if (!state || now - state.windowStart >= windowMs) {
    bucket.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  if (state.count >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((windowMs - (now - state.windowStart)) / 1000),
    );
    return { allowed: false, retryAfterSec };
  }
  state.count += 1;
  return { allowed: true };
};

const sendRateLimited = (
  c: Parameters<MiddlewareHandler>[0],
  retryAfterSec: number,
): Response =>
  c.json(
    { code: "RATE_LIMITED", retryAfter: retryAfterSec },
    429,
    { "Retry-After": String(retryAfterSec) },
  );

/**
 * POST /auth/magic-link 用。email + IP の二段で計測。
 * email は SHA-256 でハッシュ化したキーで保存（PII 漏洩防止）。
 * body を読み取るため一度ストリームを再構築して downstream へ渡す。
 */
export const rateLimitPostMagicLink: MiddlewareHandler = async (c, next) => {
  const text = await c.req.raw.text();
  let email: string | null = null;
  try {
    const body = JSON.parse(text) as { email?: unknown };
    if (typeof body.email === "string") email = body.email.trim().toLowerCase();
  } catch {
    // JSON parse 失敗時は次段に任せる（route の zod が 400 を返す）
  }
  // body を再構築して downstream へ渡す
  const newReq = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers: c.req.raw.headers,
    body: text,
  });
  // hono internal: Request を差し替える
  (c.req as unknown as { raw: Request }).raw = newReq;

  const now = Date.now();
  const ip = ipFromRequest(newReq);
  const ipResult = checkAndIncrement(
    postIpBucket,
    `post:ip:${ip}`,
    now,
    POST_MAGIC_LINK_WINDOW_MS,
    POST_MAGIC_LINK_IP_LIMIT,
  );
  if (!ipResult.allowed) {
    return sendRateLimited(c, ipResult.retryAfterSec);
  }
  if (email !== null) {
    const hashed = await sha256Hex(email);
    const emailResult = checkAndIncrement(
      emailBucket,
      `post:email:${hashed}`,
      now,
      POST_MAGIC_LINK_WINDOW_MS,
      POST_MAGIC_LINK_EMAIL_LIMIT,
    );
    if (!emailResult.allowed) {
      return sendRateLimited(c, emailResult.retryAfterSec);
    }
  }
  await next();
  return;
};

/**
 * GET /auth/gate-state 用。IP のみ。
 */
export const rateLimitGetGateState: MiddlewareHandler = async (c, next) => {
  const now = Date.now();
  const ip = ipFromRequest(c.req.raw);
  const result = checkAndIncrement(
    getIpBucket,
    `get:ip:${ip}`,
    now,
    POST_MAGIC_LINK_WINDOW_MS,
    GET_GATE_STATE_IP_LIMIT,
  );
  if (!result.allowed) {
    return sendRateLimited(c, result.retryAfterSec);
  }
  await next();
  return;
};
