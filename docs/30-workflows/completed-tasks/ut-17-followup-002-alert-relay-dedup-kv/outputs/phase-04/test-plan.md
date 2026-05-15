# Phase 4 — テスト計画（TDD Red）

## テスト対象

- `apps/api/src/routes/internal/__tests__/alert-relay.test.ts`
- 新規 helper: `apps/api/test/helpers/kv-stub.ts`

## KV stub 仕様

```ts
export interface KvStubEntry { value: string; expiresAt: number }
export interface KvPutCall { key: string; value: string; expirationTtl?: number }
export function createKvStub(options?: {
  now?: () => number;
  getError?: () => Error | null;
  putError?: () => Error | null;
}): { kv: KVNamespace; puts: KvPutCall[]; store: Map<string, KvStubEntry> };
```

- `put` 引数を `puts: KvPutCall[]` に積み、value / expirationTtl を観測可能にする（test-only API）
- 実装コード側には test-only API を露出しない
- `now()` を経由した擬似時間進行で TTL 経過を simulate

## テストケース

### 既存ケース（KV stub inject 化）

| ID | 目的 | 期待 |
|----|------|------|
| ROUTE-01 | cf-webhook-auth 不正 | 401 |
| ROUTE-02 | 不正 JSON | 400 |
| ROUTE-03 | SLACK_WEBHOOK_URL 未設定 | 503 |
| ROUTE-04 | 正常 payload + Slack 200 | 200 / ok=true |
| ROUTE-04b | env Dashboard / runbook URL を Slack に含める | body に URL 含む |
| ROUTE-05 | Slack 5xx 連続 | 502 |
| ROUTE-05b / TC-02 | 5 分以内 dedup | 2 回目 deduped=true、Slack 1 回 |
| ROUTE-06 | header 欠落 | 401 |
| ROUTE-07 | CF_WEBHOOK_AUTH_SECRET 未設定 | 500 |
| INDEX-01 | mounted route 到達 | 200 |

### KV 起因の新規ケース

| ID | 目的 | 期待 |
|----|------|------|
| TC-03 | 異なる metric / policy_id は dedup されない | Slack 2 回 |
| TC-KV-01 | TTL 経過後の再受信は deduped 解除 | Slack 2 回 |
| TC-KV-02 | put される値は `"1"` 固定 | `puts[0].value === "1"` |
| TC-KV-03 | `expirationTtl = ceil(dedupeTtlMs / 1000)` | `puts[0].expirationTtl === 124`（123_456ms 入力時） |
| TC-KV-04 | 同一リクエスト内では put は高々 1 回 | `puts.length === 1` |
| TC-KV-05 | KV get throw → Slack 配信なし | status>=500, slack 未呼び出し |
| TC-KV-05a | Slack 配信失敗後の Cloudflare retry | 1 回目 502、2 回目は dedup されず Slack 再送 |
| TC-KV-06 | policy_id 欠落時 key fallback | key に name 含む |
| TC-KV-07 | minuteBucket 境界跨ぎ | Slack 2 回 |
| TC-KV-08 | `deps.dedupeTtlMs` を上書きすると反映 | `puts[0].expirationTtl === 7`（7000ms 入力時） |
| TC-KV-09 | KV put throw after Slack success | 200 / `dedupPersisted=false`、Slack は 1 回呼び出し |

## 実行コマンド

```bash
mise exec -- npx vitest run --config=./vitest.config.ts apps/api/src/routes/internal/__tests__/alert-relay.test.ts
```

## Red 期待

実装着手前（`seenAlerts` Map のまま）の時点で、`ALERT_DEDUP_KV` binding 経路が未実装のため
TC-KV-* / TC-03 系は Red になる。既存 ROUTE-* は Map 実装でも Green。

## DoD

- [x] `kv-stub.ts` helper 作成済み
- [x] TC-KV-01〜09 / Slack failure retry 含む全ケース test file 記述済み
- [x] Phase 5 実装後に全 PASS（21 tests）
