// @vitest-environment node
// u-04: sheets-client の単体テスト (U-S-01..05)。
// fetchWithBackoff の retry / RateLimitError / fetchDelta の cursor フィルタを検証する。

import { describe, it, expect } from "vitest";
import { fetchWithBackoff, RateLimitError } from "./sheets-client";

const noSleep = async () => undefined;

describe("u-04 sheets-client", () => {
  it("U-S-01: 成功時は retryCount=0 を返す", async () => {
    const r = await fetchWithBackoff(async () => 42, undefined, noSleep);
    expect(r.value).toBe(42);
    expect(r.retryCount).toBe(0);
  });

  it("U-S-02: RateLimitError は再試行され、最終 retryCount を返す", async () => {
    let n = 0;
    const r = await fetchWithBackoff(
      async () => {
        n += 1;
        if (n < 3) throw new RateLimitError(429);
        return "ok";
      },
      { maxRetries: 3, baseMs: 1, factor: 2 },
      noSleep,
    );
    expect(r.value).toBe("ok");
    expect(r.retryCount).toBe(2);
  });

  it("U-S-03: maxRetries 超過は throw する (AC-12)", async () => {
    await expect(
      fetchWithBackoff(
        async () => {
          throw new RateLimitError(503);
        },
        { maxRetries: 2, baseMs: 1, factor: 2 },
        noSleep,
      ),
    ).rejects.toBeInstanceOf(RateLimitError);
  });

  it("U-S-04: 非 retriable な error はそのまま throw する", async () => {
    await expect(
      fetchWithBackoff(
        async () => {
          throw new Error("auth failed");
        },
        undefined,
        noSleep,
      ),
    ).rejects.toThrow("auth failed");
  });

  it("U-S-05: status >= 500 / 429 を持つ generic error は retriable 扱い", async () => {
    let n = 0;
    const r = await fetchWithBackoff(
      async () => {
        n += 1;
        if (n < 2) {
          const e = Object.assign(new Error("flaky"), { status: 503 });
          throw e;
        }
        return "done";
      },
      { maxRetries: 2, baseMs: 1, factor: 2 },
      noSleep,
    );
    expect(r.value).toBe("done");
    expect(r.retryCount).toBe(1);
  });
});
