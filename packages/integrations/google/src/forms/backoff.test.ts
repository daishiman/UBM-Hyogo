import { describe, expect, it, vi } from "vitest";

import { RetryableError, withBackoff } from "./backoff";

describe("withBackoff (AC-9 / 不変条件 #5)", () => {
  it("returns immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const out = await withBackoff(fn);
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on RetryableError up to maxRetry then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new RetryableError("429", 429))
      .mockRejectedValueOnce(new RetryableError("503", 503))
      .mockResolvedValue("done");
    const sleep = vi.fn().mockResolvedValue(undefined);
    const out = await withBackoff(fn, {
      maxRetry: 5,
      baseMs: 10,
      sleep,
      jitter: () => 0.5,
    });
    expect(out).toBe("done");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("throws after maxRetry exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new RetryableError("429", 429));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      withBackoff(fn, {
        maxRetry: 3,
        baseMs: 1,
        sleep,
        jitter: () => 0,
      }),
    ).rejects.toBeInstanceOf(RetryableError);
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("does not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent"));
    await expect(withBackoff(fn, { maxRetry: 5, sleep: async () => {} })).rejects.toThrow(
      "permanent",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
