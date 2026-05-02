# Phase 12 Unassigned Task Detection

## Summary

New formal unassigned task files were not created in this pass because the items below are larger operational/security follow-ups that require separate scoping and user approval. They remain candidate follow-ups, not completed work.

| Candidate | Source | Priority | Formalize decision | Rationale |
| --- | --- | --- | --- | --- |
| GitHub OIDC to short-lived Cloudflare credential path | Phase 3 Option D / implementation guide | HIGH | candidate | Long-lived Token removal is valuable but changes CI auth architecture |
| Scope-specific Token split for Workers / D1 / Pages | Phase 3 Option C | MEDIUM | candidate | Reduces blast radius further but increases Secret and rollback complexity |
| 90-day Cloudflare Token rotation runbook / automation | Phase 12 follow-up | HIGH | candidate | Operationally important after minimum-scope Token is verified |
| Cloudflare Audit Logs monitoring for Token use | Phase 12 follow-up | MEDIUM | candidate | Requires log access scope and alerting design; must not overload deploy Token |

## Duplicate / Baseline Notes

- `U-FIX-CF-ACCT-02` remains the separate wrangler runtime warning cleanup path and is not duplicated here.
- Existing audit-log and OIDC-related backlog items may overlap; formalization should first search `docs/30-workflows/unassigned-task/` to avoid duplicate task IDs.

## Current Wave Decision

This wave fixes evidence completeness for `U-FIX-CF-ACCT-01`. It does not add new broad tasks because doing so safely requires cross-checking existing backlog ownership and Cloudflare/GitHub operational approvals.

