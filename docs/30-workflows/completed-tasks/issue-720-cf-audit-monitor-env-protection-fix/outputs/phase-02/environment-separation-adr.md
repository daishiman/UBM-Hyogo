# ADR: Monitoring workflows do not use deployment environments

## Status

Accepted for this local implementation cycle.

## Context

`cf-audit-log-monitor.yml` reads production Cloudflare audit data and can send approved
notifications / GitHub Issues, but it does not deploy, migrate, roll back, or mutate production
infrastructure. Binding it to the GitHub `production` environment caused the `dev` branch hourly
schedule to be blocked by deployment branch protection.

## Decision

- Read-only or notification-only monitoring workflows do not declare `environment: production`.
- Deploy, rollback, schema apply, and other mutation workflows keep deployment environments.
- Monitoring credentials may be mirrored to repository-level secrets only when they are read-only
  or notification-only, the notification destination is approved, and the operation is explicitly
  user-approved.
- Production environment branch policies are not changed by this task.

## Consequences

The hourly monitor can run from `dev` after repository-level secrets are mirrored. The deploy
protection boundary remains attached to workflows that actually mutate production resources.
