// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initSpy = vi.fn();
const requiredEnv = {
  ENVIRONMENT: "local",
  NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
  PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
  INTERNAL_API_BASE_URL: "http://127.0.0.1:8787",
  AUTH_URL: "http://127.0.0.1:3000",
  SENTRY_ENVIRONMENT: "local",
  SENTRY_TRACES_SAMPLE_RATE: "1.0",
} as const;

vi.mock("@sentry/cloudflare", () => ({
  init: initSpy,
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe("instrumentation register() guard", () => {
  beforeEach(() => {
    initSpy.mockClear();
    delete (globalThis as { __ubmSentryInitialized__?: boolean })
      .__ubmSentryInitialized__;
    process.env.NEXT_RUNTIME = "nodejs";
    process.env.SENTRY_DSN_WEB = "https://test@example.test/1";
    for (const [key, value] of Object.entries(requiredEnv)) {
      process.env[key] = value;
    }
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN_WEB;
    delete process.env.NEXT_RUNTIME;
    for (const key of Object.keys(requiredEnv)) {
      delete process.env[key];
    }
  });

  it("T-07: 2 回呼び出しても Sentry.init が 1 回しか呼ばれない", async () => {
    const { register } = await import("../instrumentation");
    await register();
    await register();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(
      (globalThis as { __ubmSentryInitialized__?: boolean })
        .__ubmSentryInitialized__,
    ).toBe(true);
  });

  it("T-08: DSN 未設定時は init を呼ばない", async () => {
    delete process.env.SENTRY_DSN_WEB;
    const { register } = await import("../instrumentation");
    await register();
    expect(initSpy).toHaveBeenCalledTimes(0);
  });
});
