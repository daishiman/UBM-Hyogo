# ADR: Runtime Smoke Strategy

## Context

Issue #371 moved attendance provider resolution to Hono context and closed local evidence as `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`. Issue #531 supplies staging runtime evidence without changing API source or D1 schema.

## Decision

Use a read-only curl smoke runner with summary-only persistent evidence:

- `scripts/smoke/runtime-attendance-provider.sh`
- `scripts/smoke/redact.sh`

The smoke verifies route-specific JSON contracts for read-only GET paths and keeps POST self-request routes out of runtime execution. DI-bound provider evidence is limited to `/admin/members/:memberId` and `/me/profile`; paging endpoints are route-local provider availability checks.

## Alternatives

| Option | Result | Reason |
| --- | --- | --- |
| curl + summary-only evidence | adopted | Small, deterministic, no UI dependency, directly proves HTTP response contracts without persisting PII-bearing bodies |
| wrangler tail | rejected | Log stream cannot prove every requested route shape deterministically |
| Playwright | rejected | UI-level tool is oversized for NON_VISUAL API provider wiring evidence |

## Consequences

- Persistent evidence is summary-only: status, jq contract, and array length / type summary.
- Temporary raw bodies live under `mktemp` and are removed by `trap`.
- Production smoke remains forbidden.

## References

- `docs/30-workflows/completed-tasks/issue-371-ut-02a-followup-003-hono-ctx-di-migration/`
- `CLAUDE.md` Cloudflare CLI rules
- `docs/30-workflows/issue-531-runtime-smoke-attendance-provider-migration/outputs/phase-02/route-inventory.md`
