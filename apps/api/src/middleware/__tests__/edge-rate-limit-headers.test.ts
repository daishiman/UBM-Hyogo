// UT-15 Phase 4 F-08: buildRateLimitedResponse / toHonoResponse の単体テスト。
// AC-5: edge / app-layer 双方の 429 応答が helper 経由で同一形式に揃うことを保証する。

import { describe, it, expect } from "vitest";
import {
  buildRateLimitedResponse,
  toHonoResponse,
} from "../edge-rate-limit-headers";

describe("edge-rate-limit-headers / buildRateLimitedResponse", () => {
  it("T-01: edge reason の正常系で 429 / retry-after / body shape を返す", () => {
    const r = buildRateLimitedResponse({ retryAfterSec: 30, reason: "edge" });
    expect(r.status).toBe(429);
    expect(r.headers["retry-after"]).toBe("30");
    expect(r.headers["content-type"]).toBe("application/json; charset=utf-8");
    expect(r.headers["cache-control"]).toBe("no-store");
    expect(r.headers["x-ratelimit-source"]).toBe("edge");
    expect(r.body).toEqual({
      error: "rate_limited",
      retryAfterSec: 30,
      reason: "edge",
    });
  });

  it("T-02: app reason の正常系で reason=app が body / header に反映される", () => {
    const r = buildRateLimitedResponse({ retryAfterSec: 60, reason: "app" });
    expect(r.headers["x-ratelimit-source"]).toBe("app");
    expect(r.body.reason).toBe("app");
    expect(r.body.retryAfterSec).toBe(60);
  });

  it("T-03: retryAfterSec=1 は許容される（最小値境界）", () => {
    const r = buildRateLimitedResponse({ retryAfterSec: 1, reason: "edge" });
    expect(r.headers["retry-after"]).toBe("1");
  });

  it("T-04: retryAfterSec が 0 / 負 / 小数 / NaN なら TypeError", () => {
    expect(() =>
      buildRateLimitedResponse({ retryAfterSec: 0, reason: "edge" }),
    ).toThrow(TypeError);
    expect(() =>
      buildRateLimitedResponse({ retryAfterSec: -1, reason: "edge" }),
    ).toThrow(TypeError);
    expect(() =>
      buildRateLimitedResponse({ retryAfterSec: 1.5, reason: "edge" }),
    ).toThrow(TypeError);
    expect(() =>
      buildRateLimitedResponse({ retryAfterSec: Number.NaN, reason: "edge" }),
    ).toThrow(TypeError);
  });

  it("T-05: reason が edge / app 以外なら TypeError", () => {
    expect(() =>
      buildRateLimitedResponse({
        retryAfterSec: 30,
        // @ts-expect-error invalid reason for runtime guard test
        reason: "other",
      }),
    ).toThrow(TypeError);
  });
});

describe("edge-rate-limit-headers / toHonoResponse", () => {
  it("T-06: Response の status / header / body が helper 出力と一致する", async () => {
    const r = buildRateLimitedResponse({ retryAfterSec: 5, reason: "app" });
    const res = toHonoResponse(r);
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("5");
    expect(res.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-ratelimit-source")).toBe("app");
    const json = (await res.json()) as Record<string, unknown>;
    expect(json).toEqual({
      error: "rate_limited",
      retryAfterSec: 5,
      reason: "app",
    });
  });
});
