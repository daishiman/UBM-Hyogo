import { describe, expect, it, vi } from "vitest";

import { app } from "../index";

vi.mock("../render", () => ({
  renderDefaultOg: vi.fn(async () => new Response("default", { headers: { "Content-Type": "image/png" } })),
  renderMemberOg: vi.fn(async () => new Response("member", { headers: { "Content-Type": "image/png" } })),
  renderStaticFallbackOg: vi.fn(() => new Response("static-default", { headers: { "Content-Type": "image/png" } })),
}));

describe("OG worker router", () => {
  it("returns health status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, service: "ubm-hyogo-og" });
  });

  it("renders member OG from public API summary", async () => {
    const res = await app.request(
      "/members/m-1",
      {},
      {
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.test",
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
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
    await expect(res.text()).resolves.toBe("member");
  });

  it("falls back to default image when member is unknown", async () => {
    const res = await app.request(
      "/members/missing",
      {},
      {
        API_SERVICE: {
          fetch: async () => new Response("not found", { status: 404 }),
        },
      },
    );
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toBe("default");
  });

  it("returns default image for unknown routes", async () => {
    const res = await app.request("/unknown");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
  });
});
