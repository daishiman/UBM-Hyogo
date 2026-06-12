import { describe, expect, it, vi } from "vitest";

import { fetchMemberSummary, type OgEnv } from "../member-source";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("fetchMemberSummary", () => {
  it.each(["", "   "])("returns null for blank member id %#", async (id) => {
    await expect(fetchMemberSummary(id, {})).resolves.toBeNull();
  });

  it("uses API_SERVICE when bound", async () => {
    const serviceFetch = vi.fn().mockResolvedValue(
      jsonResponse({
        memberId: "m-1",
        summary: { fullName: "山田 太郎", occupation: "Engineer" },
      }),
    );
    const env: OgEnv = {
      API_SERVICE: { fetch: serviceFetch },
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.invalid",
      INTERNAL_AUTH_SECRET: "internal-secret",
    };

    await expect(fetchMemberSummary("m-1", env)).resolves.toMatchObject({
      id: "m-1",
      fullName: "山田 太郎",
      occupation: "Engineer",
    });
    expect(serviceFetch).toHaveBeenCalledTimes(1);
    const request = serviceFetch.mock.calls[0]?.[0] as Request;
    expect(request.headers.get("X-Internal-Auth")).toBe("internal-secret");
  });

  it("falls back to NEXT_PUBLIC_API_BASE_URL without a service binding", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        memberId: "m-2",
        summary: { fullName: "佐藤 花子", ubmZone: "1_to_10" },
      }),
    ) as unknown as typeof fetch;

    await expect(
      fetchMemberSummary(
        "m 2",
        {
          NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/",
          INTERNAL_AUTH_SECRET: "internal-secret",
        },
        fetchImpl,
      ),
    ).resolves.toMatchObject({ id: "m-2", fullName: "佐藤 花子" });
    expect(vi.mocked(fetchImpl).mock.calls[0]?.[0]).toBe(
      "https://api.example.test/public/members/m%202",
    );
    expect(vi.mocked(fetchImpl).mock.calls[0]?.[1]).toMatchObject({
      headers: { "X-Internal-Auth": "internal-secret" },
    });
  });

  it("returns null for 404, broken json, network error, missing config, or missing summary", async () => {
    await expect(
      fetchMemberSummary("m", { NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" }, vi.fn().mockResolvedValue(new Response("{}", { status: 404 })) as unknown as typeof fetch),
    ).resolves.toBeNull();
    await expect(
      fetchMemberSummary("m", { NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" }, vi.fn().mockResolvedValue(new Response("{")) as unknown as typeof fetch),
    ).resolves.toBeNull();
    await expect(
      fetchMemberSummary("m", { NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" }, vi.fn().mockRejectedValue(new Error("boom")) as unknown as typeof fetch),
    ).resolves.toBeNull();
    await expect(fetchMemberSummary("m", {})).resolves.toBeNull();
    await expect(
      fetchMemberSummary("m", { NEXT_PUBLIC_API_BASE_URL: "https://api.example.test" }, vi.fn().mockResolvedValue(jsonResponse({ summary: { occupation: "Engineer" } })) as unknown as typeof fetch),
    ).resolves.toBeNull();
  });
});
