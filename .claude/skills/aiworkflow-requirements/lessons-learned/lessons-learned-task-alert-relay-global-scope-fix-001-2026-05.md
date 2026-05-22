# task-alert-relay-global-scope-fix-001 lessons learned（2026-05）

## L-ARGSF-001: Workers global scope safety is an import-time contract

Cloudflare Workers validation error 10021 can be caused by code that is never
reached by a request handler if the forbidden API is called at module import
time. The regression guard must import the route module after spying on the
forbidden API and assert that the import itself does not call it.

For `apps/api/src/routes/internal/alert-relay.ts`, a module-private lazy cache
keeps the existing stable `isolateId` log semantics while moving
`crypto.randomUUID()` out of global scope.

## L-ARGSF-002: Local 1Password field names and child wrangler env names differ

The operator's local 1Password item `Employee/ubm-hyogo-env` stores deploy token
values in environment-specific fields:

- `CLOUDFLARE_API_TOKEN_STAGING`
- `CLOUDFLARE_API_TOKEN_PRODUCTION`

`wrangler` and GitHub Actions still consume the child environment variable name
`CLOUDFLARE_API_TOKEN`. `scripts/cf.sh deploy --env staging|production` is the
bridge: it reads the local field by environment, then exposes only
`CLOUDFLARE_API_TOKEN` to the child process. This is not a request to reintroduce
environment-suffixed GitHub CI secret names.

## L-ARGSF-003: Grep gates must model top-level scope

The global-scope sweep must target top-level declarations only. A broad search
for `crypto.randomUUID()` can confuse valid function-local calls with Worker
global-scope violations. The accepted gate is anchored on zero-indented
declarations such as `^const` / `^let` / `^var` in Workers source files.

## L-ARGSF-004: Dry-run auth success is not deploy validation success

A local dry-run that fails before wrangler reaches its `--dry-run` exit path is
not a deploy validation pass. The close-out evidence for this task required the
1Password field bridge first, then a fresh
`bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging --dry-run`
run that reached wrangler and exited with `--dry-run: exiting now`.

## L-ARGSF-005: Phase 12 strict outputs are part of the fix

For a deploy blocker close-out, code and tests are insufficient unless the task
root also exposes the strict seven Phase 12 outputs, canonical artifacts
metadata, same-wave resource-map / quick-reference / task-workflow sync, and a
clear user gate for commit / push / PR / real deploy job execution.
