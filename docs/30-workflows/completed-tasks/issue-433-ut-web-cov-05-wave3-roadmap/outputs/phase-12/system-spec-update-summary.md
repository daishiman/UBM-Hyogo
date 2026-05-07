# System Spec Update Summary

## Step 1-A: Workflow Guide

Updated `docs/30-workflows/ut-coverage-2026-05-wave/README.md` with the Issue #433 wave-3 roadmap workflow and pending final roadmap path.

## Step 1-B: Source Unassigned Task

Updated `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` from `未実施` to `仕様書化済`, without deleting or moving the source task.

## Step 1-C: aiworkflow Requirements

Updated:

- `.claude/skills/aiworkflow-requirements/references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md`
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`

## Step 2: Drift Withdrawal

Removed stale canonical references for `ut-web-cov-01` and `ut-08a-01` in the Issue #433 workflow spec. Current roots are under `docs/30-workflows/completed-tasks/`.

## Evidence Boundary

The planned roadmap file is now Status `COMPLETED`; Phase 5〜9 が実行され measured coverage / gap mapping / candidate tasks が反映済。CI `verify-indexes-up-to-date` の green は push 後に取得（本タスクは commit/push/PR 禁止）。
