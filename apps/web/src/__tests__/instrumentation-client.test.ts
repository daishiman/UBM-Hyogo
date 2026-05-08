// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initSpy = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init: initSpy,
}));

describe("instrumentation-client browser init guard", () => {
  beforeEach(() => {
    initSpy.mockClear();
    vi.resetModules();
    delete window.__ubmSentryInitialized__;
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://browser@example.test/1";
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT = "staging";
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE = "0.2";
  });

  afterEach(() => {
    delete window.__ubmSentryInitialized__;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
    delete process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  });

  it("T-02: browser runtime initializes @sentry/nextjs once", async () => {
    await import("../instrumentation-client");
    await import("../instrumentation-client");

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith({
      dsn: "https://browser@example.test/1",
      environment: "staging",
      tracesSampleRate: 0.2,
    });
    expect(window.__ubmSentryInitialized__).toBe(true);
  });

  it("T-09: missing browser DSN skips init but settles the guard", async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    await import("../instrumentation-client");

    expect(initSpy).toHaveBeenCalledTimes(0);
    expect(window.__ubmSentryInitialized__).toBe(true);
  });
});
