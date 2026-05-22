# Phase 7 成果物: テスト計画

## テスト戦略

| 層 | 対象 | 実行環境 | 主な検証観点 |
| --- | --- | --- | --- |
| ユニット | `createAlertRelayRoute` の KV catch 経路 | vitest (Node 24, Hono request mock, KV stub) | `console.warn` emit 回数 / payload shape / fail-open / response 不変 |
| 不変 | 既存挙動の regression | 既存 ROUTE-04 / ROUTE-05 / TC-KV-01 等 | dedup hit / 502 / `dedupPersisted=false` の output が変わらない |

## 共通 setup

各 `it` ブロック先頭で以下を実施し、`console.warn` spy の test 間 leak を防ぐ:

```ts
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
// ...test 本体...
warnSpy.mockRestore();
```

KV stub には `getError` / `putError` を inject し、決定論的に throw を再現する。

```ts
const kv = createKvStub({ getError: new Error("kv get boom") });
```

## テストケース

| ID | 名称 | 入力 | 期待結果 |
| --- | --- | --- | --- |
| TC-LOG-01 | `KV.get` throw 時に schema 準拠 1 行 emit + fail-open で Slack 配信継続 | `getError` injected / Slack 成功 | warn 1 回 / response 200 OK `{ ok: true, attempts: 1 }` / payload `{ event, op: "get", errorClass, dedupeKeyHash (12 hex), isolateId (UUID), ts (ISO) }` |
| TC-LOG-02 | `KV.put` throw 時に schema 準拠 1 行 emit + `dedupPersisted=false` 維持 | `putError` injected / Slack 成功 | warn 1 回 / response `{ ok: true, attempts: 1, dedupPersisted: false }` / payload `op: "put"` |
| TC-LOG-03 | 成功パスで warn 0 回 | KV.get null + Slack 200 + KV.put 成功 | warn 呼び出し 0 回 / response `{ ok: true, attempts: 1 }` |
| TC-LOG-04 | 同一テスト実行内の 2 emit (get throw + put throw) が同じ `isolateId` | 2 件続けてリクエスト | 2 つの payload の `isolateId` が一致 |
| TC-LOG-05 | `dedupeKeyHash` が `SHA-256(dedupeKey)` 先頭 12 hex として決定的 | 固定 payload で 2 回送信 | 2 つの payload の `dedupeKeyHash` が一致し、`crypto.subtle.digest` で算出した期待 hash と一致 |
| TC-LOG-06 | hash 算出失敗時も `hash_error` fallback で emit | `crypto.subtle.digest` を 1 回 reject | response `{ ok: true, attempts: 1, dedupPersisted: false }` / payload `dedupeKeyHash="hash_error"` |
| TC-LOG-07 | `console.warn` 自体が throw しても route response を維持 | warn spy が throw | response `{ ok: true, attempts: 1, dedupPersisted: false }` |
| TC-LOG-08 | 非 `Error` throw の `errorClass` | KV put が string throw | payload `errorClass="string"` |

## AC マッピング

| AC | カバー TC |
| --- | --- |
| AC-1 | TC-LOG-01 |
| AC-2 | TC-LOG-02 |
| AC-3 | TC-LOG-01 / TC-LOG-02 の payload shape assertion |
| AC-4 | TC-LOG-05 |
| AC-5 | TC-LOG-04 |
| AC-6 | TC-LOG-03 |
| AC-7 | TC-LOG-07 + 既存 ROUTE-04 / ROUTE-05 / TC-KV-* regression |

## 実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay
```

期待: 既存 case + 追加 8 case が全 PASS。

## 非決定論的要素の回避

- fake timer 不使用（`new Date().toISOString()` は payload の存在検証のみ、値検証しない）
- `crypto.randomUUID()` の値検証は「UUID format / 同一 isolate 内一致性」のみで、固定値比較は行わない
- 実 KV 不使用。すべて `createKvStub` で injection

## Phase 8 への申し送り

- TC-LOG-01〜08 を `alert-relay.spec.ts` に実装した状態で Phase 8 runbook 追記に進む
- field 定義表は Phase 8 runbook 内にも複製し、テストの payload shape assertion と完全一致させる
