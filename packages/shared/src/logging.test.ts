import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logDebug, logError, logInfo, logWarn, sanitize } from "./logging";

describe("sanitize", () => {
  it("redacts sensitive keys (case-insensitive substring)", () => {
    const out = sanitize({
      Authorization: "Bearer x",
      cookieJar: "y",
      Password: "p",
      token: "t",
      api_key: "k",
      Other: "ok",
    });
    expect(out.Authorization).toBe("[REDACTED]");
    expect(out.cookieJar).toBe("[REDACTED]");
    expect(out.Password).toBe("[REDACTED]");
    expect(out.token).toBe("[REDACTED]");
    expect(out.api_key).toBe("[REDACTED]");
    expect(out.Other).toBe("ok");
  });

  it("passes through null, undefined, primitives", () => {
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
    expect(sanitize(42)).toBe(42);
    expect(sanitize(true)).toBe(true);
  });

  it("truncates long strings", () => {
    const long = "a".repeat(250);
    const out = sanitize(long);
    expect(out.startsWith("a".repeat(200))).toBe(true);
    expect(out).toContain("[truncated:250 chars]");
  });

  it("does not truncate short strings", () => {
    expect(sanitize("hello")).toBe("hello");
  });

  it("handles arrays recursively", () => {
    expect(sanitize([1, "x", { token: "t" }])).toEqual([1, "x", { token: "[REDACTED]" }]);
  });

  it("handles Error instances with stack preview", () => {
    const err = new Error("oops");
    err.stack = "line1\nline2\nline3\nline4\nline5\nline6\nline7";
    const out = sanitize({ err }) as { err: { name: string; message: string; stackPreview: string } };
    expect(out.err.name).toBe("Error");
    expect(out.err.message).toBe("oops");
    expect(out.err.stackPreview?.split("\n")).toHaveLength(5);
  });

  it("truncates long Error messages and handles missing stack", () => {
    const err = new Error("m".repeat(300));
    delete (err as { stack?: string }).stack;
    const out = sanitize({ err }) as { err: { message: string; stackPreview?: string } };
    expect(out.err.message).toContain("[truncated]");
    expect(out.err.stackPreview).toBeUndefined();
  });

  it("handles circular references", () => {
    const a: Record<string, unknown> = { name: "a" };
    a.self = a;
    const out = sanitize(a) as { name: string; self: unknown };
    expect(out.name).toBe("a");
    expect(out.self).toBe("[Circular]");
  });
});

describe("log emitters", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logError writes JSON line to console.error with level=error", () => {
    logError({ message: "boom", context: { token: "t" } });
    const line = errSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("boom");
    expect(parsed.context.token).toBe("[REDACTED]");
    expect(typeof parsed.timestamp).toBe("string");
  });

  it("logWarn / logInfo / logDebug route to corresponding consoles", () => {
    logWarn({ message: "w" });
    logInfo({ message: "i" });
    logDebug({ message: "d" });
    expect(JSON.parse(warnSpy.mock.calls[0][0] as string).level).toBe("warn");
    expect(JSON.parse(infoSpy.mock.calls[0][0] as string).level).toBe("info");
    expect(JSON.parse(debugSpy.mock.calls[0][0] as string).level).toBe("debug");
  });
});
