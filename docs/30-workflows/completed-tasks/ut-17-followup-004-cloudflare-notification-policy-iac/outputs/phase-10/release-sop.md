# Phase 10 成果物: リリース SOP

## 前提作業 (Cloudflare / 1Password / GitHub 側)

1. 1Password Vault `UBM-Hyogo` に以下 4 item を発行 (実値手入力):
   - `UBM-Hyogo Alerts Apply Token` (scope: `Account.Notifications:Edit` のみ)
   - `UBM-Hyogo Alerts Read Token` (scope: `Account.Notifications:Read` のみ)
   - `UT-17 Alert Relay` の `url` (relay Worker endpoint)
   - `UT-17 Alert Relay` の `cf-webhook-auth` (relay 認証 header value)
2. GitHub repo Secret に `CLOUDFLARE_ALERTS_TOKEN_READ` (read token value) を登録
3. GitHub repo Variable に `CLOUDFLARE_ACCOUNT_ID` を登録 (既存利用)

## 初回 apply 手順

```bash
# 1) repo 上の declaration が intended な状態であることを diff で確認
mise exec -- pnpm cf:alerts:diff
# (初回は actual が空または旧 dashboard 構築物。drift 表示が出る。exit 2 だが想定内)

# 2) dry-run で apply 計画を確認
mise exec -- pnpm cf:alerts:apply
# stdout に「[dry-run] POST webhook ut-17-relay」「[dry-run] POST policy workers-requests」等が出る

# 3) 実適用 (1Password sign-in 必須)
op signin
bash scripts/cf.sh alerts apply --yes

# 4) 冪等性確認
mise exec -- pnpm cf:alerts:diff
# → exit 0, "no drift detected"
```

## CI

- `.github/workflows/cloudflare-alerts-drift.yml` がスケジュール (毎月 1 日) で diff を自動実行
- PR で `infra/cloudflare-alerts/**` が変更されたら自動 trigger
- drift があれば job fail + `drift.json` artifact 添付

## rollback

policy / webhook を削除する場合は、Cloudflare Dashboard で手動削除し、対応する
`infra/cloudflare-alerts/policies/*.json` または `webhooks/*.json` を repo から削除して再 apply。
スコープ追加なら `.json` を追加して PR → drift workflow が PR 上で検証。
