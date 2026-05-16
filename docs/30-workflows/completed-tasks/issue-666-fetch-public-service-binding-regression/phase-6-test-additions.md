# Phase 6: テスト追加

[実装区分: 実装仕様書]

> Phase: 6 / 13

---

## 実装対象ファイル

`apps/web/src/lib/fetch/public.spec.ts`(既存ファイル末尾に追記)

## 実装手順

### Step 1: 共通 setup(reset 関数の env unstub 追加)

既存 `reset()` 関数(`apps/web/src/lib/fetch/public.spec.ts:23-28`)が `delete process.env.PUBLIC_API_BASE_URL` のみを行っているため、追加ガード用に `vi.unstubAllEnvs()` を `afterEach` に追加する。

```ts
afterEach(() => {
  restoreFetch();
  vi.unstubAllEnvs();  // ← 追加
  reset();
});
```

`vi.unstubAllEnvs()` は `vitest` から既に import 済(`describe`/`it`/`vi` import 行)。

### Step 2: 末尾に describe block 追加

ファイル末尾に以下を追加する。

```ts
describe("getServiceBinding env guard regression (AC-R-01..R-05)", () => {
  beforeEach(reset);
  afterEach(() => {
    restoreFetch();
    vi.unstubAllEnvs();
    reset();
  });

  // AC-R-02: production context で service binding が最優先
  it("[AC-R-02] production context: PUBLIC_API_BASE_URL 明示でも service binding が呼ばれる", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "");
    vi.stubEnv("PLAYWRIGHT_TEST", "");
    process.env.PUBLIC_API_BASE_URL = "https://wrong-fallback.example.com";

    const bindingFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };

    const globalFetchSpy = mockFetchOnce({ status: 200, body: { unexpected: true } });

    const r = await fetchPublic<{ ok: boolean }>("/health");

    expect(r).toEqual({ ok: true });
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetchSpy).not.toHaveBeenCalled();
    const [url] = bindingFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://service-binding.local/health");
  });

  // AC-R-03: CI=true 単独では service binding が優先
  it("[AC-R-03] CI without Playwright flag: PUBLIC_API_BASE_URL 明示でも service binding が呼ばれる", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "true");
    vi.stubEnv("PLAYWRIGHT_TEST", "");
    process.env.PUBLIC_API_BASE_URL = "http://127.0.0.1:8787";

    const bindingFetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };

    const globalFetchSpy = mockFetchOnce({ status: 200, body: { unexpected: true } });

    const r = await fetchPublic<{ ok: boolean }>("/health");

    expect(r).toEqual({ ok: true });
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(globalFetchSpy).not.toHaveBeenCalled();
  });

  // edge-1: staging で PUBLIC_API_BASE_URL 未設定 → service binding
  it("[edge-1] staging: PUBLIC_API_BASE_URL 未設定なら service binding が呼ばれる", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CI", "");

    const bindingFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: 1 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };

    await fetchPublic("/health");
    expect(bindingFetch).toHaveBeenCalledTimes(1);
  });

  // edge-2: local dev で service binding 不在 → HTTP fallback
  it("[edge-2] local dev: service binding 不在で global.fetch が呼ばれる", async () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.PUBLIC_API_BASE_URL = "http://localhost:8787";

    const globalFetchSpy = mockFetchOnce({ status: 200, body: { ok: 1 } });
    await fetchPublic("/health");

    expect(globalFetchSpy).toHaveBeenCalledTimes(1);
    const [url] = globalFetchSpy.mock.calls[0];
    expect(url).toBe("http://localhost:8787/health");
  });

  // edge-3: PLAYWRIGHT_TEST=1 でも HTTP fallback 優先
  it("[edge-3] PLAYWRIGHT_TEST=1: PUBLIC_API_BASE_URL 明示で global.fetch が呼ばれる", async () => {
    vi.stubEnv("PLAYWRIGHT_TEST", "1");
    process.env.PUBLIC_API_BASE_URL = "http://127.0.0.1:8787";

    const bindingFetch = vi.fn();
    cloudflareEnv.API_SERVICE = { fetch: bindingFetch as unknown as typeof fetch };

    const globalFetchSpy = mockFetchOnce({ status: 200, body: { mocked: true } });
    await fetchPublic("/health");

    expect(globalFetchSpy).toHaveBeenCalledTimes(1);
    expect(bindingFetch).not.toHaveBeenCalled();
  });
});
```

### Step 3: import 整合確認

既存 `describe('fetchPublic', ...)` block と同じ import を再利用する(`mockFetchOnce` / `restoreFetch` / `fetchPublic` / `vi`)。新規 import は追加しない。

## 実装上の注意

- `vi.stubEnv("CI", "true")` は AC-R-03 の safety case 用。`CI=true` 単独では fallback trigger にならないことを確認する。
- `process.env.PUBLIC_API_BASE_URL` の代入は `vi.stubEnv` ではなく既存 test pattern と同じく直接代入を使う(`reset()` で `delete` されるため)。
- `mockFetchOnce` の戻り値は spy(`vi.fn`)。`not.toHaveBeenCalled()` assertion に利用する。

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts
```

## 完了条件(Phase 6)

1. AC-R-02 / AC-R-03 / edge-1 / edge-2 / edge-3 の 5 ケースすべて green
2. 既存 `describe('fetchPublic', ...)` ケースも green(regression なし)
3. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
4. `mise exec -- pnpm --filter @ubm-hyogo/web lint` exit 0
