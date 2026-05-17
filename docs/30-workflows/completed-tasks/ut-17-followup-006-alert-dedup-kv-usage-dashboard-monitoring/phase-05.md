# Phase 5: 実装仕様（ファイル差分・関数シグネチャ）

[実装区分: 実装仕様書]

## 1. 目的

Phase 7 実装者が迷わずコードに落とせるよう、ファイル単位の差分・関数シグネチャ・型・テスト fixture の最終形を提示する。

## 2. 変更対象ファイル一覧

| パス | 種別 | サブタスク |
| --- | --- | --- |
| `infra/cloudflare-alerts/quota-base.json` | 編集 | T1 |
| `infra/cloudflare-alerts/policies/workers-kv-writes-per-day.json` | 新規 | T2 |
| `infra/cloudflare-alerts/policies/workers-kv-stored-bytes.json` | 新規 | T2 |
| `infra/cloudflare-alerts/schema/policy.schema.json` | verified unchanged | T3 |
| `infra/cloudflare-alerts/lib/canonicalize.ts` | verified unchanged | T4 |
| `infra/cloudflare-alerts/lib/api-client.ts` | verified unchanged | T4 |
| `infra/cloudflare-alerts/lib/__tests__/load.spec.ts` | 編集 | T5 |
| `infra/cloudflare-alerts/lib/__tests__/canonicalize.spec.ts` | 編集 | T5 |
| `infra/cloudflare-alerts/lib/__tests__/diff.spec.ts` | 編集 | T5 |
| `infra/cloudflare-alerts/lib/__tests__/fixtures/workers-kv-*.json` | 新規 | T5 |
| `infra/cloudflare-alerts/README.md` | 編集 | T6 |
| `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | 編集 | T7 |

## 3. ファイル別差分仕様

### 3.1 `quota-base.json`

`values` に Phase 1-2 で確定した KV 関連 quota を追加:

```jsonc
{
  "values": {
    // 既存値は保持
    "workers_kv_writes_per_day": <Phase 1 確定値>,
    "workers_kv_stored_data_bytes": <Phase 1 確定値>
  },
  "snapshotAt": "<Phase 2 実施日>"
}
```

### 3.2 `policies/workers-kv-writes-per-day.json`

```jsonc
{
  "$schema": "../schema/policy.schema.json",
  "name": "workers-kv-writes-per-day",
  "description": "Workers KV writes 80% of free-tier daily quota (ALERT_DEDUP_KV monitoring)",
  "alert_type": "billing_usage_alert",
  "enabled": false,  // Wave A 初期、baseline 取得後に true
  "conditions": {
    "metric": "workers_kv_writes_per_day",
    "percentage": 0.8
  },
  "mechanisms": {
    "webhooks": [{ "name": "ut-17-relay" }]
  }
}
```

namespace filter が API でサポートされる場合は Phase 2 schema 拡張に従い `filters` キーを追加。

### 3.3 `policies/workers-kv-stored-bytes.json`

stored data bytes に対する Account 集計 quota guard。`metric: "workers_kv_stored_data_bytes"`、`percentage: 0.8`。

### 3.4 `schema/policy.schema.json`

Phase 2 で alert_type 拡張は不要と判断したため、この wave では変更しない。将来 `billing_usage_alert` 以外の KV native alert type を採用する場合のみ以下のように追加する:

```jsonc
"alert_type": {
  "type": "string",
  "enum": ["billing_usage_alert", "<KV 用 alert_type>"]
}
```

namespace filter が必要な場合は `conditions` 内 `oneOf` に新パターンを追加（既存 2 パターンは保持）。

### 3.5 `lib/canonicalize.ts` / `api-client.ts`

- 既存 alert_type 文字列が透過する設計なら変更なし
- API request body に `filters` を含める必要がある場合のみ `api-client.ts` の `buildPolicyBody` 関数（または相当する関数）を編集

シグネチャ例（既存に従う想定）:

```ts
function canonicalizePolicy(input: PolicyJson): CanonicalPolicy {
  // alert_type を透過、conditions を正規化、threshold = quotaBase * percentage 展開
}
```

### 3.6 テスト fixture

この wave では policy JSON を `infra/cloudflare-alerts/policies/` に直接追加し、`load.spec.ts` の policy 列挙を 5 件から 7 件へ更新する。Cloudflare API mock は `tests/fixtures/cloudflare-alerts/api-list-policies.json` に 2 件追加する。

## 4. 入出力 / 副作用

- 純粋関数（canonicalize / diff / resolve）は副作用なし
- `api-client.ts` は `apply --yes` 経由でのみ Cloudflare API へ書き込み。Phase 5-9 では実行しない（Phase 10 で staging のみ実行）

## 5. テスト方針

- `load.spec.ts`: 新 fixture が schema validation を通り、列挙数が +1（または +2）になる
- `canonicalize.spec.ts`: 新 policy の canonical form が `quotaBase * percentage` で正しく展開される
- `diff.spec.ts`: drift fixture を提供し、新 policy が `missing` → `match` に遷移する流れを確認
- `api-client.spec.ts`: Cloudflare API mock で POST / PUT body が期待形になることを確認

## 6. ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm test:alerts
mise exec -- pnpm cf:alerts:list   # dry / read-only
mise exec -- pnpm cf:alerts:diff   # dry / read-only
```

## 7. 完了条件 (DoD)

- [ ] 全変更対象ファイルの差分が具体的に提示されている
- [ ] schema 拡張差分が後方互換であることが明示されている
- [ ] テスト fixture / spec 更新ポイントがファイル単位で列挙されている
- [ ] Phase 7 実装者がコピペで作業できる粒度であること
