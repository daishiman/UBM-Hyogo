import { describe, expect, it, vi } from "vitest";

import { app } from "../index";

// render を throw させ、index.ts の catch フォールバック分岐を網羅する。
vi.mock("../render", () => ({
  renderDefaultOg: vi.fn(async () => {
    throw new Error("default render failed");
  }),
  renderMemberOg: vi.fn(async () => {
    throw new Error("member render failed");
  }),
  renderStaticFallbackOg: vi.fn(
    () =>
      new Response("static-default", {
        headers: { "Content-Type": "image/png" },
      }),
  ),
}));

describe("OG worker router error fallbacks", () => {
  it("falls back to static PNG when member render throws", async () => {
    const res = await app.request(
      "/members/m-1",
      {},
      {
        API_SERVICE: {
          fetch: async () =>
            new Response(
              JSON.stringify({
                memberId: "m-1",
                summary: { fullName: "山田 太郎", occupation: "Engineer" },
              }),
              { headers: { "Content-Type": "application/json" } },
            ),
        },
      },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    await expect(res.text()).resolves.toBe("static-default");
  });

  it("falls back to static PNG when default render throws on unknown route", async () => {
    const res = await app.request("/unknown");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    await expect(res.text()).resolves.toBe("static-default");
  });
});
