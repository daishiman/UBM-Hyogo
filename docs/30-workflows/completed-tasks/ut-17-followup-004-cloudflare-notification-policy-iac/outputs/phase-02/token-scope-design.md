# Phase 2 成果物: Token Scope 設計

## 3 token 厳格分離

| token | scope | 用途 | 保管場所 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` (既存) | Workers Scripts:Edit, D1, R2 等 | wrangler deploy / D1 migration | 1Password + GitHub Secrets |
| `CLOUDFLARE_ALERTS_TOKEN_APPLY` (新規) | Account.Notifications:Edit のみ | 手動 apply (local) | 1Password (`op://UBM-Hyogo/UBM-Hyogo Alerts Apply Token/credential`) |
| `CLOUDFLARE_ALERTS_TOKEN_READ` (新規) | Account.Notifications:Read のみ | local diff + CI drift 検知 | 1Password + GitHub Secrets |

## 不変条件

- deploy token (`CLOUDFLARE_API_TOKEN`) に Notifications scope を追加してはいけない (権限肥大化禁止)
- `CLOUDFLARE_ALERTS_TOKEN_APPLY` は GitHub Secret に置かない — CI から apply は絶対に行わない
- `.env` には実値ではなく `op://...` 参照のみ書く
- README に上記分離方針を必ず記述

詳細は `infra/cloudflare-alerts/README.md` §「前提: 1Password 構成」を参照。
