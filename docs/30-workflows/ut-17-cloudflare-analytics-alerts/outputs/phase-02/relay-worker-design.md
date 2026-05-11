# UT-17 Relay Worker Design

## Contract

Cloudflare Notifications generic webhook posts to `POST /internal/alert-relay`. The route validates `cf-webhook-auth` against `CF_WEBHOOK_AUTH_SECRET`, formats the payload as Japanese Slack Block Kit, and posts to `SLACK_WEBHOOK_URL`.

## Plan Gate

If the Cloudflare account cannot use webhook destinations, this route is not implemented in the current cycle. The workflow remains valid through email notification evidence and runbook procedures.

## Authentication

Use `cf-webhook-auth: <configured secret>`. Do not implement `X-CF-Alert-Signature`, body HMAC, or timestamp-based signature verification unless Cloudflare later publishes that contract.
