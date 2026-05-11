# UT-17 Secret Management

| Secret | Purpose | Source of truth | Runtime target |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook destination | 1Password | Cloudflare Secret |
| `CF_WEBHOOK_AUTH_SECRET` | Cloudflare generic webhook auth header | 1Password | Cloudflare Secret + Cloudflare webhook destination secret |

All Cloudflare secret writes must use `bash scripts/cf.sh secret put ...`. Direct `wrangler secret put` is forbidden.
