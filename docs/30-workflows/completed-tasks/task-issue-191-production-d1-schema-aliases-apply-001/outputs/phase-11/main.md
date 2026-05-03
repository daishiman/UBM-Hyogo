# Phase 11 NON_VISUAL Evidence

## Scope

This workflow has no UI surface. Phase 11 records pre-apply static and local evidence only. Production D1 runtime evidence is reserved for Phase 13 after explicit user approval.

## Evidence Index

| Evidence | Path | Status |
| --- | --- | --- |
| Static checks (EV-11-1) | `static-checks.md` | ✅ collected (S-1〜S-5 PASS) |
| DDL static evidence (EV-11-2) | `local-pragma-evidence.md` | ✅ recorded (DDL static evidence; local apply 完了は先行 task) |
| Typecheck / lint (EV-11-3) | `typecheck-lint.md` | ✅ PASS (exit 0) |
| CLI wrapper grep (EV-11-4) | `cli-wrapper-grep.md` | ✅ 0 直叩き hit in scripts/apps/packages |
| Env binding evidence (EV-11-5) | `env-binding-evidence.md` | ✅ ubm-hyogo-db-prod / `[env.production]` 一致 |
| Production apply readiness (EV-11-6) | `production-apply-readiness.md` | ✅ Design GO / Runtime GO pending user approval |

## Boundary

Phase 11 completion is not production apply success. Runtime PASS requires Phase 13 `user-approval.md`, pre/post migration inventory, and PRAGMA evidence. `migrations-apply.log` is required only when an apply command actually runs; for the already-applied path, `d1-migrations-table.txt` is the ledger substitute.

## Phase 13 で取得予定の evidence

| ID | path |
| --- | --- |
| EV-13-1 | `outputs/phase-13/user-approval.md` |
| EV-13-2 | `outputs/phase-13/migrations-list-before.txt` |
| EV-13-3 | `outputs/phase-13/tables-before.txt` |
| EV-13-4 | `outputs/phase-13/migrations-apply.log` if apply executes, otherwise `outputs/phase-13/d1-migrations-table.txt` |
| EV-13-5 | `outputs/phase-13/pragma-table-info.txt` |
| EV-13-6 | `outputs/phase-13/pragma-index-list.txt` |
| EV-13-7 | `outputs/phase-13/migrations-list-after.txt` |
