// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../sentry/capture", () => ({
  captureException: vi.fn(() => "evt_xxx"),
  captureMessage: vi.fn(() => "evt_yyy"),
}));

import { logger } from "../logger";
import { captureException, captureMessage } from "../sentry/capture";

describe("logger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (captureException as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => "evt_xxx",
    );
    (captureMessage as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => "evt_yyy",
    );
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  it("emits JSON one-line to console.info on info()", () => {
    logger.info({ event: "x" });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const arg = infoSpy.mock.calls[0][0] as string;
    expect(arg).not.toContain("\n");
    const payload = JSON.parse(arg);
    expect(payload).toMatchObject({
      level: "info",
      event: "x",
      runtime: "browser",
    });
    expect(typeof payload.ts).toBe("string");
  });

  it("calls captureException once on error()", () => {
    const err = new Error("boom");
    logger.error({ event: "y", error: err });
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        level: "error",
        tags: expect.objectContaining({ event: "y" }),
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("promotes string scope and digest to Sentry tags while keeping extras", () => {
    const err = new Error("boom");
    logger.error({
      event: "error.boundary.caught",
      scope: "admin",
      digest: "167275886",
      error: err,
    });
    expect(captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        tags: expect.objectContaining({
          event: "error.boundary.caught",
          runtime: "browser",
          scope: "admin",
          digest: "167275886",
        }),
        extras: expect.objectContaining({
          scope: "admin",
          digest: "167275886",
        }),
      }),
    );
  });

  it("does not promote non-string scope or digest to Sentry tags", () => {
    logger.error({
      event: "error.boundary.caught",
      scope: 123,
      digest: { value: "167275886" },
    });
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: {
          event: "error.boundary.caught",
          runtime: "browser",
        },
      }),
    );
  });

  it("keeps err as a backward-compatible alias for error()", () => {
    const err = new Error("legacy boom");
    logger.error({ event: "legacy", err });
    expect(captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({
        tags: expect.objectContaining({ event: "legacy" }),
      }),
    );
  });

  it("calls captureMessage with level=warning on warn()", () => {
    logger.warn({ event: "z", scope: "admin", digest: "d1" });
    expect(captureMessage).toHaveBeenCalledWith(
      "z",
      expect.objectContaining({
        level: "warning",
        tags: expect.objectContaining({
          event: "z",
          runtime: "browser",
          scope: "admin",
          digest: "d1",
        }),
      }),
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("merges child fields into emitted payload", () => {
    const child = logger.child({ userId: "u1" });
    child.info({ event: "c" });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload.userId).toBe("u1");
    expect(payload.event).toBe("c");
  });

  it("does not throw when Sentry capture throws", () => {
    (captureException as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("sentry down");
      },
    );
    expect(() => logger.error({ event: "e" })).not.toThrow();
  });

  it("does not call Sentry on info/debug levels", () => {
    logger.info({ event: "i" });
    logger.debug({ event: "d" });
    expect(captureException).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
  });

  it("redacts PII keys (email/token/secret) in payload", () => {
    logger.info({ event: "p", email: "u@example.com", token: "abc" });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(payload.email).toBe("***");
    expect(payload.token).toBe("***");
  });

  it("redacts array values element-wise", () => {
    logger.info({ event: "arr", items: ["a@example.com", "plain"] as unknown });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items).toHaveLength(2);
  });

  it("caps redaction recursion with a depth limit marker", () => {
    logger.info({
      event: "deep",
      nested: { a: { b: { c: { d: { e: "too-deep" } } } } } as unknown,
    });
    const payload = JSON.parse(infoSpy.mock.calls[0][0] as string);
    // 5 階層目以降は "[depth-limit]" でカットされる（無限再帰防止）
    expect(JSON.stringify(payload.nested)).toContain("[depth-limit]");
  });
});
