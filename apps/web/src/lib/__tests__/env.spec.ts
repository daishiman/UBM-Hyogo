import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const cloudflareContext = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import {
  getAuthEnv,
  getEnv,
  getPublicEnv,
  getPublicFetchEnv,
  getSecurityHeaderEnv,
  readRawEnv,
} from "../env";

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
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
    expect(env.NEXT_PUBLIC_SENTRY_ENVIRONMENT).toBeUndefined();
    expect(env.AUTH_SECRET).toBeUndefined();
    expect(env.INTERNAL_AUTH_SECRET).toBeUndefined();
  });

  it("getEnv parses INTERNAL_AUTH_SECRET when supplied", () => {
    const env = getEnv({ ...validEnv, INTERNAL_AUTH_SECRET: "internal-secret" });
    expect(env.INTERNAL_AUTH_SECRET).toBe("internal-secret");
  });

  it("getEnv parses optional auth provider keys when supplied", () => {
    const env = getEnv({
      ...validEnv,
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      AUTH_GOOGLE_ID: "agid",
      AUTH_GOOGLE_SECRET: "agsec",
    });
    expect(env).toMatchObject({
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      AUTH_GOOGLE_ID: "agid",
      AUTH_GOOGLE_SECRET: "agsec",
    });
  });

  it("getEnv parses NEXT_PUBLIC_SENTRY_DSN when supplied as a valid URL", () => {
    const env = getEnv({
      ...validEnv,
      NEXT_PUBLIC_SENTRY_DSN: "https://abc123@o0.ingest.sentry.io/1",
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: "staging",
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "0.2",
    });
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe("https://abc123@o0.ingest.sentry.io/1");
    expect(env.NEXT_PUBLIC_SENTRY_ENVIRONMENT).toBe("staging");
    expect(env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE).toBe(0.2);
  });

  it("getPublicEnv exposes the public Sentry DSN for CSP report endpoint derivation", () => {
    expect(
      getPublicEnv({
        ...validEnv,
        NEXT_PUBLIC_SENTRY_DSN: "https://abc123@o0.ingest.sentry.io/1",
      }),
    ).toEqual({
      ENVIRONMENT: "local",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
      NEXT_PUBLIC_SENTRY_DSN: "https://abc123@o0.ingest.sentry.io/1",
    });
  });

  it("getEnv throws ZodError for invalid NEXT_PUBLIC_SENTRY_DSN", () => {
    expect(() =>
      getEnv({ ...validEnv, NEXT_PUBLIC_SENTRY_DSN: "not-a-url" }),
    ).toThrow(ZodError);
  });

  it("getEnv throws ZodError for unknown NEXT_PUBLIC_SENTRY_ENVIRONMENT", () => {
    expect(() =>
      getEnv({ ...validEnv, NEXT_PUBLIC_SENTRY_ENVIRONMENT: "qa" }),
    ).toThrow(ZodError);
  });

  it("getEnv throws ZodError for out-of-range NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE", () => {
    expect(() =>
      getEnv({ ...validEnv, NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "2" }),
    ).toThrow(ZodError);
  });

  it("readRawEnv prefers Cloudflare env when available", () => {
    cloudflareContext.mockImplementation(() => ({
      env: { ...validEnv, ENVIRONMENT: "staging" },
    }));
    expect(readRawEnv()).toMatchObject({ ENVIRONMENT: "staging" });
  });

  it("readRawEnv lets process.env override Cloudflare env under PLAYWRIGHT_TEST", () => {
    // Playwright e2e は webServer に INTERNAL_API_BASE_URL=mock を process.env 注入する。
    // OpenNext dev の cloudflare context（本番 URL）より process.env を優先させる。
    cloudflareContext.mockImplementation(() => ({
      env: {
        ...validEnv,
        INTERNAL_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
      },
    }));
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://127.0.0.1:8787");
    try {
      expect(readRawEnv()).toMatchObject({
        INTERNAL_API_BASE_URL: "http://127.0.0.1:8787",
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("readRawEnv keeps Cloudflare env when PLAYWRIGHT_TEST is unset", () => {
    cloudflareContext.mockImplementation(() => ({
      env: {
        ...validEnv,
        INTERNAL_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
      },
    }));
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://127.0.0.1:8787");
    try {
      expect(readRawEnv()).toMatchObject({
        INTERNAL_API_BASE_URL: "https://ubm-hyogo-api.daishimanju.workers.dev",
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("getPublicEnv returns only the public subset", () => {
    expect(getPublicEnv({ ...validEnv, AUTH_SECRET: "x".repeat(32) })).toEqual({
      ENVIRONMENT: "local",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8787",
      NEXT_PUBLIC_SENTRY_DSN: undefined,
    });
  });

  it("getSecurityHeaderEnv defaults CSP_MODE to report-only", () => {
    expect(getSecurityHeaderEnv(validEnv)).toEqual({
      cspMode: "report-only",
      apiBaseUrl: "http://127.0.0.1:8787",
    });
  });

  it("getSecurityHeaderEnv returns enforce when CSP_MODE is enforce", () => {
    expect(getSecurityHeaderEnv({ ...validEnv, CSP_MODE: "enforce" })).toEqual({
      cspMode: "enforce",
      apiBaseUrl: "http://127.0.0.1:8787",
    });
  });

  it("getSecurityHeaderEnv throws ZodError for invalid CSP_MODE", () => {
    expect(() =>
      getSecurityHeaderEnv({ ...validEnv, CSP_MODE: "invalid-value" }),
    ).toThrow(ZodError);
  });

  it("getAuthEnv returns auth keys and service binding without throwing", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    expect(
      getAuthEnv({
        ENVIRONMENT: "staging",
        AUTH_URL: "https://web.example.com",
        AUTH_SECRET: "0123456789abcdef",
        GOOGLE_CLIENT_ID: "gid",
        GOOGLE_CLIENT_SECRET: "gsec",
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "internal",
        API_SERVICE: binding,
      }),
    ).toMatchObject({
      ENVIRONMENT: "staging",
      AUTH_URL: "https://web.example.com",
      AUTH_SECRET: "0123456789abcdef",
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      INTERNAL_API_BASE_URL: "https://api.example.com",
      INTERNAL_AUTH_SECRET: "internal",
      API_SERVICE: binding,
    });
  });

  it("getAuthEnv fail-closes to an empty object on invalid auth config", () => {
    expect(
      getAuthEnv({
        ENVIRONMENT: "qa",
        AUTH_URL: "not-a-url",
        INTERNAL_API_BASE_URL: "also-not-a-url",
      }),
    ).toEqual({});
  });

  it("getPublicFetchEnv keeps public fetch resolution in env.ts", () => {
    const binding = { fetch: vi.fn() as unknown as typeof fetch };
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PUBLIC_API_BASE_URL", "https://process.example.com");
    try {
      expect(
        getPublicFetchEnv({
          API_SERVICE: binding,
          PUBLIC_API_BASE_URL: "https://cloudflare.example.com",
        }),
      ).toEqual({
        API_SERVICE: binding,
        PUBLIC_API_BASE_URL: "https://process.example.com",
        NODE_ENV: "test",
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
