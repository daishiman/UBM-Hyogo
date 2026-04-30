# Unassigned Task Detection

## Current Findings

| ID | Finding | Materialized task |
| --- | --- | --- |
| A | implement `schema_aliases` DDL, repository, 07b write wiring, and 03a fallback lookup | `docs/30-workflows/unassigned-task/task-issue-191-schema-aliases-implementation-001.md` |
| B | retire `schema_questions.stable_key` fallback after migration metrics are stable | `docs/30-workflows/unassigned-task/task-issue-191-schema-questions-fallback-retirement-001.md` |
| C | promote direct stable-key update detection from grep to stronger repository or AST enforcement | `docs/30-workflows/unassigned-task/task-issue-191-direct-stable-key-update-guard-001.md` |

## Baseline

This docs-only task does not execute implementation work. The three items above are intentionally separated because doing them inside this closeout would cross from `spec_created / docs_only` into application implementation and CI hardening.
