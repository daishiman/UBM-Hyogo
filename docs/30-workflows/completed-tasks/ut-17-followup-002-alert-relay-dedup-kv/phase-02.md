# Phase 2: 設計

[実装区分: 実装仕様書]

## 目的

KV 経由 dedup の API 契約・データモデル・状態所有権・テスト可能性を確定する。

## アーキテクチャ判断

| 論点 | 判断 | 理由 |
|------|------|------|
| KV vs Durable Object | **KV 採用** | (1) TTL ネイティブ対応 (2) write/read 各 1 回で要件十分 (3) スケール無関係 (4) 親 spec 方針と一致。Durable Object は強整合だが過剰 |
| in-memory + KV の two-tier cache | **不採用** | 同一リクエスト内で read→put 二重実行を許容（CONST: race 完全排除は対象外）。実装複雑度の増加に見合う改善幅が無い |
| KV value 設計 | `"1"` 固定 | metadata は不使用。最小化でコスト・転送量削減 |
| 値読み出し方式 | `get(key)` の string モード（type 指定なし） | バイト数最小・JSON parse 不要 |
| TTL | `expirationTtl: Math.ceil(dedupeTtlMs / 1000)` 秒（既定 300 秒） | dedupeTtlMs（既定 5 分）と整合 |
| KV namespace 命名 | `ALERT_DEDUP_KV`（binding 名） / 表示名 `alert-dedup-staging` `alert-dedup-production` | UPPER_SNAKE_CASE binding、表示名は env サフィックス |

## ライブラリ採用検査（FB-CRONVL-001 対応）

- KV semantics 実測確認: `put(key, "1", { expirationTtl: 60 })` 直後の `get(key)` が `"1"`、`expirationTtl` 秒経過後の `get` が `null` を返すことを Miniflare で検証する（Phase 4 テストで実施）。
- eventual consistency の影響: 同一 isolate 内では write-after-read が即時可視。複数 isolate 間で最大数十秒遅延する可能性があるが、TTL=5min に対しては許容範囲。

## 状態所有権

| 部位 | 所有者 |
|------|--------|
| dedup state | Cloudflare KV namespace `ALERT_DEDUP_KV`（isolate 外） |
| TTL ロジック | KV の `expirationTtl`（KV 側が管理） |
| dedup key 生成 | `alert-relay.ts` の Handler 内 |
| Slack 配信 | 既存 `sendSlackMessage`（無変更） |

## API / シグネチャ

### `apps/api/src/env.ts`

```ts
export interface Env {
  // ...existing
  readonly ALERT_DEDUP_KV: KVNamespace;
}
```

`Env` 型に `KVNamespace`（`@cloudflare/workers-types` 由来）を必須プロパティとして追加。`@cloudflare/workers-types` が未 import の場合は import 追加。

### `apps/api/src/routes/internal/alert-relay.ts`

```ts
export interface AlertRelayEnv extends VerifyCfWebhookAuthEnv {
  readonly SLACK_WEBHOOK_URL?: string;
  readonly CF_ALERT_DASHBOARD_URL?: string;
  readonly CF_ALERT_RUNBOOK_URL?: string;
  readonly ALERT_DEDUP_KV: KVNamespace;
}

export interface AlertRelayDeps {
  readonly fetch?: typeof fetch;
  readonly dashboardUrl?: string;
  readonly runbookUrl?: string;
  readonly maxRetries?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
  readonly dedupeTtlMs?: number;
}

export function createAlertRelayRoute(deps: AlertRelayDeps = {}): Hono<{ Bindings: AlertRelayEnv }>
```

### Handler 内 dedup 処理（疑似コード）

```ts
const dedupeKey = `${classifyAlertMetric(payload)}:${policyId}:${minuteBucket}`;
const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey);
if (seen !== null) {
  return c.json({ ok: true, deduped: true });
}
await c.env.ALERT_DEDUP_KV.put(dedupeKey, "1", {
  expirationTtl: Math.ceil(dedupeTtlMs / 1000),
});
// → 既存の Slack 配信処理へ
```

### `apps/api/wrangler.toml` の差分

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

namespace_id は user-gated step で `bash scripts/cf.sh` 経由で取得し、コメント化済み block に実 id を反映してから有効化する。**`wrangler` 直接実行禁止**。

## エラーハンドリング

| ケース | 挙動 |
|--------|------|
| `get` が throw（KV 障害） | エラーを伝播させる。Cloudflare Notifications は retry する。Slack には届かない（許容: 既存 Slack 失敗時挙動と同等） |
| `put` が throw | Slack 配信成功後は `{ ok: true, dedupPersisted: false }`。未配信を dedup 済みにしないことを優先 |
| 同一リクエスト内 race | `get → put` の 2 操作はリクエスト内で直列。複数 isolate からの並行はベストエフォート |
| binding 未設定 / placeholder id | TypeScript では検出不可。active TOML に placeholder を置かず、user-gated namespace 作成後の実 id 反映と staging smoke で検出 |

## テスト容易性設計

- `deps` への KV inject は **行わない**（既存設計は `deps` に env を含めない方針）。代わりに **Hono の Bindings 経由** で `c.env.ALERT_DEDUP_KV` に test KV stub を注入する。
- Miniflare 同等の KV stub helper を `apps/api/test/helpers/kv-stub.ts` に新規作成。
- `vi.useFakeTimers()` で時間進行を制御し、`expirationTtl` 経過は stub 内で `Date.now()` を参照して simulate。

## 完了条件

- 全関数シグネチャ・データモデルが Phase 4 でテスト記述可能な粒度で固定されている
- `outputs/phase-02/design.md` が出力されている
## メタ情報

- taskId: ut-17-followup-002-alert-relay-dedup-kv
- phase: 2
- status: completed

## 目的

KV dedup 設計と user-gated runtime 境界を確定する。

## 実行タスク

- KV binding、dedup key、TTL、error handling を設計する。

## 参照資料

- `outputs/phase-02/design.md`
- `apps/api/src/routes/internal/alert-relay.ts`

## 成果物/実行手順

- `outputs/phase-02/design.md`

## 完了条件

- [x] Slack 成功後 persistence 方針が記録されている
- [x] active TOML placeholder 禁止が記録されている

## 統合テスト連携

- Phase 4 の KV stub tests に接続する。
