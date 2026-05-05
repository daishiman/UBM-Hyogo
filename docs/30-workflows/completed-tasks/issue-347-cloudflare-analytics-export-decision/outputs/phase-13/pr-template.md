## Summary

- Create the issue #347 Cloudflare Analytics long-term export decision workflow.
- Adopt GraphQL Analytics API aggregate-only export with CSV fallback and screenshot rejection.
- Define repo retention, redaction rules, Free plan constraints, and Phase 11 evidence contract.
- Sync aiworkflow-requirements and 09c parent references.

## Boundary

Docs-only / NON_VISUAL. No app code, Cloudflare mutation, commit, push, or PR was performed without approval.

## Related

Refs #347

## Test plan

- Phase 12 strict 7 files exist.
- Root / outputs artifacts parity exists.
- Redaction sample contains no PII candidate fields.
- aiworkflow-requirements references include this workflow path.
