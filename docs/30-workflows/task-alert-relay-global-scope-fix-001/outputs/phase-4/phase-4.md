# Phase 4: テスト設計

## テスト対象

`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

## 既存テストへの影響

既存 23+ ケースは `isolateId` を **string として読む** だけで具体値を assert していないため、lazy 化により**変更不要**。全ケースが現行のまま pass する想定。

`parseStructuredWarn` helper (line 47-58) の `isolateId: string` 期待は維持される。

## 追加テスト (TDD Red → Green)

### TC-GS-01: module load 時に `crypto.randomUUID` を呼ばないこと

```ts
describe("global scope safety (validation error 10021 regression guard)", () => {
  it("does not invoke crypto.randomUUID during module import", async () => {
    // arrange: spy before import
    vi.resetModules();
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID");

    // act: re-import module
    await import("../alert-relay");

    // assert
    expect(randomUUIDSpy).not.toHaveBeenCalled();
    randomUUIDSpy.mockRestore();
  });
});
```

### TC-GS-02: isolate 内で `isolateId` が stable

```ts
it("emits the same isolateId across multiple log events within one isolate", async () => {
  // Existing current-code anchors:
  // - createKvStub({ putError }) from ../../../../test/helpers/kv-stub
  // - buildEnv({ kv }), headers(), parseStructuredWarnAt() in this spec
  // - createAlertRelayRoute() direct route app, not mounted worker, to keep path "/"
  const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const kv = createKvStub({
    now: () => 1_715_000_000_000,
    putError: () => new Error("KV put failure"),
  });
  const app = createAlertRelayRoute({
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async () => {},
    now: () => 1_715_000_000_000,
  });
  try {
    for (const policyId of ["policy-log05-a", "policy-log05-b"]) {
      await app.request("/", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "X", policy_id: policyId, ts: 1_715_000_000_000 }),
      }, buildEnv({ kv }));
    }
    expect(warnSpy).toHaveBeenCalledTimes(2);
    const first = parseStructuredWarnAt(warnSpy, 0);
    const second = parseStructuredWarnAt(warnSpy, 1);
    expect(first.isolateId).toBe(second.isolateId);
    expect(first.isolateId).toMatch(/^[0-9a-f-]{36}$/);
  } finally {
    warnSpy.mockRestore();
  }
});
```

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec.ts
```

期待結果:
- TC-GS-01: PASS (lazy init 後)
- TC-GS-02: PASS
- 既存ケース: 全 PASS (no regression)

## カバレッジ目標

`alert-relay.ts` の `getIsolateId` 関数: line 100% / branch 100% (初回呼び出し分岐と cache hit 分岐の双方を TC-GS-02 で踏む)
