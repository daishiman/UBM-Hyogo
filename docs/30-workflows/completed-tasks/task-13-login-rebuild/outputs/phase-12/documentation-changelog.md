# Documentation Changelog

Date: 2026-05-09

## Changed

- Added `artifacts.json` and `outputs/artifacts.json`.
- Added Phase 12 strict 7 files.
- Updated Phase 3/5/6/9 contracts with `data-testid="login-card"` and `LoginCardProps.state`.
- Updated Phase 8/9 `rules_declined` role to `alert`.
- Rewrote Phase 13 as user-gated PR preparation.
- Updated aiworkflow-requirements references and logs.

## Commands To Verify

```bash
cmp -s docs/30-workflows/task-13-login-rebuild/artifacts.json docs/30-workflows/task-13-login-rebuild/outputs/artifacts.json
node .claude/skills/task-specification-creator/scripts/validate-phase-output.js docs/30-workflows/task-13-login-rebuild
node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/task-13-login-rebuild
git status --short
git diff --stat
```

## Runtime Commands Deferred

```bash
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web lint
pnpm --filter @ubm-hyogo/web test -- login
pnpm --filter @ubm-hyogo/web test:e2e -- login-smoke
pnpm --filter @ubm-hyogo/web verify-design-tokens
```

Deferred reason: no `apps/` implementation was added in this spec sync cycle.
