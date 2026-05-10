import { describe, it, expect, vi } from "vitest";
import { withRetry, isSqliteBusy } from "./with-retry";

describe("isSqliteBusy", () => {
  it("SQLITE_BUSY メッセージを検出する", () => {
    expect(isSqliteBusy(new Error("SQLITE_BUSY: database is locked"))).toBe(true);
    expect(isSqliteBusy(new Error("D1_ERROR: database is locked"))).toBe(true);
  });
  it("無関係なエラーは検出しない", () => {
    expect(isSqliteBusy(new Error("not found"))).toBe(false);
    expect(isSqliteBusy(null)).toBe(false);
  });
});

describe("withRetry", () => {
  it("成功した場合は試行回数 0 で返す", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxRetries: 3, baseMs: 1, sleep: async () => {} });
    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retryable な失敗の後に成功すれば retry する", async () => {
    let calls = 0;
    const fn = vi.fn().mockImplementation(() => {
      calls += 1;
      if (calls < 3) return Promise.reject(new Error("SQLITE_BUSY"));
      return Promise.resolve("ok");
    });
    const sleeps: number[] = [];
    const result = await withRetry(fn, {
      maxRetries: 5,
      baseMs: 10,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });
    expect(result.value).toBe("ok");
    expect(result.attempts).toBe(2);
    expect(sleeps.length).toBe(2);
  });

  it("非 retryable は即時 throw する", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("NOT_FOUND"));
    await expect(
      withRetry(fn, { maxRetries: 3, baseMs: 1, sleep: async () => {} }),
    ).rejects.toThrow("NOT_FOUND");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("maxRetries を超えた場合は最後のエラーを throw する", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("SQLITE_BUSY"));
    await expect(
      withRetry(fn, { maxRetries: 2, baseMs: 1, sleep: async () => {} }),
    ).rejects.toThrow("SQLITE_BUSY");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
