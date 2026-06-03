// @vitest-environment node
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { trailingSlashRedirect } from "../trailing-slash";

const buildApp = () => {
  const app = new Hono();
  app.use("*", trailingSlashRedirect());
  app.get("/", (c) => c.text("root"));
  app.get("/me", (c) => c.text("me"));
  app.options("/me/", (c) => c.body(null, 204));
  return app;
};

const locationUrl = (res: Response) =>
  new URL(res.headers.get("location") ?? "", "http://localhost");

describe("trailingSlashRedirect", () => {
  it("redirects a trailing-slash path to its normalized path", async () => {
    const res = await buildApp().request("/me/", { method: "GET" });
    expect(res.status).toBe(308);
    expect(locationUrl(res).pathname).toBe("/me");
  });

  it("preserves query parameters when redirecting", async () => {
    const res = await buildApp().request("/me/?limit=5", { method: "GET" });
    expect(res.status).toBe(308);
    const location = locationUrl(res);
    expect(location.pathname).toBe("/me");
    expect(location.search).toBe("?limit=5");
  });

  it("passes through paths without trailing slash", async () => {
    const res = await buildApp().request("/me", { method: "GET" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("me");
  });

  it("does not redirect the root path", async () => {
    const res = await buildApp().request("/", { method: "GET" });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("root");
  });

  it("normalizes multiple trailing slashes", async () => {
    const res = await buildApp().request("/me//", { method: "GET" });
    expect(res.status).toBe(308);
    expect(locationUrl(res).pathname).toBe("/me");
  });

  it("passes through OPTIONS requests", async () => {
    const res = await buildApp().request("/me/", { method: "OPTIONS" });
    expect(res.status).toBe(204);
  });
});
