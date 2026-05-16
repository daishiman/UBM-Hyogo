# Phase 2 成果物: Cloudflare API マッピング

## 利用エンドポイント

| 操作 | HTTP | path |
| --- | --- | --- |
| list policies | GET | `/accounts/:account_id/alerting/v3/policies` |
| create policy | POST | `/accounts/:account_id/alerting/v3/policies` |
| update policy | PUT | `/accounts/:account_id/alerting/v3/policies/:id` |
| list webhooks | GET | `/accounts/:account_id/alerting/v3/destinations/webhooks` |
| create webhook | POST | `/accounts/:account_id/alerting/v3/destinations/webhooks` |
| update webhook | PUT | `/accounts/:account_id/alerting/v3/destinations/webhooks/:id` |

`infra/cloudflare-alerts/lib/api-client.ts` で `fetch` 経由で呼び出し。
`CF_ALERTS_MOCK_DIR` 設定時は fixture 経路に差し替え。

## 認証

- header: `Authorization: Bearer ${CLOUDFLARE_API_TOKEN}`
- token scope:
  - diff / list / plan → `Account.Notifications:Read` (CLOUDFLARE_ALERTS_TOKEN_READ)
  - apply (write) → `Account.Notifications:Edit` (CLOUDFLARE_ALERTS_TOKEN_APPLY)
- account_id は `${CLOUDFLARE_ACCOUNT_ID}` から (既存 GitHub Variable)
