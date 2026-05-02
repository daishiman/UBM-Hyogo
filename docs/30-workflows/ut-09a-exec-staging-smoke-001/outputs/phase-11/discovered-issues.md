# Discovered Issues

## Status

Runtime issues recorded on 2026-05-02. Phase 11 was executed after explicit user instruction
and ended **BLOCKED**.

## Issues

| id | severity | issue | impact | evidence | next action |
| --- | --- | --- | --- | --- | --- |
| UT09A-RUNTIME-001 | high | Cloudflare CLI was unauthenticated through `bash scripts/cf.sh whoami` | staging deploy, tail, Forms sync, and UI smoke cannot run | `wrangler-tail.log`, `manual-smoke-log.md` | formalize Cloudflare token injection recovery |
| UT09A-RUNTIME-002 | high | Parent 09a canonical workflow directory is absent in this worktree | AC-1 placeholder replacement cannot run even after auth recovery | `main.md` AC-1 section | formalize 09a canonical directory restoration |
| UT09A-RUNTIME-003 | medium | staging URL is not confirmed because preflight failed | screenshots and Playwright trace/report cannot be captured | `playwright-staging/README.md` | rerun after UT09A-RUNTIME-001 and UT09A-RUNTIME-002 are resolved |

## AC-6 Blocker Record

| state | reason | evidence_path | checked_at |
| --- | --- | --- | --- |
| blocked | `cloudflare_unauthenticated` + `09a_directory_missing` | `outputs/phase-11/main.md` | 2026-05-02 |
