import { describe, expect, it } from "vitest";
import { Hono } from "hono";

import {
  DEFAULT_HSTS_MAX_AGE,
  DEFAULT_CORS_ALLOW_HEADERS,
  DEFAULT_NO_STORE_PREFIXES,
  SECURITY_HEADERS,
  corsFromEnv,
  parseAllowedOrigins,
  securityHeaders,
} from "../security-headers";
import type { Env } from "../../env";

const buildApp = (options?: Parameters<typeof securityHeaders>[0]) => {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", securityHeaders(options));
  app.use("*", corsFromEnv());
  app.get("/", (c) => c.json({ ok: true }));
  app.get("/me", (c) => c.json({ ok: true }));
  app.get("/me/profile", (c) => c.json({ ok: true }));
  app.get("/members", (c) => c.json({ ok: true }));
  app.get("/public/form-preview", (c) => {
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ ok: true });
  });
  app.post("/admin/members", (c) => c.json({ ok: true }));
  app.get("/internal/health", (c) => c.json({ ok: true }));
  return app;
};

const env = (overrides: Partial<Env> = {}): Env =>
  ({
    DB: {} as D1Database,
    ALERT_DEDUP_KV: {} as KVNamespace,
    ALLOWED_ORIGINS: "https://app.example, https://admin.example",
    ...overrides,
  }) as Env;

describe("securityHeaders", () => {
  it("adds nosniff, referrer policy, and default HSTS to every route", async () => {
    const res = await buildApp().request("/", {}, env());

    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      `max-age=${DEFAULT_HSTS_MAX_AGE}; includeSubDomains`,
    );
  });

  it("uses custom HSTS max-age", async () => {
    const res = await buildApp({ hstsMaxAge: 60 }).request("/", {}, env());

    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=60; includeSubDomains",
    );
  });

  it("adds no-store for protected path prefixes when Cache-Control is absent", async () => {
    const app = buildApp();

    const me = await app.request("/me/profile", {}, env());
    const admin = await app.request("/admin/members", { method: "POST" }, env());
    const internal = await app.request("/internal/health", {}, env());

    expect(me.headers.get("Cache-Control")).toBe("no-store");
    expect(admin.headers.get("Cache-Control")).toBe("no-store");
    expect(internal.headers.get("Cache-Control")).toBe("no-store");
  });

  it("matches exact protected prefixes and does not match partial public prefixes", async () => {
    const app = buildApp();

    const exact = await app.request("/me", {}, env());
    const publicPath = await app.request("/members", {}, env());

    expect(exact.headers.get("Cache-Control")).toBe("no-store");
    expect(publicPath.headers.get("Cache-Control")).toBeNull();
  });

  it("does not overwrite an existing Cache-Control header", async () => {
    const res = await buildApp().request("/public/form-preview", {}, env());

    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("supports custom no-store prefixes", async () => {
    const res = await buildApp({ noStorePrefixes: ["/members"] }).request(
      "/members",
      {},
      env(),
    );

    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("exports the canonical constants used by tests and implementation", () => {
    expect(SECURITY_HEADERS).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });
    expect(DEFAULT_HSTS_MAX_AGE).toBe(31_536_000);
    expect(DEFAULT_NO_STORE_PREFIXES).toEqual([
      "/me",
      "/auth",
      "/admin",
      "/internal",
    ]);
  });
});

describe("parseAllowedOrigins", () => {
  it("parses comma-separated origins, trims whitespace, and drops empty entries", () => {
    expect(
      parseAllowedOrigins(" https://a.example,https://b.example ,, https://c.example "),
    ).toEqual(["https://a.example", "https://b.example", "https://c.example"]);
  });

  it("returns an empty allowlist for undefined or empty input", () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins("")).toEqual([]);
    expect(parseAllowedOrigins(" , , ")).toEqual([]);
  });
});

describe("corsFromEnv", () => {
  it("echoes Access-Control-Allow-Origin for an allowlisted origin", async () => {
    const res = await buildApp().request(
      "/",
      { headers: { Origin: "https://app.example" } },
      env(),
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://app.example",
    );
    expect(res.headers.get("Vary")).toContain("Origin");
  });

  it("does not emit CORS allow headers for non-allowlisted origins", async () => {
    const res = await buildApp().request(
      "/",
      { headers: { Origin: "https://evil.example" } },
      env(),
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Methods")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Headers")).toBeNull();
  });

  it("denies by default when ALLOWED_ORIGINS is missing", async () => {
    const res = await buildApp().request(
      "/",
      { headers: { Origin: "https://app.example" } },
      { DB: {} as D1Database, ALERT_DEDUP_KV: {} as KVNamespace } as Env,
    );

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("returns preflight CORS headers for an allowlisted origin", async () => {
    const res = await buildApp().request(
      "/admin/members",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://admin.example",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
      },
      env(),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://admin.example",
    );
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
      DEFAULT_CORS_ALLOW_HEADERS.join(","),
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("returns preflight without CORS allow headers for denied origins", async () => {
    const res = await buildApp().request(
      "/admin/members",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example",
          "Access-Control-Request-Headers": "authorization",
        },
      },
      env(),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Methods")).toBeNull();
    expect(res.headers.get("Access-Control-Allow-Headers")).toBeNull();
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("uses exact origin matching only", async () => {
    const app = buildApp();
    const partial = await app.request(
      "/",
      { headers: { Origin: "https://app.example.evil.test" } },
      env(),
    );
    const protocolMismatch = await app.request(
      "/",
      { headers: { Origin: "http://app.example" } },
      env(),
    );

    expect(partial.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(protocolMismatch.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
