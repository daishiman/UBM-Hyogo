# Phase 4: テスト作成（TDD Red）

[実装区分: 実装仕様書]

## 目的

KV 経由 dedup 仕様に対応するテストを実装より先に Red 状態で書く。

## テスト対象ファイル

`apps/api/src/routes/internal/__tests__/alert-relay.test.ts`（現行実体パス）

## 新規 helper

`apps/api/test/helpers/kv-stub.ts`

### KV stub 実装方針

```ts
export interface KvStubEntry { readonly value: string; readonly expiresAt: number }

export function createKvStub(now: () => number): KVNamespace {
  const store = new Map<string, KvStubEntry>();
  return {
    get: async (key: string) => {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    put: async (key: string, value: string, options?: { expirationTtl?: number }) => {
      const ttl = options?.expirationTtl ?? 0;
      store.set(key, { value, expiresAt: now() + ttl * 1000 });
    },
    delete: async (key: string) => { store.delete(key); },
    list: async () => ({ keys: [], list_complete: true, cursor: "" }),
  } as unknown as KVNamespace;
}
```

固定 `sleep` は禁止。`vi.useFakeTimers()` + `now: () => Date.now()` 注入で TTL 経過を simulate。
`TC-KV-02` / `TC-KV-03` は closure 内 `store` を直接読まない。helper は `put` の観測 log（`writes: Array<{ key: string; value: string; expirationTtl?: number }>`）を test-only に返すか、`put` spy で value / `expirationTtl` を検証する。実装コードへ test-only API を露出しない。

## テストケース一覧

### 既存ケースの調整（KV stub inject）

| ID | 目的 | 期待 |
|----|------|------|
| TC-01 | 単発受信で Slack 配信される | KV `get` で `null` → `put` → Slack 1 回 |
| TC-02 | 同一 key を 5 分以内に再受信で deduped | 2 回目応答が `{ ok: true, deduped: true }`、Slack 配信 1 回のみ |
| TC-03 | 異なる metric / policy_id / minuteBucket は dedup されない | Slack 配信 2 回 |

### KV 起因の新規ケース

| ID | 目的 | 期待 |
|----|------|------|
| TC-KV-01 | KV TTL 経過後の再受信は deduped 解除 | `vi.useFakeTimers()` で `dedupeTtlMs + 1ms` 経過 → 2 回目も Slack 配信される |
| TC-KV-02 | KV に `put` した値が `"1"` 固定（metadata 不使用） | stub 内 store の値が `"1"` |
| TC-KV-03 | KV `expirationTtl` が `Math.ceil(dedupeTtlMs / 1000)` で渡される | stub `put` 呼び出し引数を spy で観測 |
| TC-KV-04 | 同一リクエスト処理中の race（`get` → `put`）が直列に実行される | `put` の呼び出し回数が 1 |
| TC-KV-05 | KV `get` が例外 throw 時はエラー応答（500 系 or throw 伝播） | Slack 配信されない |

## 期待される Red 状態

Phase 5 実装前の時点で:
- 既存回帰ケースは現行 `Map` 実装でも Green 維持できる可能性があるため、Red 期待に含めない。
- TC-KV-* 系は `ALERT_DEDUP_KV` binding / KV stub / `get` / `put` 実装が未反映のため Red。
- TDD 判定は「既存回帰 Green + KV 固有ケース Red」を期待値にする。

## 実行コマンド

```bash
mise exec -- pnpm --filter @repo/api test alert-relay
```

## DoD（Phase 4 完了条件）

- [ ] `kv-stub.ts` helper が作成され、型 `KVNamespace` 互換である
- [ ] TC-KV-01〜05 を含む全ケースが test file に書かれている
- [ ] 上記コマンドが現状（実装未着手）で fail することを確認
- [ ] `outputs/phase-04/test-plan.md` に上記表とコマンドが記録されている

## Pitfall 対策

- **[FB-IPC-SNAP-001 類似]** `vi.spyOn` でモック化する場合は hoisting 順序に注意。`vi.mock` でモジュールごと差し替える代わりに、Hono の Bindings に KV stub を直接渡すアプローチが安全。
- **[Feedback W0-RV-001]** TTL 境界テストでは `dedupeTtlMs + 1` のオフセットを `// ms: ${dedupeTtlMs + 1}` コメント付きで書く。
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 4
- status: completed

## 目的

KV dedup の focused test plan を確定する。

## 実行タスク

- KV stub と route tests を設計する。

## 参照資料

- `outputs/phase-04/test-plan.md`

## 成果物/実行手順

- `outputs/phase-04/test-plan.md`

## 完了条件

- [x] Slack failure retry regression が test plan に含まれる
- [x] KV put failure behavior が test plan に含まれる

## 統合テスト連携

- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
