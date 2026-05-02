# Phase 11 Grep Verification

## Scope

This evidence checks that the runbook names the target migration, target database, objects, and operation boundary. It is a static document verification.

## Checked Terms

| Term | Expected | Result |
| --- | --- | --- |
| `0008_schema_alias_hardening.sql` | target migration named | PASS |
| `ubm-hyogo-db-prod` | target database named | PASS |
| `--env production` | production env flag named | PASS |
| `schema_aliases` | target table named | PASS |
| `idx_schema_aliases_revision_stablekey_unique` | unique index named | PASS |
| `idx_schema_aliases_revision_question_unique` | unique index named | PASS |
| `backfill_cursor` | added column named | PASS |
| `backfill_status` | added column named | PASS |
| `ユーザー承認` | approval gate named | PASS |
| `本タスク内では production migration を実行しない` | execution boundary named | PASS |

## Wrangler Boundary

PASS. Operational examples use `bash scripts/cf.sh ...`; direct `wrangler` invocation is prohibited by the runbook.
