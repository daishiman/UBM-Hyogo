# Lessons Learned: Issue #359 production D1 apply（2026-05）

## L-I359-001: D1 migration apply must guard against unrelated pending migrations

`wrangler d1 migrations apply` is an operation over pending migrations, not a single-file patch. An apply-only workflow that intends to apply one migration must capture `migrations-list-before.txt` and stop if any target-external migration is pending.

## L-I359-002: Wrangler config path belongs in the runbook

`scripts/cf.sh` intentionally forwards arguments to Wrangler. Production D1 operation specs must include `--config apps/api/wrangler.toml` when they depend on API Worker D1 bindings and migration directory settings.

## L-I359-003: Rollback SQL is evidence, not permission

Including destructive rollback DDL in Phase 6 helps incident response, but it does not authorize execution. Phase 13 failures must present the DDL and impact, then wait for separate explicit approval.

## L-I359-004: Source unassigned close-out is part of Phase 12

When an unassigned production operation becomes a canonical workflow root, the source task must move to `transferred_to_workflow` in the same wave to avoid duplicate backlog state.
