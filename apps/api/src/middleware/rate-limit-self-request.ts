// 04b: /me/visibility-request, /me/delete-request の session 単位 rate limit
// AC-6: session 単位 5 req/min。Cloudflare KV / D1 持ち込みは MVP では未実施のため、
//       Workers isolate ローカルメモリで簡易カウンターを実装する。
//       同 isolate 内では正しく動作し、超過した請求が二重申請防止 (admin_member_notes の hasPendingRequest)
//       でも担保される多層防御。
//
// 注意: cross-isolate な厳密 rate limit が必要になったら KV / D1 移行する。
//       現状の MVP は二重申請防止 (#AC-6 主目的) を notes の pending 判定で担保し、
//       本 middleware は瞬間的な burst を抑える役割に留める。

import type { MiddlewareHandler } from "hono";
import type { SessionGuardEnv, SessionGuardVariables } from "./session-guard";

interface RateLimitState {
  windowStart: number;
  count: number;
}

const buckets = new Map<string, RateLimitState>();

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 5;

export const __resetRateLimitForTests = () => buckets.clear();

export const rateLimitSelfRequest: MiddlewareHandler<{
  Bindings: SessionGuardEnv;
  Variables: SessionGuardVariables;
}> = async (c, next) => {
  const user = c.get("user");
  if (!user) {
    // sessionGuard 後段で呼ばれる前提。fail-safe として 401 を返す。
    return c.json({ code: "UNAUTHENTICATED" }, 401);
  }
  const key = `me:self-request:${user.memberId}`;
  const now = Date.now();
  const state = buckets.get(key);
  if (!state || now - state.windowStart >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    await next();
    return;
  }
  if (state.count >= RATE_LIMIT_MAX) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((RATE_LIMIT_WINDOW_MS - (now - state.windowStart)) / 1000),
    );
    return c.json(
      { code: "RATE_LIMITED", retryAfter: retryAfterSec },
      429,
      { "Retry-After": String(retryAfterSec) },
    );
  }
  state.count += 1;
  await next();
  return;
};
