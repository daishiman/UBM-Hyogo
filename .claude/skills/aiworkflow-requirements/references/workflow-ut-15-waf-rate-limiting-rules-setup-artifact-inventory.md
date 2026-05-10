# UT-15 WAF / Rate Limiting Rules Setup Artifact Inventory

## Classification

| Field | Value |
| --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/ut-15-waf-rate-limiting-rules-setup/` |
| state | `implemented-local-runtime-pending` |
| task type | `implementation` |
| visual evidence | `NON_VISUAL` |
| issue reference | `Refs #18` only; Issue #18 remains closed |

## Canonical Contract

UT-15 defines a user-gated implementation contract for Cloudflare edge security:

- Custom Rules use the `http_request_firewall_custom` phase.
- Rate Limiting Rules use the `http_ratelimit` phase and must contain a `ratelimit` object.
- WAF Managed Rules use the `http_request_firewall_managed` phase.
- Cloudflare execution order is Custom Rules -> Rate Limiting Rules -> Managed Rules.
- Workers Rate Limiting binding, if ever adopted, uses current `[[ratelimits]]` syntax.
- Initial implementation keeps Workers binding as no-op to avoid edge / binding / app-layer triple counting.

## Required Workflow Artifacts

| Path | Role |
| --- | --- |
| `artifacts.json` | root workflow ledger |
| `outputs/artifacts.json` | mirror ledger for validator parity |
| `phase-01.md` - `phase-13.md` | Phase 1-13 specification |
| `outputs/phase-11/main.md` | NON_VISUAL evidence index |
| `outputs/phase-11/manual-smoke-log.md` | runtime-pending smoke matrix |
| `outputs/phase-11/link-checklist.md` | AC/link checklist |
| `outputs/phase-12/main.md` | Phase 12 root output |
| `outputs/phase-12/implementation-guide.md` | Part 1/2 implementation guide |
| `outputs/phase-12/system-spec-update-summary.md` | same-wave sync summary |
| `outputs/phase-12/documentation-changelog.md` | changelog evidence |
| `outputs/phase-12/unassigned-task-detection.md` | 0-new-task detection |
| `outputs/phase-12/skill-feedback-report.md` | local workflow feedback |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | strict compliance root |

## Local Implementation Artifacts

| Path | Role |
| --- | --- |
| `apps/api/src/middleware/edge-rate-limit-headers.ts` | Unified 429 helper for app-layer / edge-compatible body and headers |
| `apps/api/src/middleware/__tests__/edge-rate-limit-headers.test.ts` | Focused helper unit tests |
| `apps/api/src/middleware/rate-limit-magic-link.ts` | Existing app-layer limiter integrated with helper |
| `apps/api/src/middleware/rate-limit-self-request.ts` | Existing self-request limiter integrated with helper |
| `scripts/cf-waf-apply.sh` | User-gated Cloudflare WAF / Rate Limiting wrapper |
| `scripts/cf-waf-apply/` | Declarative config, helper library, snapshot fixture, and spawn tests |
| `docs/runbooks/cloudflare-waf-operations.md` | False-positive, Simulate/Enforce, and rollback SOP |

## Runtime Boundary

Cloudflare API mutation, production Enforce, seven-day observation, commit, push, and PR creation require explicit user approval. Placeholder or spec evidence must not be treated as runtime PASS.
