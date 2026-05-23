// UT-15 Phase 4 F-07: edge / app-layer 両方で 429 応答を統一する pure helper。
// AC-5: `retry-after` header と JSON body shape を edge / app-layer で同一形式に揃える。

export type RateLimitedReason = "edge" | "app";

export interface RateLimitedResponseInput {
  readonly retryAfterSec: number;
  readonly reason: RateLimitedReason;
  readonly nowMs?: number;
}

export interface RateLimitedResponseHeaders {
  readonly "retry-after": string;
  readonly "content-type": "application/json; charset=utf-8";
  readonly "cache-control": "no-store";
  readonly "x-ratelimit-source": RateLimitedReason;
}

export interface RateLimitedResponseBody {
  readonly error: "rate_limited";
  readonly retryAfterSec: number;
  readonly reason: RateLimitedReason;
}

export interface RateLimitedResponse {
  readonly status: 429;
  readonly headers: RateLimitedResponseHeaders;
  readonly body: RateLimitedResponseBody;
}

const isFiniteIntegerAtLeastOne = (n: number): boolean =>
  Number.isFinite(n) && Number.isInteger(n) && n >= 1;

export function buildRateLimitedResponse(
  input: RateLimitedResponseInput,
): RateLimitedResponse {
  if (!isFiniteIntegerAtLeastOne(input.retryAfterSec)) {
    throw new TypeError(
      `retryAfterSec must be a positive integer, received: ${String(input.retryAfterSec)}`,
    );
  }
  if (input.reason !== "edge" && input.reason !== "app") {
    throw new TypeError(
      `reason must be "edge" or "app", received: ${String(input.reason)}`,
    );
  }
  return {
    status: 429,
    headers: {
      "retry-after": String(input.retryAfterSec),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-ratelimit-source": input.reason,
    },
    body: {
      error: "rate_limited",
      retryAfterSec: input.retryAfterSec,
      reason: input.reason,
    },
  };
}

export function toHonoResponse(res: RateLimitedResponse): Response {
  return new Response(JSON.stringify(res.body), {
    status: res.status,
    headers: { ...res.headers },
  });
}
