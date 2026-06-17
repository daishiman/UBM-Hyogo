// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

import * as logger from "@ubm-hyogo/shared/logging";
import { notFoundHandler } from "./error-handler";

function buildApp() {
  const app = new Hono<{ Bindings: { ENVIRONMENT?: string } }>();
  app.notFound(notFoundHandler);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("notFoundHandler", () => {
  it("NF-1: logs route-not-matched reason/method/path context", async () => {
    const logSpy = vi.spyOn(logger, "logError").mockImplementation(() => {});
    const app = buildApp();

    await app.request("/me", { method: "GET" }, { ENVIRONMENT: "staging" });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "UBM-1404",
        context: expect.objectContaining({
          reason: "route_not_matched",
          method: "GET",
          path: "/me",
        }),
      }),
    );
  });

  it("NF-2: records hasSessionCookie=true without leaking the cookie value", async () => {
    const logSpy = vi.spyOn(logger, "logError").mockImplementation(() => {});
    const app = buildApp();

    await app.request(
      "/me",
      {
        method: "GET",
        headers: {
          cookie: "__Secure-authjs.session-token=dummy-session-secret-value",
        },
      },
      { ENVIRONMENT: "staging" },
    );

    const payload = logSpy.mock.calls[0]?.[0];
    expect(payload?.context).toMatchObject({ hasSessionCookie: true });
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      "dummy-session-secret-value",
    );
  });

  it("NF-3: records hasAuthorization=true without leaking the bearer value", async () => {
    const logSpy = vi.spyOn(logger, "logError").mockImplementation(() => {});
    const app = buildApp();

    await app.request(
      "/me",
      {
        method: "GET",
        headers: {
          authorization: "Bearer dummy-bearer-secret-value",
        },
      },
      { ENVIRONMENT: "staging" },
    );

    const payload = logSpy.mock.calls[0]?.[0];
    expect(payload?.context).toMatchObject({ hasAuthorization: true });
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain(
      "dummy-bearer-secret-value",
    );
  });

  it("NF-4: keeps the 404 response contract (status/body/content-type) unchanged", async () => {
    vi.spyOn(logger, "logError").mockImplementation(() => {});
    const app = buildApp();

    const res = await app.request("/me", { method: "GET" }, {});

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    expect(await res.json()).toMatchObject({ code: "UBM-1404" });
  });

  it("NF-5: defaults both diagnostic booleans to false without cookie/authorization", async () => {
    const logSpy = vi.spyOn(logger, "logError").mockImplementation(() => {});
    const app = buildApp();

    await app.request("/me", { method: "GET" }, { ENVIRONMENT: "staging" });

    const payload = logSpy.mock.calls[0]?.[0];
    expect(payload?.context).toMatchObject({
      hasAuthorization: false,
      hasSessionCookie: false,
    });
  });
});
