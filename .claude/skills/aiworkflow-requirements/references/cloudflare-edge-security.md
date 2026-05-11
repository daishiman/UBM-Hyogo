# Cloudflare Edge Security

## UT-15 WAF / Rate Limiting Rules

UT-15 establishes the local contract for Cloudflare WAF and Rate Limiting setup.

| Topic | Canonical rule |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/ut-15-waf-rate-limiting-rules-setup/` |
| State | `implemented-local-runtime-pending` |
| Rule phases | Custom Rules `http_request_firewall_custom` -> Rate Limiting `http_ratelimit` -> Managed Rules `http_request_firewall_managed` |
| Rate limit payload | `http_ratelimit` entry point ruleset with rule-level `ratelimit` object |
| Local wrapper | `scripts/cf-waf-apply.sh` is dry-run/config-contract only until Phase 13 G1 approval |
| False green guard | Non-dry-run mutation exits 13 before G1 write support exists |
| App fallback | App-layer 429 responses use `edge-rate-limit-headers.ts` with `reason: "app"` |

## Simulate To Enforce Gate

WAF / Rate Limiting rules start in Simulate mode. Enforce requires:

1. Seven continuous days of Simulate observation.
2. False-positive rate below the UT-15 gate threshold.
3. Runtime evidence synced back to Phase 11 outputs and this requirements skill.
4. Independent user approval for production Enforce.

## Responsibility Split

Edge rules handle bursty IP-level patterns before Workers execute. App-layer limiters keep
business-specific protections such as Magic Link per-email enumeration control.

Do not add Workers `[[ratelimits]]` binding for UT-15 unless a later task explicitly reopens the
triple-counting risk. The current boundary is zone-level edge rules plus existing app-layer fallback.
