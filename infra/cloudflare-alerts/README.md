# Cloudflare Notification Policy IaC (UT-17-Followup-004)

UBM-Hyogo の Cloudflare 無料枠監視用 Notification Policy (5 category / 7 policy)
と alert relay 用 webhook destination を JSON 宣言で固定し、`scripts/cf.sh alerts`
経由で drift 検知 + 冪等適用するための IaC ディレクトリ。

> 親 workflow: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/`
> 子タスク仕様: `docs/30-workflows/ut-17-followup-004-cloudflare-notification-policy-iac/`

## 構成

```
infra/cloudflare-alerts/
├── README.md                  # このファイル
├── quota-base.json            # Cloudflare 公式無料枠 snapshot
├── policies/                  # 7 policy 宣言
│   ├── workers-requests.json
│   ├── d1-read-queries.json
│   ├── d1-write-queries.json
│   ├── pages-build.json
│   ├── r2-class-a.json        # Class A + Class B を anyOf で集約
│   ├── workers-kv-writes-per-day.json   # ALERT_DEDUP_KV writes 監視 (UT-17-followup-006 / 初期 enabled:false)
│   └── workers-kv-stored-bytes.json     # ALERT_DEDUP_KV storage 監視 (UT-17-followup-006 / 初期 enabled:false)
├── webhooks/
│   └── ut-17-relay.json       # alert relay Worker への webhook (op:// 参照のみ)
├── schema/                    # JSON Schema (additionalProperties:false で id 直書き禁止)
│   ├── policy.schema.json
│   ├── webhook.schema.json
│   └── quota-base.schema.json
└── lib/                       # Node 純関数 + CLI (cf.sh から exec される)
    ├── canonicalize.ts
    ├── diff.ts
    ├── resolve.ts
    ├── quota-base.ts
    ├── load.ts
    ├── api-client.ts
    ├── cli.ts
    └── __tests__/
```

## 前提: 1Password 構成

| 用途 | Vault Item | scope |
| --- | --- | --- |
| `apply` (Edit) | `op://UBM-Hyogo/UBM-Hyogo Alerts Apply Token/credential` | `Account.Notifications:Edit` |
| `read` (CI / diff) | `op://UBM-Hyogo/UBM-Hyogo Alerts Read Token/credential` | `Account.Notifications:Read` |
| webhook URL | `op://UBM-Hyogo/UT-17 Alert Relay/url` | (Cloudflare 外部) |
| webhook secret | `op://UBM-Hyogo/UT-17 Alert Relay/cf-webhook-auth` | (Cloudflare 外部) |

`apply` token は **deploy 用 `CLOUDFLARE_API_TOKEN` から完全分離** する。

`.env` には以下 op:// 参照のみ追加（実値は書かない）:

```env
CLOUDFLARE_ALERTS_TOKEN_APPLY="op://UBM-Hyogo/UBM-Hyogo Alerts Apply Token/credential"
CLOUDFLARE_ALERTS_TOKEN_READ="op://UBM-Hyogo/UBM-Hyogo Alerts Read Token/credential"
```

GitHub Secrets には `CLOUDFLARE_ALERTS_TOKEN_READ` と URL drift 比較用の
`CLOUDFLARE_ALERT_RELAY_URL` のみ登録する。apply 用 token は CI に置かない。

## 利用例

```bash
# 一覧 (repo expected と Cloudflare actual の両方を表示)
bash scripts/cf.sh alerts list

# drift 検知 (drift があれば exit 2)
bash scripts/cf.sh alerts diff
bash scripts/cf.sh alerts diff --json > drift.json

# CI 用 (op run を skip、CLOUDFLARE_ALERTS_TOKEN_READ を直接利用)
CLOUDFLARE_ALERTS_TOKEN_READ=... \
CLOUDFLARE_ALERT_RELAY_URL=... \
  bash scripts/cf.sh alerts diff --ci

# 適用 (webhook destination → policy の順で冪等)
bash scripts/cf.sh alerts apply              # dry-run
bash scripts/cf.sh alerts apply --yes        # 実適用

# pnpm scripts
mise exec -- pnpm cf:alerts:list
mise exec -- pnpm cf:alerts:diff
mise exec -- pnpm cf:alerts:apply
mise exec -- pnpm test:alerts
```

`apply` は idempotent: drift fixture から開始しても diff が空に収束する
(Phase 7 S10 で検証)。`apply --ci` は read-only CI 境界を壊すため exit 78 で拒否する。

## 不変条件

1. **wrangler 直接禁止** — Cloudflare CLI 操作は `scripts/cf.sh` 経由のみ
2. **secret 直書き禁止** — webhook url / secret は `op://...` の参照のみ。`url` 素キー / `secret` 素キーは Schema レベルで弾く
3. **webhook ID 直書き禁止** — policy 側の `mechanisms.webhooks[]` は `name` のみ (`additionalProperties:false` で `id` キーを Schema が拒否)
4. **threshold 絶対値直書き禁止** — `conditions.percentage * quotaBase[metric]` で実行時生成
5. **API Token scope 分離** — apply 用 (Edit) と read 用 (Read) を分離。CI Secret には read 用しか入れない
6. **webhook URL drift 検知** — diff/list は `urlRef` を解決し、Cloudflare actual の `url` と比較する
7. **冪等性** — `apply --yes` の連続実行で diff が空に収束する。順序は **webhook → policy** で固定

## Trouble Shooting

| 症状 | 原因 / 対応 |
| --- | --- |
| `apply` が 403 Forbidden | apply token の scope に `Account.Notifications:Edit` が無い (op:// item を再発行) |
| `apply` が webhook 解決失敗 | repo `webhooks/*.json` の `name` と Cloudflare 上の destination name が一致していない |
| `diff` が常に drift を返す | `quota-base.json` の値が Cloudflare 公式値と乖離 (`snapshotAt` を確認) |
| `--ci` で exit 78 | `CLOUDFLARE_ALERTS_TOKEN_READ` が GitHub Secret に未登録 |

## 関連

- 月次ヘルスチェック runbook: `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`
- 親 implementation-guide: `docs/30-workflows/ut-17-cloudflare-analytics-alerts/outputs/phase-12/implementation-guide.md`
- CI gate: `.github/workflows/cloudflare-alerts-drift.yml`
