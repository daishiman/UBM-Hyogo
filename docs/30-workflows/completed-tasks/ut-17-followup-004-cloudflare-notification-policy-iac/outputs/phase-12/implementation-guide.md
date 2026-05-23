# Implementation Guide — ut-17-followup-004

## Part 1: 中学生レベル

家の電気を使いすぎたときに知らせる警報を、壁のスイッチで毎回手作業するのではなく、設定ノートを見れば同じ状態に戻せるようにする計画です。

このタスクでは、その設定ノートと確認コマンドを作りました。本物のCloudflare設定へ反映する操作だけは、ユーザー承認後に実行します。

| 用語 | やさしい説明 |
| --- | --- |
| Notification Policy | 使いすぎそうなときに知らせる決まり |
| webhook | お知らせを届ける入口 |
| IaC | 設定をノートのようにファイルへ書く方法 |
| drift | ノートと本物の設定がずれた状態 |
| read token | 見るだけの鍵 |
| apply token | 設定を変える鍵 |

## Part 2: 技術者レベル

### Architecture

- Desired state: `infra/cloudflare-alerts/policies/*.json`, `infra/cloudflare-alerts/webhooks/*.json`, and `infra/cloudflare-alerts/quota-base.json`.
- Command boundary: `bash scripts/cf.sh alerts {apply,diff,list}`.
- Helper implementation: TypeScript modules under `infra/cloudflare-alerts/lib/*.ts`, invoked by `scripts/cf.sh alerts`.
- CI boundary: PR runs local `pnpm test:alerts` only. Schedule / workflow_dispatch runs real drift diff with `CLOUDFLARE_ALERTS_TOKEN_READ` and `CLOUDFLARE_ALERT_RELAY_URL`. Apply token is never placed in CI.

### API Contract

Use Cloudflare Alerting API v4:

- `GET /accounts/:account_id/alerting/v3/policies`
- `POST /accounts/:account_id/alerting/v3/policies`
- `PUT /accounts/:account_id/alerting/v3/policies/:policy_id`
- `GET /accounts/:account_id/alerting/v3/destinations/webhooks`
- `POST /accounts/:account_id/alerting/v3/destinations/webhooks`
- `PUT /accounts/:account_id/alerting/v3/destinations/webhooks/:webhook_id`

### Type Sketch

```ts
type AlertTokenEnv = "CLOUDFLARE_ALERTS_TOKEN_APPLY" | "CLOUDFLARE_ALERTS_TOKEN_READ";

interface DesiredWebhook {
  name: string;
  urlRef: string;
  secret?: null;
}

interface DesiredPolicy {
  name: string;
  alert_type: string;
  enabled: boolean;
  mechanisms: { webhooks: Array<{ name: string }> };
  _threshold: { ref: string; ratio: number };
}
```

### Edge Cases

- Unknown Cloudflare alert type: keep the policy `enabled: false` until the official type is confirmed.
- Missing webhook destination: apply creates the webhook before policies.
- Duplicate webhook name: fail with configuration error.
- CI token has edit permission: fail the security review and rotate the token.
- Webhook URL drift: diff resolves `urlRef` and compares it with Cloudflare actual `url`; PR validation skips real API access.
