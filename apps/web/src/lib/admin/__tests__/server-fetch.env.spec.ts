import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

const cloudflareContext = vi.fn();
const cookies = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

import { fetchAdmin } from "../server-fetch";

const baseEnv = {
  ENVIRONMENT: "staging",
  NEXT_PUBLIC_API_BASE_URL: "https://web.example.test",
  PUBLIC_API_BASE_URL: "https://public.example.test",
  INTERNAL_API_BASE_URL: "https://api.example.test/",
  INTERNAL_AUTH_SECRET: "internal-secret",
  AUTH_URL: "https://web.example.test",
  SENTRY_ENVIRONMENT: "staging",
  SENTRY_TRACES_SAMPLE_RATE: "0.1",
};

describe("fetchAdmin env resolution", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    cloudflareContext.mockReset();
    cookies.mockReset();
    cookies.mockResolvedValue({ toString: () => "session=abc" });
  });

  it("uses getEnv() Cloudflare bindings for base URL and internal auth", async () => {
    cloudflareContext.mockReturnValue({ env: baseEnv });
    const fetchMock = vi.fn(async () => Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdmin("/admin/members")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/admin/members", {
      method: "GET",
      headers: {
        "x-internal-auth": "internal-secret",
        accept: "application/json",
        cookie: "session=abc",
      },
      cache: "no-store",
    });
  });

  it("does not fall back to 127.0.0.1 when INTERNAL_API_BASE_URL is missing", async () => {
    cloudflareContext.mockReturnValue({
      env: { ...baseEnv, INTERNAL_API_BASE_URL: undefined },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAdmin("/admin/members")).rejects.toThrow(ZodError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
