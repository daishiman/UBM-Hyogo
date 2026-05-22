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
    logger.warn({ event: "z" });
    expect(captureMessage).toHaveBeenCalledWith(
      "z",
      expect.objectContaining({ level: "warning" }),
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
});
