// @vitest-environment node
import { describe, expect, it } from "vitest";

import worker from "../index";
import type { Env } from "../env";

const buildCtx = (): ExecutionContext =>
  ({
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
  }) as unknown as ExecutionContext;

const buildEnv = () =>
  ({
    ENVIRONMENT: "development",
  }) as unknown as Env;

describe("mounted /me route", () => {
  it("returns 401 rather than falling through to 404 for unauthenticated GET /me", async () => {
    const res = await worker.fetch(
      new Request("https://api.test/me", { method: "GET" }),
      buildEnv(),
      buildCtx(),
    );
    expect(res.status).toBe(401);
    expect(await res.text()).not.toContain("m_");
  });

  it("redirects GET /me/ to /me before route matching", async () => {
    const res = await worker.fetch(
      new Request("https://api.test/me/", { method: "GET" }),
      buildEnv(),
      buildCtx(),
    );
    expect(res.status).toBe(308);
    expect(new URL(res.headers.get("location") ?? "", "https://api.test").pathname).toBe(
      "/me",
    );
  });

  it("keeps the root route available", async () => {
    const res = await worker.fetch(
      new Request("https://api.test/", { method: "GET" }),
      buildEnv(),
      buildCtx(),
    );
    expect(res.status).toBe(200);
  });
});
