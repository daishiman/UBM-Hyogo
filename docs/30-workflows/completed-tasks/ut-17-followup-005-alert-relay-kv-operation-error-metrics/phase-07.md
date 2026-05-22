# Phase 7: テスト計画

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | テスト計画 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 6 (実装手順) |
| 次 Phase | 8 (ドキュメント更新) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 既存 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` を拡張し、`console.warn` spy で構造化ログ schema を vitest 検証する。テストファイルは新規作成せず `*.spec.ts` 縛り（CLAUDE.md 不変条件 8）を遵守。 |

---

## 目的

Phase 5/6 で固定したヘルパ `logKvOperationError` の emit を、`vi.spyOn(console, 'warn')` で観測し、
AC-1〜AC-6 を CI で担保する追加テストケースを `alert-relay.spec.ts` に統合する。
既存 KV stub (`apps/api/test/helpers/kv-stub.ts`) の `getError` / `putError` injection を流用し、
flaky 要素（fake timer / 固定 sleep / 実 KV）に依存しない決定論的テストを構成する。

---

## 7-1. テスト戦略

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| ユニット | `createAlertRelayRoute` の KV catch 経路 | vitest（Node 24, Hono request mock, KV stub） | console.warn emit 回数 / payload shape / fail-open 継続 / response 不変 |
| 不変 | 既存挙動の regression | 既存 ROUTE-01〜TC-KV-01 群 | dedup hit / 502 / dedupPersisted=false の output が変わらない |

> 統合テスト（staging 実 KV throw 再現）は本タスクスコープ外。runbook (`phase-08`) の手順で動作確認する。

---

## 7-2. 既存 KV stub の流用方針

`createKvStub` は `getError` / `putError` の **factory 関数** を受けるため、ケース毎に「最初の 1 回だけ throw」「常に throw」を切替可能。本 phase で導入する追加テストはこの API のみで構成する。

```ts
// 1 回だけ get throw
let getCalls = 0;
const kv = createKvStub({
  getError: () => (getCalls++ === 0 ? new Error("boom") : null),
});

// 常に put throw
const kvPutFail = createKvStub({ putError: () => new Error("kv put boom") });
```

stub helper の **拡張は禁止**（test 専用副作用なし helper を増やさない）。

---

## 7-3. 追加テストケース一覧

| Test ID | シナリオ | KV stub 設定 | 期待 |
| --- | --- | --- | --- |
| TC-LOG-01 | `KV.get` throw → fail-open Slack 配信 | `getError: () => Error("boom")` | console.warn 1 回 / payload `event=alert_relay_kv_op_failed`, `op="get"`, `errorClass="Error"` / Slack fetch 呼出 / response 200 |
| TC-LOG-02 | `KV.put` throw 後も `{ok:true, dedupPersisted:false}` | `putError: () => Error("kv put boom")` | console.warn 1 回 / `op="put"` / response body に `dedupPersisted: false` |
| TC-LOG-03 | 成功パス（get null → put 成功） | default stub | console.warn **0 回**（false positive 防止） |
| TC-LOG-04 | 同一 isolate 内 get/put 連続 throw → isolateId 一致 | 1 通目: `getError` only / 2 通目: `putError` only（別 dedupeKey） | 2 emit の `isolateId` が strictEqual |
| TC-LOG-05 | dedupeKeyHash 決定性 | 2 通の同一 policy_id+ts | 2 emit の `dedupeKeyHash` が strictEqual / 異なる policy_id では不一致 |

> TC-LOG-04 は **module top 1 回採番**（AC-5）の証明。emit ごとに `crypto.randomUUID()` を呼ぶ実装ミスを検出する。

---

## 7-4. vitest コード snippet（完成形）

`alert-relay.spec.ts` 末尾の `describe("createAlertRelayRoute", ...)` 内に **そのまま追記**。

```ts
describe("KV operation error structured logging (UT-17-FU-005)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  type LogPayload = {
    event: string;
    op: "get" | "put";
    errorClass: string;
    dedupeKeyHash: string;
    isolateId: string;
    ts: string;
  };

  const lastWarnPayload = (): LogPayload => {
    const lastCall = warnSpy.mock.calls.at(-1);
    expect(lastCall, "console.warn was not called").toBeDefined();
    return JSON.parse(String(lastCall?.[0])) as LogPayload;
  };

  it("TC-LOG-01: KV.get throw 時に構造化ログ 1 行 emit / Slack 配信は継続", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    let getCalls = 0;
    const kv = createKvStub({
      getError: () => (getCalls++ === 0 ? new Error("boom") : null),
    });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "x", policy_id: "p", ts: 1_715_000_000_000 }),
      },
      buildEnv({ kv }),
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = lastWarnPayload();
    expect(payload.event).toBe("alert_relay_kv_op_failed");
    expect(payload.op).toBe("get");
    expect(payload.errorClass).toBe("Error");
    expect(payload.dedupeKeyHash).toMatch(/^[0-9a-f]{12}$/);
    expect(payload.isolateId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(new Date(payload.ts).toString()).not.toBe("Invalid Date");
  });

  it("TC-LOG-02: KV.put throw 時に構造化ログ 1 行 emit / dedupPersisted=false 維持", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const kv = createKvStub({ putError: () => new Error("kv put boom") });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "x", policy_id: "p2", ts: 1_715_000_000_000 }),
      },
      buildEnv({ kv }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, dedupPersisted: false });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = lastWarnPayload();
    expect(payload.op).toBe("put");
    expect(payload.event).toBe("alert_relay_kv_op_failed");
  });

  it("TC-LOG-03: 成功パスでは console.warn が呼ばれない", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    const res = await app.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "x", policy_id: "p3", ts: 1_715_000_000_000 }),
      },
      buildEnv(),
    );
    expect(res.status).toBe(200);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("TC-LOG-04: 同一 isolate 内 get throw → put throw の isolateId が一致", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    // 1 リクエスト目: get throw（fail-open で put 成功）
    let getCallsA = 0;
    const kvA = createKvStub({
      getError: () => (getCallsA++ === 0 ? new Error("get boom") : null),
    });
    const appA = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    await appA.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "a", policy_id: "p-iso-1", ts: 1_715_000_000_000 }),
      },
      buildEnv({ kv: kvA }),
    );
    // 2 リクエスト目: 同一 isolate（同 process 内）/ put throw
    const kvB = createKvStub({ putError: () => new Error("put boom") });
    await appA.request(
      "/",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "a", policy_id: "p-iso-2", ts: 1_715_000_000_000 }),
      },
      buildEnv({ kv: kvB }),
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
    const first = JSON.parse(String(warnSpy.mock.calls[0]?.[0])) as LogPayload;
    const second = JSON.parse(String(warnSpy.mock.calls[1]?.[0])) as LogPayload;
    expect(first.isolateId).toBe(second.isolateId);
  });

  it("TC-LOG-05: dedupeKeyHash は同一 key で決定的・異なる key で不一致", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 200 }));
    const sameBody = JSON.stringify({
      name: "x",
      policy_id: "p-hash",
      ts: 1_715_000_000_000,
    });
    const diffBody = JSON.stringify({
      name: "x",
      policy_id: "p-hash-different",
      ts: 1_715_000_000_000,
    });
    // 3 リクエスト: same / same / diff、全て put throw で hash を 3 回採取
    const kv = createKvStub({ putError: () => new Error("put boom") });
    const app = createAlertRelayRoute({
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    const env = buildEnv({ kv });
    await app.request("/", { method: "POST", headers: headers(), body: sameBody }, env);
    await app.request("/", { method: "POST", headers: headers(), body: sameBody }, env);
    await app.request("/", { method: "POST", headers: headers(), body: diffBody }, env);
    expect(warnSpy).toHaveBeenCalledTimes(3);
    const hashes = warnSpy.mock.calls.map(
      (c) => (JSON.parse(String(c[0])) as LogPayload).dedupeKeyHash,
    );
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[0]).not.toBe(hashes[2]);
    expect(hashes[0]).toMatch(/^[0-9a-f]{12}$/);
  });
});
```

---

## 7-5. spy ライフサイクル方針

- `beforeEach`: `vi.clearAllMocks()` で前テスト残響を消す → `vi.spyOn(console, 'warn').mockImplementation(() => {})` で stdout 汚染抑止
- `afterEach`: `warnSpy.mockRestore()` + `vi.restoreAllMocks()` の二重防御で leak 防止
- 既存 `ROUTE-*` テストは `console.warn` を直接 assert しないため、本 describe block 局所化で衝突なし
- 既存 alert-relay.ts の `console.warn("alert relay dedup KV put failed after Slack delivery", ...)` 行は Phase 6 で構造化 emit に置換済み前提（spy の payload が JSON.parse 可能であること）

---

## 7-6. 実行コマンド

```bash
# focused 実行（最速）
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay

# 全 api スイート（regression 確認）
mise exec -- pnpm --filter @ubm-hyogo/api test

# 型チェック・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

---

## 7-7. カバレッジ期待

| 対象モジュール | line 期待 | branch 期待 |
| --- | --- | --- |
| `apps/api/src/routes/internal/alert-relay.ts` | 既存 ≥ 90 % 維持 → 新規 catch / helper +5 ポイント |
| `logKvOperationError`（module-local） | line 100 % / branch 100 %（`err instanceof Error` 両分岐を TC-LOG-01（Error） で網羅、非 Error 分岐は AC 範囲外のため Phase 10 で type narrowing にて静的保証） |

> 既存ベース line ≥ 80 % 標準を下回らないこと。`pnpm --filter @ubm-hyogo/api test:coverage -- alert-relay` で確認可能。

---

## 7-8. ログ非出力 / PII 検証

```bash
# 実装後に local grep gate
grep -nE "dedupeKey[^Hash]" apps/api/src/routes/internal/alert-relay.ts \
  | grep -E "console\.(log|info|warn|error)"
# 期待: 0 件（raw dedupeKey を log に出していないこと）

grep -nE "stack" apps/api/src/routes/internal/alert-relay.ts \
  | grep -E "console\.(log|info|warn|error)"
# 期待: 0 件（stack trace を emit していないこと）
```

---

## 7-9. 完了条件

- [ ] TC-LOG-01〜TC-LOG-05 の vitest スニペットが `alert-relay.spec.ts` に追加されている
- [ ] `beforeEach` clearAllMocks / `afterEach` restoreAllMocks が統一されている
- [ ] 既存 ROUTE-* / TC-* テストの output が変わらないこと（regression PASS）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` PASS
- [ ] coverage 既存ベースから低下していないこと
- [ ] 7-8 grep gate が 0 件であること

---

## 次 Phase 引き継ぎ事項

- 次: Phase 8（ドキュメント更新 / runbook 反映）
- 引き継ぎ事項:
  - TC-LOG-01 の payload shape は runbook の field 定義表と同一であること
  - TC-LOG-04 の「同一 isolate 内 isolateId 一致」は runbook で「isolate ライフサイクル代理識別子」と説明する根拠
  - 7-8 grep gate は Phase 9 受入確認で再実行する
- ブロック条件: TC-LOG-01〜TC-LOG-05 のうちいずれかが flaky 化、または既存テストが regression する場合は Phase 6 へ差し戻す

## 実行タスク

本 Phase の対象実装・検証・ドキュメント同期を実行する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `apps/api/src/routes/internal/alert-relay.ts` | 実装正本 |
| 必須 | `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | テスト正本 |

## 成果物/実行手順

`@ubm-hyogo/api` を package filter として typecheck / lint / build / test を実行し、Phase 11 evidence に記録する。

## 完了条件

local evidence が PASS し、runtime / git operation は Phase 13 user gate に分離されていること。

## 統合テスト連携

`alert-relay.spec.ts` の focused tests と Phase 11 grep gate に接続する。
