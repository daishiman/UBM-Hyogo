# Phase 6 成果物: 実装手順書（S1〜S8）

担当者または LLM coding agent が本書 1 本で実装着手できる粒度で記述する。
コード提示は変更前後の diff 形式で示す。

## S1: module-top に `isolateId` 採番

**対象**: `apps/api/src/routes/internal/alert-relay.ts`

**位置**: import 群直後（`createAlertRelayRoute` 定義より前）

**追加コード**:

```ts
// UT-17-FU-005: isolate ライフサイクル代理識別子。
// Workers isolate が起きている間は同一値を保持し、後段 logpush で
// 同一 isolate 内の連続失敗を集約する目的の弱い識別子として使用する。
const isolateId = crypto.randomUUID();
```

**注意**: handler 内で再採番しない（AC-1 / 不変条件 4）。

---

## S2: `sha256Hex12` / `logKvOperationError` ヘルパ追加

**対象**: `apps/api/src/routes/internal/alert-relay.ts`

**位置**: S1 で追加した `isolateId` 採番の直後

**追加コード**:

```ts
async function sha256Hex12(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function logKvOperationError(
  op: "get" | "put",
  err: unknown,
  dedupeKey: string,
): Promise<void> {
  const errorClass = err instanceof Error ? err.constructor.name : typeof err;
  const dedupeKeyHash = await sha256Hex12(dedupeKey);
  const payload = {
    event: "alert_relay_kv_op_failed",
    op,
    errorClass,
    dedupeKeyHash,
    isolateId,
    ts: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));
}
```

**契約**:
- 外部 export 禁止（AC-2）。
- `event` 文字列は固定（不変条件 3）。
- stack trace 非含有（Workers Logs 1 行上限緩和）。

---

## S3: `KV.get` を try/catch で fail-open 化

**対象**: `apps/api/src/routes/internal/alert-relay.ts`（現 66 行目付近）

**変更前**:

```ts
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
```

**変更後**:

```ts
let seen: string | null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
  seen = null;
}
```

**注意**:
- `const` → `let` 変更必須。
- `seen` の型を `string | null` で明示する。
- 後続の `if (seen !== null)` 判定はそのまま動く。

---

## S4: `KV.put` catch を helper 呼び出しへ置換

**対象**: `apps/api/src/routes/internal/alert-relay.ts`（現 93〜102 行目付近）

**変更前**:

```ts
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  console.warn("alert relay dedup KV put failed after Slack delivery", {
    error: error instanceof Error ? error.message : "unknown",
  });
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

**変更後**:

```ts
try {
  await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
    expirationTtl: Math.ceil(dedupeTtlMs / 1000),
  });
} catch (error) {
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

**注意**: `return c.json(...)` 行は完全不変（AC-6）。

---

## S5: vitest 4 ケース追加 + `afterEach`

**対象**: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

### S5-1: import 更新

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
```

### S5-2: `describe("createAlertRelayRoute")` 直下に `afterEach` 追加

```ts
describe("createAlertRelayRoute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });
  // 既存ケース...
});
```

### S5-3: 既存 `TC-KV-09` の直後に 4 ケース追加

```ts
it("TC-KV-GET-THROW: KV.get が throw すると warn 1 回 emit + Slack 配信は成功する", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  const kv = createKvStub({
    now: () => 1_715_000_000_000,
    getError: () => new Error("boom"),
  });
  const app = createAlertRelayRoute({
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async () => {},
    now: () => 1_715_000_000_000,
  });
  const res = await app.request(
    "/",
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "Workers Daily Requests Approaching Limit",
        policy_id: "policy-get-throw",
        ts: 1_715_000_000_000,
      }),
    },
    buildEnv({ kv }),
  );
  expect(res.status).toBe(200);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(warnSpy).toHaveBeenCalledTimes(1);
  const payload = JSON.parse(warnSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
  expect(payload).toMatchObject({
    event: "alert_relay_kv_op_failed",
    op: "get",
    errorClass: "Error",
  });
  expect(typeof payload["dedupeKeyHash"]).toBe("string");
  expect((payload["dedupeKeyHash"] as string).length).toBe(12);
  expect(typeof payload["isolateId"]).toBe("string");
  expect(typeof payload["ts"]).toBe("string");
});

it("TC-KV-PUT-THROW: KV.put が throw すると warn 1 回 emit + dedupPersisted=false", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  const kv = createKvStub({
    now: () => 1_715_000_000_000,
    putError: () => new Error("put boom"),
  });
  const app = createAlertRelayRoute({
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async () => {},
    now: () => 1_715_000_000_000,
  });
  const res = await app.request(
    "/",
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "X",
        policy_id: "policy-put-throw",
        ts: 1_715_000_000_000,
      }),
    },
    buildEnv({ kv }),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({
    ok: true,
    attempts: 1,
    dedupPersisted: false,
  });
  expect(warnSpy).toHaveBeenCalledTimes(1);
  const payload = JSON.parse(warnSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
  expect(payload).toMatchObject({
    event: "alert_relay_kv_op_failed",
    op: "put",
    errorClass: "Error",
  });
});

it("TC-KV-SUCCESS-NO-WARN: 正常系で console.warn は呼ばれない", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  const kv = createKvStub({ now: () => 1_715_000_000_000 });
  const app = createAlertRelayRoute({
    fetch: fetchMock as unknown as typeof fetch,
    sleep: async () => {},
    now: () => 1_715_000_000_000,
  });
  const res = await app.request(
    "/",
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name: "X",
        policy_id: "policy-success",
        ts: 1_715_000_000_000,
      }),
    },
    buildEnv({ kv }),
  );
  expect(res.status).toBe(200);
  expect(warnSpy).not.toHaveBeenCalled();
});

it("TC-DEDUPE-KEY-HASH: 同一 dedupeKey で hash が再現する（12 hex chars lowercase）", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
  const sameNow = 1_715_000_000_000;
  const kv1 = createKvStub({ now: () => sameNow, getError: () => new Error("e1") });
  const kv2 = createKvStub({ now: () => sameNow, getError: () => new Error("e2") });
  const body = JSON.stringify({
    name: "X",
    policy_id: "policy-hash-repro",
    ts: sameNow,
  });
  const make = () =>
    createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => sameNow,
    });
  await make().request(
    "/",
    { method: "POST", headers: headers(), body },
    buildEnv({ kv: kv1 }),
  );
  await make().request(
    "/",
    { method: "POST", headers: headers(), body },
    buildEnv({ kv: kv2 }),
  );
  expect(warnSpy).toHaveBeenCalledTimes(2);
  const p1 = JSON.parse(warnSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
  const p2 = JSON.parse(warnSpy.mock.calls[1]?.[0] as string) as Record<string, unknown>;
  expect(p1["dedupeKeyHash"]).toBe(p2["dedupeKeyHash"]);
  expect(/^[0-9a-f]{12}$/.test(p1["dedupeKeyHash"] as string)).toBe(true);
});
```

---

## S6: 既存 TC-KV-05 削除

**対象**: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`（現 385〜412 行目付近）

**削除対象**:

```ts
it("TC-KV-05: KV get が throw すると Slack 配信されない", async () => {
  // ... 既存実装（res.status >= 500 expected）
});
```

**理由**: `get` fail-open 化により、同じ `getError` 注入条件で `res.status >= 500` を期待することは不可能になる。新規 TC-KV-GET-THROW（`get` throw でも Slack 配信成功）が代替アサーションを担う。

Phase 12 documentation-changelog に「TC-KV-05 → TC-KV-GET-THROW 統合・削除」と記録する。

---

## S7: runbook 追記

**対象**: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

**追加内容**: 末尾に以下 H2 セクションを追記。

```markdown
## KV 操作エラーログの確認

UT-17-FU-005 により、`apps/api/src/routes/internal/alert-relay.ts` の
`ALERT_DEDUP_KV.get` / `ALERT_DEDUP_KV.put` 失敗時に構造化 JSON ログを
`console.warn` 経由で emit するようになった。

### grep コマンド例

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty | grep alert_relay_kv_op_failed
```

> `wrangler` 直接実行は禁止。必ず `scripts/cf.sh tail` 経由で呼ぶ。

### しきい値

| 観測値 | 対応 |
| --- | --- |
| 直近 1 時間で 10 件未満 | 通常運用（記録のみ） |
| 直近 1 時間で 10 件以上 | 調査開始。`errorClass` 別件数を集計し Cloudflare 公式 status を確認 |
| 連続 30 分以上で `op:"get"` が継続発生 | KV 一時障害の可能性高。Slack 重複配信リスクを認識した上で fail-open 継続 |

### 構造化ログ schema

| field | 型 | 例値 | 説明 |
| --- | --- | --- | --- |
| `event` | string | `"alert_relay_kv_op_failed"` | event 固定値 |
| `op` | `"get"` \| `"put"` | `"get"` | 失敗した KV 操作種別 |
| `errorClass` | string | `"Error"` | `err.constructor.name`（`Error` インスタンスでない場合 `typeof err`） |
| `dedupeKeyHash` | string | `"a1b2c3d4e5f6"` | SHA-256 first 12 hex chars |
| `isolateId` | string | UUID | module load 時に採番 |
| `ts` | string | ISO 8601 UTC | `new Date().toISOString()` |
```

---

## S8: 品質ゲート

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec
```

3 コマンド全 PASS が AC-9 の達成条件。失敗時は S1〜S7 に巻き戻して原因を特定する。

---

## 完了チェック

- [ ] S1〜S4 のコード変更が `alert-relay.ts` に反映
- [ ] S5 で 4 ケース追加 + `afterEach` 追加
- [ ] S6 で TC-KV-05 削除
- [ ] S7 で runbook 追記
- [ ] S8 で 3 コマンド全 PASS
- [ ] `event` 文字列が `"alert_relay_kv_op_failed"` 固定（typo なし）
- [ ] `isolateId` の handler 内再採番なし
- [ ] `KV.put` 側レスポンス `dedupPersisted: false` 不変
