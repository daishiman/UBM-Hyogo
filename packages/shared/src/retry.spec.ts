import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./errors";
import { defaultClassify, SHEETS_RETRY_PRESET, withRetry } from "./retry";

describe("defaultClassify", () => {
  it("retries 6001/6002/6003 ApiError, stops on others", () => {
    expect(defaultClassify(new ApiError({ code: "UBM-6001" }))).toBe("retry");
    expect(defaultClassify(new ApiError({ code: "UBM-6002" }))).toBe("retry");
    expect(defaultClassify(new ApiError({ code: "UBM-6003" }))).toBe("retry");
    expect(defaultClassify(new ApiError({ code: "UBM-1001" }))).toBe("stop");
  });

  it("retries TypeError fetch failed", () => {
    expect(defaultClassify(new TypeError("fetch failed"))).toBe("retry");
    expect(defaultClassify(new TypeError("nope"))).toBe("stop");
  });

  it("retries on 5xx / 429 messages and timeout", () => {
    expect(defaultClassify(new Error("got 502 bad gateway"))).toBe("retry");
    expect(defaultClassify(new Error("429 too many"))).toBe("retry");
    expect(defaultClassify(new Error("connection timeout"))).toBe("retry");
    expect(defaultClassify("plain string")).toBe("stop");
  });
});

describe("SHEETS_RETRY_PRESET", () => {
  it("exposes expected defaults", () => {
    expect(SHEETS_RETRY_PRESET.maxAttempts).toBe(2);
    expect(SHEETS_RETRY_PRESET.failureCode).toBe("UBM-6001");
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns immediately on success", async () => {
    const fn = vi.fn(async () => "ok");
    const out = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      classify: () => "retry",
      isWorkersRuntime: false,
    });
    expect(out).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops immediately when classify returns stop", async () => {
    const err = new Error("boom");
    const fn = vi.fn(async () => {
      throw err;
    });
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 1,
        classify: () => "stop",
        isWorkersRuntime: false,
      }),
    ).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries until success", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 2) throw new Error("transient");
      return "done";
    });
    const out = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 1,
      classify: () => "retry",
      isWorkersRuntime: false,
    });
    expect(out).toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws ApiError with failureCode after exhausting attempts", async () => {
    const fn = vi.fn(async () => {
      throw new Error("x");
    });
    await expect(
      withRetry(fn, {
        maxAttempts: 2,
        baseDelayMs: 1,
        classify: () => "retry",
        isWorkersRuntime: false,
        failureCode: "UBM-6003",
      }),
    ).rejects.toMatchObject({ code: "UBM-6003" });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses default failureCode UBM-6001 when not provided", async () => {
    const fn = vi.fn(async () => {
      throw new Error("x");
    });
    await expect(
      withRetry(fn, {
        maxAttempts: 1,
        baseDelayMs: 1,
        classify: () => "retry",
        isWorkersRuntime: false,
      }),
    ).rejects.toMatchObject({ code: "UBM-6001" });
  });

  it("caps maxAttempts in Workers runtime and warns", async () => {
    const warnSpy = vi.spyOn(console, "warn");
    const fn = vi.fn(async () => {
      throw new Error("x");
    });
    await expect(
      withRetry(fn, {
        maxAttempts: 5,
        baseDelayMs: 1,
        classify: () => "retry",
        isWorkersRuntime: true,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("caps requested delay over maxDelayPerSleep", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n < 2) throw new Error("x");
      return "ok";
    });
    const out = await withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 5000,
      maxDelayPerSleepMs: 1,
      classify: () => "retry",
      isWorkersRuntime: false,
    });
    expect(out).toBe("ok");
  });

  it("throws abort error when signal aborted before first attempt", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const fn = vi.fn(async () => "ok");
    await expect(
      withRetry(fn, {
        maxAttempts: 2,
        baseDelayMs: 1,
        classify: () => "retry",
        signal: ctrl.signal,
        isWorkersRuntime: false,
      }),
    ).rejects.toMatchObject({ code: "UBM-6002" });
    expect(fn).not.toHaveBeenCalled();
  });

  it("throws timeout ApiError when totalTimeoutMs exceeded", async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      throw new Error("x");
    });
    const realNow = Date.now;
    let t = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => {
      t += 500;
      return t;
    });
    try {
      await expect(
        withRetry(fn, {
          maxAttempts: 5,
          baseDelayMs: 1,
          totalTimeoutMs: 100,
          classify: () => "retry",
          isWorkersRuntime: false,
        }),
      ).rejects.toMatchObject({ code: "UBM-6002" });
    } finally {
      Date.now = realNow;
    }
    expect(n).toBeGreaterThanOrEqual(1);
  });

  it("aborts during sleep", async () => {
    const ctrl = new AbortController();
    const fn = vi.fn(async () => {
      throw new Error("x");
    });
    setTimeout(() => ctrl.abort(), 5);
    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 50,
        classify: () => "retry",
        signal: ctrl.signal,
        isWorkersRuntime: false,
      }),
    ).rejects.toMatchObject({ code: "UBM-6002" });
  });
});
