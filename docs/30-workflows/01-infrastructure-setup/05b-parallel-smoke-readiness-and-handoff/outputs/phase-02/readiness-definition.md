# Phase 2 Readiness Definition

## Purpose

This task is ready when a developer can explain the deployment and handoff path without guessing where the source of truth lives.

## Readiness Criteria

| Area | Required state | Status |
| --- | --- | --- |
| Branch flow | `feature/*` work is integrated through review before `dev` / `main` promotion | PASS |
| Runtime target | Web uses Next.js with `@opennextjs/cloudflare`; API uses Cloudflare Workers / Hono | PASS |
| Data ownership | Google Sheets is the input source; Cloudflare D1 is the application record store | PASS |
| Secrets | GitHub and Cloudflare secrets are managed outside source control | PASS |
| Rollback | Cloudflare deployment rollback and Git revert paths are both documented | PASS |
| Handoff | Required downstream evidence paths are listed in this task root | PASS |

## Dependency Boundary

`05b` can run in parallel with `05a-parallel-observability-and-cost-guardrails`. `05a` evidence is consumed at Phase 10-12, not as a start blocker.
