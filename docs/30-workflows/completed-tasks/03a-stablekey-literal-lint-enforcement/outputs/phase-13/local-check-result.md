# Local Check Result

Status: NOT_EXECUTED.

Local checks are intentionally not run as Phase 13 close-out because the user has not approved commit/PR execution and this pass only improves the task specification.

Commands to run before PR:

- `mise exec -- pnpm install --force`
- `mise exec -- pnpm typecheck`
- `mise exec -- pnpm lint`
- `mise exec -- pnpm test`
- `mise exec -- pnpm build`
