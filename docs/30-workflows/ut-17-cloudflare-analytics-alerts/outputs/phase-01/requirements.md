# UT-17 Phase 1 Requirements

## Summary

UT-17 formalizes Cloudflare usage alerting for UBM-Hyogo. The baseline is Cloudflare Notifications email alerts plus runbook evidence. Slack relay is conditional: it is enabled only when the Cloudflare account can use webhook destinations.

## Decisions

| Topic | Decision |
| --- | --- |
| Task type | implementation / NON_VISUAL |
| Workflow state | spec_created |
| Free baseline | email notification + runbook |
| Pro+ optional path | generic webhook -> `/internal/alert-relay` -> Slack |
| Webhook auth | `cf-webhook-auth` fixed secret, not body HMAC |

## Gates

- Verify Cloudflare plan support for webhook destinations before implementing relay.
- Verify official notification type names before creating policies.
- Keep Issue #20 references as `Refs #20`; do not use close keywords.
