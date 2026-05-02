# ADR: Cloudflare CI/CD Token Scope and Environment Separation

## Status

Proposed for `U-FIX-CF-ACCT-01`; runtime verification pending user-approved Phase 11 execution.

## Context

GitHub Actions uses `CLOUDFLARE_API_TOKEN` for Cloudflare Workers, D1, and Pages deployment flows.
The Token must be narrow enough to reduce leak impact while broad enough for staging and production deployment jobs.

## Decision

Use environment-scoped GitHub Secrets named `CLOUDFLARE_API_TOKEN` for both `staging` and `production`, but keep the actual Cloudflare Token values separate.

Initial required Cloudflare permissions:

- Account / Workers Scripts: Edit
- Account / D1: Edit
- Account / Cloudflare Pages: Edit
- Account / Account Settings: Read

Conditional permissions:

- Account / Workers KV Storage: Edit only if `apps/api` dry-run proves it is needed.
- User / User Details: Read only if token verification proves it is needed.

Do not add Zone/DNS, SSL, cache purge, R2, Queues, Stream, Images, Email Routing, Memberships, or Logs permissions for deploy.

## Consequences

- Staging can fail safely before production is touched.
- Production rollback remains possible while the old Token is retained for a short window.
- Future OIDC or scope-specific Token work remains separate because it changes CI authentication architecture.

## Relationship To U-FIX-CF-ACCT-02

`U-FIX-CF-ACCT-01` owns Token permission scope and Secret value rotation.
`U-FIX-CF-ACCT-02` owns wrangler runtime warning cleanup in `wrangler.toml` and related CI configuration.

