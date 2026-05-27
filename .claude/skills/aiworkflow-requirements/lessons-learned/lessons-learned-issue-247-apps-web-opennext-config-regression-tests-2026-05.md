# Lessons Learned: Issue #247 apps/web OpenNext config regression tests

## L-I247-001: Config regression guards should live beside the app they protect

OpenNext Workers drift was a configuration risk, not runtime UI behavior. A focused `apps/web/__tests__/opennext-config-regression.spec.ts` keeps the feedback loop small and avoids coupling the guard to deploy-time Cloudflare credentials.

## L-I247-002: Avoid new parser dependencies for narrow TOML invariants

The first implementation attempt considered `smol-toml`, but adding a dependency caused lockfile churn and slow registry resolution. For this bounded config file, a tiny test-local parser for section headers and scalar values was sufficient and easier to audit.

## L-I247-003: Operational policy can be tested through absence checks

The `scripts/cf.sh` deploy route is protected by asserting that `apps/web/package.json` does not expose `deploy`, `deploy:staging`, or `deploy:production`. This turns a prose rule into a CI-enforced invariant without adding another wrapper.

## L-I247-004: Phase 13 user-gated state belongs in reason text, not status vocabulary

`pending_user_approval` in phase status conflicts with task-specification-creator status vocabulary. Use `pending` as the status and record commit / push / PR / issue mutation approval as a boundary reason.
