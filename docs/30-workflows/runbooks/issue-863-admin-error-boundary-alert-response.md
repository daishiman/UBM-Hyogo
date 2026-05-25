# Issue #863 Admin Error Boundary Alert Response

## Trigger

Sentry alert `admin-error-boundary` fired for `event=error.boundary.caught` and `scope=admin`.

## First Response

1. Open the Slack incident message in `#ubm-hyogo-incidents`.
2. Record the Sentry event digest, environment, release, and first seen time.
3. If the digest is `167275886`, compare against parent workflow `docs/30-workflows/fix-admin-server-components-render-error-stg/`.
4. Check the most recent deploy and confirm whether `/admin/**` Server Components changed.
5. If the same digest repeats after rollback or fix deploy, keep the incident open and attach the fresh Sentry event URL.

## Triage Boundaries

- Do not change Sentry console rules manually except during an approved emergency.
- Repo policy remains the source of truth: `infra/sentry-alerts/policies/admin-error-boundary.json`.
- Sentry apply, staging repro, production rollback, commit, push, and PR are user-gated operations.

## Resolution

Close the incident only after the Sentry event rate returns below threshold for two consecutive 5-minute windows and the owner records the linked fix or no-op verification.
