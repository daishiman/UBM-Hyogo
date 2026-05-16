# Phase 6 成果物: 実装手順 (完成形 snippet)

## S1: `alert-relay.ts` 冒頭に isolateId / textEncoder を追加

```ts
const isolateId = crypto.randomUUID();
const textEncoder = new TextEncoder();
```

import 群の直下、`AlertRelayEnv` interface 定義の直前に配置する。

## S2: module-local helper 群を追加

```ts
async function computeDedupeKeyHash(dedupeKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(dedupeKey));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  try {
    console.warn(JSON.stringify({
      event: "alert_relay_kv_op_failed",
      op,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      dedupeKeyHash: await computeDedupeKeyHash(dedupeKey),
      isolateId,
      ts: new Date().toISOString(),
    }));
  } catch {
    console.warn(JSON.stringify({
      event: "alert_relay_kv_op_failed",
      op,
      errorClass: err instanceof Error ? err.constructor.name : typeof err,
      dedupeKeyHash: "hash_error",
      isolateId,
      ts: new Date().toISOString(),
    }));
  }
}
```

`AlertRelayDeps` interface の直後、`createAlertRelayRoute` 関数の直前に配置する。

## S3: `KV.get` を try/catch + fail-open に置換

旧:

```ts
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

新:

```ts
let seen: string | null = null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
}
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
```

## S4: `KV.put` catch を helper 置換

旧:

```ts
} catch (error) {
  console.warn("alert relay dedup KV put failed after Slack delivery", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

新:

```ts
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

## S5: テスト追加 (`alert-relay.spec.ts`)

ファイル冒頭 (import 群直下) に helper を追加:

```ts
const parseStructuredWarn = (warnSpy: ReturnType<typeof vi.spyOn>) => {
  const firstArg = warnSpy.mock.calls[0]?.[0];
  expect(typeof firstArg).toBe("string");
  return JSON.parse(firstArg as string) as {
    event: string;
    op: "get" | "put";
    errorClass: string;
    dedupeKeyHash: string;
    isolateId: string;
    ts: string;
  };
};
```

`createKvStub` の `getError` / `putError` injection を利用して 7 ケースを追加する（詳細は Phase 7 test-plan.md）。各 `it` ブロック開始時に `vi.spyOn(console, 'warn').mockImplementation(() => {})`、終了時に `warnSpy.mockRestore()` で leak 防止。

## S6: runbook 追記

`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` 末尾に「## 7. KV 操作エラーログ確認」を追加（詳細 snippet は Phase 8 docs-updates.md）。

## S7: 品質ゲート

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
mise exec -- pnpm --filter @ubm-hyogo/api lint
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay
```

全 PASS を Phase 11 evidence に記録する。

## チェックリスト

- [x] S1 isolateId / textEncoder を module top に追加
- [x] S2 `computeDedupeKeyHash` / `logKvOperationError` 追加
- [x] S3 `KV.get` try/catch + fail-open
- [x] S4 `KV.put` catch を helper 置換
- [x] S5 7 テストケース追加
- [x] S6 runbook section 5 追記
- [x] S7 typecheck / lint / build / test 全 PASS
