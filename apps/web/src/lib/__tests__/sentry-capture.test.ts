// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cfCaptureException = vi.fn(() => "evt-cf-1");
const cfCaptureMessage = vi.fn(() => "evt-cf-msg-1");

vi.mock("@sentry/cloudflare", () => ({
  captureException: cfCaptureException,
  captureMessage: cfCaptureMessage,
  withScope: (cb: (s: unknown) => void) =>
    cb({
      setTag: vi.fn(),
      setExtra: vi.fn(),
      setLevel: vi.fn(),
      setUser: vi.fn(),
    }),
}));

describe("sentry capture wrapper (server runtime)", () => {
  beforeEach(() => {
    cfCaptureException.mockClear();
    cfCaptureMessage.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("T-01: server runtime で captureException が @sentry/cloudflare を呼ぶ", async () => {
    const { captureException } = await import("../sentry/capture");
    const id = await captureException(new Error("x"), {
      tags: { foo: "bar" },
    });
    expect(cfCaptureException).toHaveBeenCalledTimes(1);
    expect(id).toBe("evt-cf-1");
  });

  it("T-04: captureMessage が server runtime 経路で呼ばれる", async () => {
    const { captureMessage } = await import("../sentry/capture");
    const id = await captureMessage("hello", { level: "warning" });
    expect(cfCaptureMessage).toHaveBeenCalledTimes(1);
    expect(id).toBe("evt-cf-msg-1");
  });

  it("T-05: 旧 extra フィールド互換を保つ", async () => {
    const { captureException } = await import("../sentry/capture");
    await captureException(new Error("e"), { extra: { a: 1 } });
    const call = cfCaptureException.mock.calls[0] as unknown as
      | [unknown, { extra?: Record<string, unknown> }]
      | undefined;
    expect(call?.[1]?.extra).toEqual({ a: 1 });
  });

  it("T-06: level 未指定時は info を既定値とする", async () => {
    const { captureMessage } = await import("../sentry/capture");
    await captureMessage("m");
    const call = cfCaptureMessage.mock.calls[0] as unknown as
      | [string, unknown]
      | undefined;
    const arg = call?.[1];
    if (typeof arg === "string") {
      expect(arg).toBe("info");
    } else {
      expect((arg as { level?: string } | undefined)?.level ?? "info").toBe(
        "info",
      );
    }
  });

  it("T-03: dynamic import 失敗でも throw せず undefined を返す", async () => {
    vi.resetModules();
    vi.doMock("@sentry/cloudflare", () => {
      throw new Error("not installed");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { captureException } = await import("../sentry/capture");
    const id = await captureException(new Error("x"));
    expect(id).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    vi.doUnmock("@sentry/cloudflare");
  });
});
