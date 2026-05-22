# Runtime Pending Evidence — local-verify.log

## Commands To Capture

```bash
pnpm typecheck
pnpm lint
pnpm exec vitest run scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts
pnpm exec vitest run scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts
pnpm exec actionlint .github/workflows/cf-audit-log-7day-summary.yml
```

## Boundary

The current cycle changed specification and ledger files only. Replace this
template after implementation files are changed and the commands are executed.
