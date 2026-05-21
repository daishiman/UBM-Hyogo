# Phase 5: 実装仕様 (CONST_005 正本)

[実装区分: 実装仕様書]

本仕様書を読んだだけで、後続実装者がそのままコード変更・テスト追加・検証コマンド実行に着手できる粒度で記述する。

---

## 1. 変更対象ファイル一覧

| パス                                                          | 種別 | 概要                                                                  |
| ------------------------------------------------------------- | ---- | --------------------------------------------------------------------- |
| `apps/api/src/routes/internal/alert-relay.ts`                 | edit | module top-level `crypto.randomUUID()` を lazy init 関数に置換        |
| `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`  | edit | global scope guard regression test を追加 (TC-GS-01 / TC-GS-02)        |

新規ファイル作成・ファイル削除はなし。

---

## 2. 主要シグネチャ

### 2-1. `getIsolateId` (新規・module-private)

```ts
let cachedIsolateId: string | undefined;

function getIsolateId(): string {
  if (cachedIsolateId === undefined) {
    cachedIsolateId = crypto.randomUUID();
  }
  return cachedIsolateId;
}
```

- 入力: なし
- 出力: `string` (UUID v4 形式)
- 副作用: 初回呼び出し時に module-scope `cachedIsolateId` を書き換える
- 例外: なし (`crypto.randomUUID` は CF Workers handler scope では正常動作)

### 2-2. 既存 `isolateId` 参照箇所の更新

```ts
// apps/api/src/routes/internal/alert-relay.ts  line 62 付近
// emitKvOperationError 関数内:
console.warn(JSON.stringify({
  event: KV_OP_FAILED_EVENT,
  op: payload.op,
  errorClass: payload.errorClass,
  dedupeKeyHash: payload.dedupeKeyHash,
  isolateId: getIsolateId(),  // ← 変更: 直接参照から関数呼び出しへ
  ts: new Date().toISOString(),
}));
```

---

## 3. 具体差分

### 3-1. `apps/api/src/routes/internal/alert-relay.ts`

**Before (line 17-19):**

```ts
const isolateId = crypto.randomUUID();
const textEncoder = new TextEncoder();
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed";
```

**After:**

```ts
// ut-17-followup-003: isolate ごとに stable な ID を発番する。
// Cloudflare Workers は global scope での crypto.randomUUID() 呼び出しを禁止する
// (validation error 10021) ため、初回 handler 呼び出し時に lazy 初期化する。
let cachedIsolateId: string | undefined;

function getIsolateId(): string {
  if (cachedIsolateId === undefined) {
    cachedIsolateId = crypto.randomUUID();
  }
  return cachedIsolateId;
}

const textEncoder = new TextEncoder();
const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed";
```

**追加変更 (line 62 周辺、`emitKvOperationError` 内):**

```diff
-      isolateId,
+      isolateId: getIsolateId(),
```

### 3-2. `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

ファイル末尾の `describe` ブロック群の後に以下を追加:

```ts
describe("global scope safety (validation error 10021 regression guard)", () => {
  it("does not invoke crypto.randomUUID during module import", async () => {
    vi.resetModules();
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID");
    await import("../alert-relay");
    expect(randomUUIDSpy).not.toHaveBeenCalled();
    randomUUIDSpy.mockRestore();
  });

  it("emits the same isolateId across multiple log events within one isolate", async () => {
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
      for (const policyId of ["policy-gs02-a", "policy-gs02-b"]) {
        const res = await app.request(
          "/",
          {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({
              name: "X",
              policy_id: policyId,
              ts: 1_715_000_000_000,
            }),
          },
          buildEnv({ kv }),
        );
        expect(res.status).toBe(200);
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
});
```

---

## 4. 入力・出力・副作用

| 関数                  | 入力                | 出力        | 副作用                                                                |
| --------------------- | ------------------- | ----------- | --------------------------------------------------------------------- |
| `getIsolateId()`      | なし                | UUID string | 初回呼び出し時のみ `cachedIsolateId` に書き込み (idempotent)          |
| `emitKvOperationError`| op / errorClass / hash | void        | `console.warn` への structured log 出力 (既存契約・変更なし)          |
| `createAlertRelayRoute`| AlertRelayDeps      | Hono app    | 変更なし                                                              |

---

## 5. テスト方針

Phase 5 を実装正本とし、Phase 4 (outputs/phase-4/phase-4.md) はテスト設計の詳細根拠として参照する。要約:

- **新規 2 ケース追加**: TC-GS-01 (module import 時の randomUUID 非呼び出し) / TC-GS-02 (isolate 内 stable id)
- **既存ケース変更なし**: `parseStructuredWarn` の `isolateId: string` 期待は維持される
- **TDD 順序**: RED (新規 2 ケース追加して fail 確認) → GREEN (alert-relay.ts 修正) → REFACTOR (差分整理)

---

## 6. ローカル実行・検証コマンド

```bash
# 1. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. unit/integration test (alert-relay)
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec.ts

# 3. wrangler validation (local dry-run gate)
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run

# 4. 他ファイルでの同種違反 sweep (Phase 9 必須)
rg -n "^(const|let)[[:space:]]+[A-Za-z0-9_]+[[:space:]]*=[[:space:]]*(crypto\\.|await |fetch\\(|setTimeout\\(|setInterval\\()" apps/api/src
```

期待結果:

- typecheck / lint: 0 error
- alert-relay.spec.ts: 全ケース PASS (新規 2 件含む)
- wrangler dry-run: `validation` セクションで error 10021 を吐かないこと。Cloudflare auth / network が無い場合は `runtime_pending` evidence として理由を記録する
- deploy-staging job: PR 上では backend-ci deploy-staging job green を確認する。PR 未作成段階では user-gated として残す
- sweep grep: 該当行 0 件 (`alert-relay.ts` line 17 の旧コードが残らないこと)。`new TextEncoder()` は Workers global scope 許容のため禁止候補に含めない

---

## 7. DoD (Definition of Done)

| #   | 完了条件                                                                                          | 確認方法                                                                                  |
| --- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| D1  | `apps/api/src/routes/internal/alert-relay.ts` の line 17 から `crypto.randomUUID()` の global scope 呼び出しが消えている | `grep -n "^const isolateId" apps/api/src/routes/internal/alert-relay.ts` で 0 件         |
| D2  | `getIsolateId()` が module-private 関数として定義されている                                       | grep `function getIsolateId` で 1 件                                                      |
| D3  | `emitKvOperationError` 内の `isolateId` 参照が `getIsolateId()` 呼び出しに置き換わっている        | grep `isolateId: getIsolateId` で 1 件                                                    |
| D4  | regression test TC-GS-01 / TC-GS-02 が追加され、いずれも PASS                                     | `pnpm --filter @ubm-hyogo/api test alert-relay.spec.ts` で全ケース PASS                   |
| D5  | `pnpm typecheck` / `pnpm lint` が 0 error                                                         | CI ジョブ `typecheck` / `lint` が green                                                   |
| D6  | wrangler dry-run と実 staging deploy が validation error 10021 を出さない                         | local: `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run` PASS。PR 後: backend-ci deploy-staging job green。片方が user-gated / auth-gated の場合は理由を Phase 11 evidence に残す |
| D7  | log payload の `isolateId` フィールドが依然として UUID v4 形式の string                           | TC-GS-02 内の `expect(first.isolateId).toMatch(/^[0-9a-f-]{36}$/)` で確認                |

すべて満たした時点で Phase 5 を `completed` に更新し、Phase 6 以降は実装プロンプト (03.実装.md) の通常フローで進行する。

---

## 8. 実装後の検証 (Phase 6 以降への引き継ぎ)

- Phase 6: test 拡充 (fail path として KV stub の throw を 2 連発させ TC-GS-02 シナリオを成立させる)
- Phase 7: coverage 確認 (`getIsolateId` 関数の line/branch 100%)
- Phase 9: QA gate (DoD D1-D7 全件チェック)
- Phase 11: NON_VISUAL (UI/UX 変更なし)。evidence inventory は `outputs/phase-11/evidence/alert-relay-vitest.log`、`grep-gate.log`、`typecheck.log`、`lint.log`、`wrangler-dry-run.log`。staging deploy job URL は PR 後 user-gated evidence として `pending` 行に残す
- Phase 12 strict 7: `main.md`、`implementation-guide.md`、`system-spec-update-summary.md`、`documentation-changelog.md`、`unassigned-task-detection.md`、`skill-feedback-report.md`、`phase12-task-spec-compliance-check.md`
- Phase 12 system spec sync: aiworkflow-requirements の `task-workflow-active.md`、`indexes/resource-map.md`、`indexes/quick-reference.md`、alert-relay artifact inventory を同一 wave で更新する。`keywords.json` / `LOGS` / changelog は変更不要なら N/A 根拠を記録する

---

## 9. 関連タスク・未タスク化候補

| ID    | 内容                                                                                  | 扱い                                                                |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| FUT-1 | `apps/api/src/**/*.ts` 全体での global scope violation 包括 sweep                     | 未タスク化しない。Phase 9 必須 grep で 0 件確認・追加違反があれば本サイクル内で同梱  |
| FUT-2 | CI に「module load 時に async I/O / random / timer を呼ばない」lint rule を追加       | 別タスク化 (ESLint custom rule 設計を要するため CONST_007 例外候補) |

FUT-2 のみ別タスク化を検討する。理由: ESLint custom rule の設計・テストは独立した工数が大きく、本タスク 1 サイクル内完了が破綻するため (CONST_007 例外条件 1 に該当)。ユーザー確認を得てから別 Issue 化すること。
