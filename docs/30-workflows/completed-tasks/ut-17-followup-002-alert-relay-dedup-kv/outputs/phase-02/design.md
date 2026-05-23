# Phase 2 — 設計（ut-17-followup-002）

## アーキテクチャ判断

| 論点 | 判断 | 理由 |
|------|------|------|
| KV vs Durable Object | KV 採用 | TTL ネイティブ対応、write/read 各 1 回で要件十分、過剰な強整合は不要 |
| in-memory + KV の two-tier cache | 不採用 | 実装複雑度に対する改善幅が無い |
| KV value 設計 | `"1"` 固定 / metadata 不使用 | 最小化（cost / 転送量） |
| 値読み出し方式 | `get(key)` string モード | JSON parse 不要 |
| TTL | `expirationTtl = Math.ceil(dedupeTtlMs / 1000)` 秒（既定 300） | `dedupeTtlMs` と整合 |
| binding 名 | `ALERT_DEDUP_KV`（UPPER_SNAKE_CASE） | 既存 binding 命名と整合 |

## 状態所有権

| 部位 | 所有者 |
|------|--------|
| dedup state | Cloudflare KV namespace `ALERT_DEDUP_KV`（isolate 外） |
| TTL ロジック | KV `expirationTtl`（KV 側管理） |
| dedup key 生成 | `alert-relay.ts` Handler 内 |
| Slack 配信 | 既存 `sendSlackMessage`（無変更） |

## API / シグネチャ

```ts
// apps/api/src/env.ts
export interface Env extends SyncEnv, ResponseSyncEnv {
  // ...
  readonly ALERT_DEDUP_KV: KVNamespace;
}

// apps/api/src/routes/internal/alert-relay.ts
export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ALERT_DEDUP_KV: KVNamespace;
}
```

## Handler 内 dedup 処理（実装後の最終形）

```ts
const dedupeKey = [
  classifyAlertMetric(payload),
  payload.policy_id ?? payload.name ?? payload.alert_type ?? "unknown",
  String(minuteBucket),
].join(":");
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}

const result = await sendSlackMessage(webhookUrl, message, sendOptions);
if (!result.ok) {
  return c.json({ ok: false, attempts: result.attempts, status: result.status }, 502);
}
await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
  expirationTtl: Math.ceil(dedupeTtlMs / 1000),
});
```

## wrangler.toml 差分（id は user-gated step で実 ID 反映）

```toml
# namespace 作成後、実 id だけを使ってコメント解除する。
# placeholder id を active TOML に残さない。
# [[env.staging.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"
# id = "<staging_namespace_id>"

# [[env.production.kv_namespaces]]
# binding = "ALERT_DEDUP_KV"
# id = "<production_namespace_id>"
```

## エラーハンドリング

| ケース | 挙動 |
|--------|------|
| `get` throw（KV 障害） | エラーを伝播。Hono が 500 系応答に変換。Slack 配信せず |
| `put` throw | Slack 配信成功後は `{ ok: true, dedupPersisted: false }`。未配信を dedup 済みにしないことを優先 |
| 同一リクエスト race | per-request 内では `get → put` 直列。複数 isolate 並行はベストエフォート |
| binding 未設定 / placeholder id | TypeScript では検出不可。active TOML に placeholder を置かず、user-gated namespace 作成後の実 id 反映と staging smoke で検出 |

## テスト容易性設計

- Hono の `Bindings` 経由で `c.env.ALERT_DEDUP_KV` に test KV stub を注入
- `apps/api/test/helpers/kv-stub.ts` で Miniflare 互換 stub 実装
- TTL 境界テストは `now: () => mockedTime` で simulate

## 副次的型整合（実装後に追加）

`Env.ALERT_DEDUP_KV` を必須化したため、`buildFormsClient(env: Env)` →
`(env: AdminResponsesSyncEnv) => GoogleFormsClient` の contravariance が崩れる。
narrow env interface `FormsClientEnv extends ResponseSyncEnv` を `apps/api/src/index.ts`
に導入して解消する（責務: Forms クライアント生成のみ）。

## 完了条件

全関数シグネチャ・データモデルが Phase 4 でテスト記述可能な粒度で固定済み。
