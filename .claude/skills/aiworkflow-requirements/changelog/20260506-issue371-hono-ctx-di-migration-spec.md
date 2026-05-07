# 2026-05-06 Issue #371 UT-02A Hono ctx DI migration spec

## Summary

`docs/30-workflows/issue-371-ut-02a-followup-003-hono-ctx-di-migration/` を `implemented-local / implementation / NON_VISUAL / code evidence captured / runtime smoke pending` として同期した。

## Canonical facts

- target migration: builder optional `deps?` provider injection -> `attendanceProviderMiddleware` + `c.var.attendanceProvider`
- existing `DbCtx` remains `readonly db`; attendance builders use `RepositoryProviderCtx = DbCtx & { var: RepositoryProviderVariables }`
- missing provider must throw; test assertion canonical is `/attendanceProvider not bound/i`
- Phase 11 state is `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`; typecheck/lint/test/build/grep logs are captured under workflow evidence
- Issue #371 remains CLOSED; Phase 13 uses `Refs #371`

## Synced files

- `references/task-workflow-active.md`
- `indexes/quick-reference.md`
- `indexes/resource-map.md`
- `references/workflow-ut-02a-attendance-profile-integration-artifact-inventory.md`
- `docs/30-workflows/completed-tasks/ut-02a-attendance-profile-integration/ut-02a-followup-003-hono-ctx-or-di-container-migration.md`
