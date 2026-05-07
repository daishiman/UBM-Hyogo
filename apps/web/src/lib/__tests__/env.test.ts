import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const cloudflareContext = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import { getEnv, getPublicEnv, readRawEnv } from "../env";

const validEnv = {
  ENVIRONMENT: "local",
  NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
  PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
  INTERNAL_API_BASE_URL: "http://127.0.0.1:8787",
  AUTH_URL: "http://127.0.0.1:3000",
  SENTRY_ENVIRONMENT: "local",
  SENTRY_TRACES_SAMPLE_RATE: "1.0",
};

describe("env", () => {
  beforeEach(() => {
    cloudflareContext.mockReset();
    cloudflareContext.mockImplementation(() => {
      throw new Error("not in workers");
    });
  });

  it("getEnv parses the required keys", () => {
    expect(getEnv(validEnv)).toMatchObject({
      ENVIRONMENT: "local",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
      SENTRY_TRACES_SAMPLE_RATE: 1,
    });
  });

  it("getEnv throws ZodError for invalid URL values", () => {
    expect(() =>
      getEnv({ ...validEnv, NEXT_PUBLIC_API_BASE_URL: "not-a-url" }),
    ).toThrow(ZodError);
  });

  it("getEnv throws ZodError for out-of-range sample rate", () => {
    expect(() =>
      getEnv({ ...validEnv, SENTRY_TRACES_SAMPLE_RATE: "1.5" }),
    ).toThrow(ZodError);
  });

  it("getEnv allows optional secrets to be absent", () => {
    const env = getEnv(validEnv);
    expect(env.SENTRY_DSN_WEB).toBeUndefined();
    expect(env.AUTH_SECRET).toBeUndefined();
  });

  it("readRawEnv prefers Cloudflare env when available", () => {
    cloudflareContext.mockImplementation(() => ({
      env: { ...validEnv, ENVIRONMENT: "staging" },
    }));
    expect(readRawEnv()).toMatchObject({ ENVIRONMENT: "staging" });
  });

  it("getPublicEnv returns only the public subset", () => {
    expect(getPublicEnv({ ...validEnv, AUTH_SECRET: "x".repeat(32) })).toEqual({
      ENVIRONMENT: "local",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
    });
  });
});
