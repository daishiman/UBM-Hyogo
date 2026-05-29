# Phase 6 — テスト追加

## ファイル

`apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts`

## 構成方針

- `vi.mock("next/headers", () => ({ cookies: async () => ({ toString: () => "session=mock" }) }))`
- `vi.mock("../../env", () => ({ getEnv: vi.fn(), getPublicFetchEnv: vi.fn() }))` で必須 server env と transport env を case ごとに切替
- global `fetch` は `vi.fn()` で stub
- service-binding は `{ fetch: vi.fn() }` を `getPublicFetchEnv` mock から返す

## ケース骨子(疑似コード)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "session=mock" }),
}));
vi.mock("../../env", () => ({ getEnv: vi.fn(), getPublicFetchEnv: vi.fn() }));

import { fetchAdmin } from "../server-fetch";
import { getEnv, getPublicFetchEnv } from "../../env";

const baseEnv = {
  INTERNAL_API_BASE_URL: "https://ubm-hyogo-api-staging.daishimanju.workers.dev",
  INTERNAL_AUTH_SECRET: "secret",
};

beforeEach(() => {
  vi.restoreAllMocks();
  (getEnv as any).mockReturnValue(baseEnv);
  (getPublicFetchEnv as any).mockReturnValue({ NODE_ENV: "production" });
});

describe("fetchAdmin service-binding 経路", () => {
  it("production + API_SERVICE 提供時は binding.fetch を呼ぶ", async () => {
    const bindingFetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    (getPublicFetchEnv as any).mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());
    await fetchAdmin("/admin/meetings");
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch).not.toHaveBeenCalled();
    const [, init] = bindingFetch.mock.calls[0];
    expect((init.headers as Record<string, string>)["x-internal-auth"]).toBe("secret");
    expect((init.headers as Record<string, string>)["cookie"]).toBe("session=mock");
  });

  it("API_SERVICE 未提供時は global fetch を呼ぶ", async () => {
    (getPublicFetchEnv as any).mockReturnValue({ NODE_ENV: "production" });
    const globalFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await fetchAdmin("/admin/meetings");
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch.mock.calls[0][0]).toBe(
      "https://ubm-hyogo-api-staging.daishimanju.workers.dev/admin/meetings",
    );
  });

  it("NODE_ENV=test では service-binding 提供時でも global fetch を使う", async () => {
    const bindingFetch = vi.fn();
    (getPublicFetchEnv as any).mockReturnValue({
      NODE_ENV: "test",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await fetchAdmin("/admin/meetings");
    expect(bindingFetch).not.toHaveBeenCalled();
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("PLAYWRIGHT_TEST=1 でも global fetch を使う", async () => {
    const bindingFetch = vi.fn();
    (getPublicFetchEnv as any).mockReturnValue({
      NODE_ENV: "production",
      PLAYWRIGHT_TEST: "1",
      API_SERVICE: { fetch: bindingFetch },
    });
    const globalFetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await fetchAdmin("/admin/meetings");
    expect(bindingFetch).not.toHaveBeenCalled();
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("error path で body snippet が含まれる", async () => {
    const bindingFetch = vi.fn(
      async () => new Response("not found long body", { status: 404 }),
    );
    (getPublicFetchEnv as any).mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });
    await expect(fetchAdmin("/admin/meetings")).rejects.toThrow(
      /admin api \/admin\/meetings failed: 404 body=not found long body/,
    );
  });

  it("POST / body / content-type が透過する", async () => {
    const bindingFetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    (getPublicFetchEnv as any).mockReturnValue({
      NODE_ENV: "production",
      API_SERVICE: { fetch: bindingFetch },
    });
    await fetchAdmin("/admin/meetings", { method: "POST", body: { title: "x" } });
    const [, init] = bindingFetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "x" }));
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });
});
```

## 期待値

- 6 ケース全 pass
- 既存 admin spec 0 regression
