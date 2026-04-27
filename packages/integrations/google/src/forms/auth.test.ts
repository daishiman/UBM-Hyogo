import { describe, expect, it, vi } from "vitest";

import { createTokenSource } from "./auth";

const env = { FORMS_SA_EMAIL: "sa@project.iam", FORMS_SA_KEY: "PRIVATE_KEY" };

describe("createTokenSource (AC-8)", () => {
  it("signs JWT, hits token endpoint, returns access_token", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "ya29.token", expires_in: 3600 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ) as unknown as typeof fetch;
    const sign = vi.fn().mockResolvedValue("signed.jwt.value");
    const source = createTokenSource(env, {
      fetchImpl,
      signer: { sign },
      now: () => 1_700_000_000,
    });
    const token = await source.getAccessToken();
    expect(token).toBe("ya29.token");
    expect(sign).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("caches token until expiry minus skew", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: "cached", expires_in: 3600 }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;
    let nowSec = 1_000_000;
    const source = createTokenSource(env, {
      fetchImpl,
      signer: { sign: async () => "jwt" },
      now: () => nowSec,
    });
    expect(await source.getAccessToken()).toBe("cached");
    nowSec += 60; // far before expiry
    expect(await source.getAccessToken()).toBe("cached");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rethrows when token endpoint returns 4xx", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("bad", { status: 401 }),
    ) as unknown as typeof fetch;
    const source = createTokenSource(env, {
      fetchImpl,
      signer: { sign: async () => "jwt" },
      now: () => 0,
    });
    await expect(source.getAccessToken()).rejects.toThrow(/401/);
  });

  it("rethrows when access_token missing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ expires_in: 3600 }), { status: 200 }),
    ) as unknown as typeof fetch;
    const source = createTokenSource(env, {
      fetchImpl,
      signer: { sign: async () => "jwt" },
      now: () => 0,
    });
    await expect(source.getAccessToken()).rejects.toThrow(/access_token/);
  });
});
