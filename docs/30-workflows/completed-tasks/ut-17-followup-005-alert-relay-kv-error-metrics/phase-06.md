# Phase 6: 実装手順（ステップバイステップ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 実装手順 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 5 (実装計画) |
| 次 Phase | 7 (テスト計画) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本 Phase は Phase 5 の関数シグネチャに従い、`apps/api/src/routes/internal/alert-relay.ts` と `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への **実コード変更を順序立てて記述する手順書**を確定する。担当者または LLM coding agent が本 Phase の手順をそのまま実行できる粒度まで詳細化する。 |

---

## 目的

Phase 5 で確定した変更対象・関数シグネチャ・実装順序 (T1〜T8 / S1〜S8) を、
ファイル単位・ステップ単位の **実装手順書** に展開する。
本 Phase の成果物 `outputs/phase-06/implementation-steps.md` は、それ単体を見れば手を動かせる粒度で記述する。

---

## 6-1. 実装ステップ概要

| ステップ | 対象 | 主な作業 |
| --- | --- | --- |
| S1 | `apps/api/src/routes/internal/alert-relay.ts` | module-top に `isolateId` 採番を追加 |
| S2 | `apps/api/src/routes/internal/alert-relay.ts` | `sha256Hex12` / `logKvOperationError` ヘルパを top-level に追加 |
| S3 | `apps/api/src/routes/internal/alert-relay.ts` | `KV.get` を try/catch で包み、catch で log + fail-open |
| S4 | `apps/api/src/routes/internal/alert-relay.ts` | `KV.put` catch を helper 呼び出しへ置換 |
| S5 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH を追加 + `afterEach` 追加 |
| S6 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | 既存 TC-KV-05（`get` throw で 500）を fail-open 化に合わせて更新 |
| S7 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 「KV 操作エラーログの確認」セクション追記 |
| S8 | 品質ゲート | `pnpm typecheck` / `pnpm lint` / `pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` |

---

## 6-2. 各ステップの実装ポイント

### S1: module-top に `isolateId` 採番

**対象ファイル**: `apps/api/src/routes/internal/alert-relay.ts`

**位置**: `import` 群直後（現在の 16 行目 import 群末尾の直後、`createAlertRelayRoute` 関数定義より前）

**コード**:

```ts
// UT-17-FU-005: isolate ライフサイクル代理識別子。
// Workers isolate が起きている間は同一値を保持し、後段 logpush で
// 同一 isolate 内の連続失敗を集約する目的の弱い識別子として使用する。
const isolateId = crypto.randomUUID();
```

**注意**: handler 内で再採番しないこと（AC-1 / 不変条件 4）。

---

### S2: `sha256Hex12` / `logKvOperationError` ヘルパ追加

**対象ファイル**: `apps/api/src/routes/internal/alert-relay.ts`

**位置**: S1 で追加した `isolateId` 採番の直後、`createAlertRelayRoute` 関数定義より前

**コード**:

```ts
/**
 * UT-17-FU-005: dedupeKey を 12 hex chars (SHA-256 prefix, lowercase) に短縮するヘルパ。
 * raw dedupeKey をログに出さず、Workers Logs 1 行容量を抑える目的の軽量 fingerprint。
 * 同一入力に対し同一値を再現する（決定論的）。
 */
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

/**
 * UT-17-FU-005: KV `get` / `put` 失敗を 1 行 JSON で console.warn 経由 emit する private helper。
 * 外部 export 禁止。後段 logpush の filter 契約として event 文字列を固定する。
 *
 * schema: { event, op, errorClass, dedupeKeyHash, isolateId, ts }
 */
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

**注意**:
- 外部 `export` しない（AC-2）。
- `event` 文字列は `"alert_relay_kv_op_failed"` 固定（不変条件 3）。
- stack trace を含めない（Workers Logs 1 行上限緩和）。

---

### S3: `KV.get` を try/catch で包み、catch で log + fail-open

**対象ファイル**: `apps/api/src/routes/internal/alert-relay.ts`

**変更前（現在の 66 行目付近）**:

```ts
// ut-17-followup-002: dedup state は KV 永続化。eventual consistency により
// 同一リクエスト内 race（複数 isolate からの同時 read→put）は許容スコープ外。
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
```

**変更後**:

```ts
// ut-17-followup-002: dedup state は KV 永続化。eventual consistency により
// 同一リクエスト内 race（複数 isolate からの同時 read→put）は許容スコープ外。
// ut-17-followup-005: KV.get 失敗は fail-open（seen=null 扱い）で Slack 配信を続行する。
let seen: string | null;
try {
  seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
} catch (error) {
  await logKvOperationError("get", error, dedupeKey);
  seen = null;
}
```

**注意**:
- `const` → `let` への変更が必要（catch 内で再代入するため）。
- TypeScript の strict mode で `seen` の型を `string | null` と明示する。
- fail-open のため、catch 後の処理は `seen = null` で従来通り進む。

---

### S4: `KV.put` catch を helper 呼び出しへ置換

**対象ファイル**: `apps/api/src/routes/internal/alert-relay.ts`

**変更前（現在の 93〜102 行目付近）**:

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
  // ut-17-followup-005: 構造化ログ emit に置換（plain object → JSON 1 行）。
  // レスポンス挙動 (dedupPersisted: false) は不変。
  await logKvOperationError("put", error, dedupeKey);
  return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false });
}
```

**注意**: `return c.json(...)` 行は完全不変（AC-6）。

---

### S5: vitest 4 ケース追加 + `afterEach` 追加

**対象ファイル**: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

**位置 1**: `describe("createAlertRelayRoute", () => {` 直下に `afterEach` を追加（既存 import の `afterEach` 追加が必要）

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
```

```ts
describe("createAlertRelayRoute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ... 既存ケース
});
```

**位置 2**: 既存 `TC-KV-09` の直後に以下 4 ケースを追加

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
  // 同一 dedupeKey を 2 回 get で throw させ、payload.dedupeKeyHash の一致を検証
  const kv1 = createKvStub({ now: () => sameNow, getError: () => new Error("e1") });
  const kv2 = createKvStub({ now: () => sameNow, getError: () => new Error("e2") });
  const make = (kv: ReturnType<typeof createKvStub>) =>
    createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
      now: () => sameNow,
    });
  const body = JSON.stringify({
    name: "X",
    policy_id: "policy-hash-repro",
    ts: sameNow,
  });
  await make(kv1).request(
    "/",
    { method: "POST", headers: headers(), body },
    buildEnv({ kv: kv1 }),
  );
  await make(kv2).request(
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

**注意**:
- `vi.spyOn(console, "warn")` は各 it 内で取得する（`afterEach` で restore される）。
- `mockImplementation(() => {})` でログ出力を抑制し、テストランナーの output を汚さない。
- `payload["dedupeKeyHash"]` への bracket-access は TypeScript `noPropertyAccessFromIndexSignature` 互換のため。

---

### S6: 既存 TC-KV-05 を fail-open 化に合わせて更新

**対象ファイル**: `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

**変更前（現在の 385〜412 行目付近）**:

```ts
it("TC-KV-05: KV get が throw すると Slack 配信されない", async () => {
  // ... 既存実装
  expect(res.status).toBeGreaterThanOrEqual(500);
  expect(fetchMock).not.toHaveBeenCalled();
});
```

**変更後**: 上記 TC-KV-05 ケースを **削除** する。`get` fail-open 化の新規挙動は S5 で追加した `TC-KV-GET-THROW`（Slack 配信は成功する側）が代替アサーションとして全カバレッジを担う。

**理由**: 同じ `getError` 注入条件で 500 と 200 の両方を期待する 2 ケースを共存させると mutual contradiction になるため。Phase 12 documentation-changelog に「TC-KV-05 を `get` fail-open 化に合わせて削除し、TC-KV-GET-THROW へ統合」と記録する。

---

### S7: runbook 追記

**対象ファイル**: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

**位置**: 既存月次手順の末尾、または「定常監視」セクション直後の新規 H2 として追加

**追加内容**:

```markdown
## KV 操作エラーログの確認

UT-17-FU-005 により、`apps/api/src/routes/internal/alert-relay.ts` の
`ALERT_DEDUP_KV.get` / `ALERT_DEDUP_KV.put` 失敗時に構造化 JSON ログを
`console.warn` 経由で emit するようになった。本セクションは Workers Logs
からこのログを抽出し、KV 一時障害・global replication 遅延・write rate
limit 接近を観測する手順を定める。

### grep コマンド例

```bash
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty | grep alert_relay_kv_op_failed
```

> `wrangler` 直接実行は禁止。必ず `scripts/cf.sh tail` 経由で呼ぶこと。

### しきい値

| 観測値 | 対応 |
| --- | --- |
| 直近 1 時間で 10 件未満 | 通常運用（記録のみ） |
| 直近 1 時間で 10 件以上 | 調査開始。`errorClass` 別件数を集計し、Cloudflare 公式 status を確認 |
| 連続 30 分以上で `op:"get"` が継続発生 | KV 一時障害の可能性高。Slack 重複配信リスクを認識した上で fail-open 継続 |

### 構造化ログ schema

| field | 型 | 例値 | 説明 |
| --- | --- | --- | --- |
| `event` | string | `"alert_relay_kv_op_failed"` | event 固定値（後段 logpush filter 契約） |
| `op` | `"get"` \| `"put"` | `"get"` | 失敗した KV 操作種別 |
| `errorClass` | string | `"Error"` / `"TypeError"` | `err.constructor.name`（`Error` インスタンスでない場合は `typeof err`） |
| `dedupeKeyHash` | string | `"a1b2c3d4e5f6"` | SHA-256 first 12 hex chars。raw key は出さない |
| `isolateId` | string | `"550e8400-e29b-41d4-a716-446655440000"` | module load 時に採番した UUID |
| `ts` | string | `"2026-05-16T10:23:45.678Z"` | ISO 8601 UTC タイムスタンプ |
```

---

### S8: 品質ゲート

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec
```

3 コマンド全 PASS であること。失敗時は該当ステップへ巻き戻し、Phase 5 の変更計画と整合しているか確認する。

---

## 6-3. 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/implementation-steps.md | S1〜S8 を含む実装手順書（本 Phase の正本） |
| メタ | artifacts.json | phase-06 を completed に更新 |

---

## 6-4. 完了条件

- [ ] S1〜S8 の各ステップにコードスニペット・対象ファイル・変更前後の diff が示されている
- [ ] `event` 文字列が `"alert_relay_kv_op_failed"` 固定であることが各スニペットで確認可能
- [ ] `isolateId` の採番が module top で 1 回のみであることがスニペットで明示されている
- [ ] `KV.get` 側の `const → let` 変更が記載されている
- [ ] 既存 TC-KV-05 の削除（または更新）方針が明示されている
- [ ] runbook の grep 例が `scripts/cf.sh tail` 経由であり `wrangler` 直接実行ではない

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-06 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 7（テスト計画）
- 引き継ぎ事項:
  - S5 で追加した 4 ケースを Phase 7 のテストケース表へ転記する
  - S6 の TC-KV-05 削除方針を Phase 7 の既存ケース調整に転記する
  - S8 の検証コマンド 3 種を Phase 7 の「テスト実行コマンド」セクションへ転記する
- ブロック条件: `event` 文字列が schema-fix 違反になる、`isolateId` の handler 内再採番が混入する、`KV.put` 側のレスポンス挙動が変わる、のいずれか

## 実行タスク

- S1〜S8 の実装手順に従って code / test / runbook を更新する。

## 参照資料

- `outputs/phase-06/implementation-steps.md`
- `apps/api/src/routes/internal/alert-relay.ts`
- `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

## 成果物/実行手順

- 実装手順は `outputs/phase-06/implementation-steps.md` を正本とする。

## 完了条件

- [x] S1〜S8 が完了し、Phase 7 のテスト計画に接続されている。

## 統合テスト連携

`alert-relay.spec.ts` の 4 ケースを実装手順の回帰検証にする。
