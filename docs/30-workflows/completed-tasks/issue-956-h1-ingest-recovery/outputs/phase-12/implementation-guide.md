---
workflow_id: issue-956-h1-ingest-recovery
phase: 12
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 12 Implementation Guide

## Part 1 — 中学生レベルの説明

このタスクは、新しいプログラムを書く作業ではない。すでに作った診断画面と同期処理を、production で正しく動かすための手順書を整える作業である。

Google Form の回答が D1 に入らない原因 H1 は、鍵が入っていない、定期実行が動いていない、古い実行中ジョブが詰まっている、のような runtime 状態で起きる。だから、どの順番で確認し、何を証拠として残し、どこから先は人の承認が必要かをはっきりさせた。

## Part 2 — 技術者向け

This wave performs spec hardening only:

1. Preserve `docs-only / NON_VISUAL / spec_created`.
2. Add root and output `artifacts.json` mirror.
3. Add Phase 11 pending evidence inventory.
4. Add Phase 12 strict 7 outputs.
5. Mark the source unassigned task as consumed with a canonical workflow pointer.
6. Register the workflow in aiworkflow-requirements quick-reference, resource-map, task-workflow-active, artifact inventory, changelog, and LOGS.

Production execution remains user-gated:

- `bash scripts/cf.sh secret put/list --config apps/api/wrangler.toml --env production`
- authenticated `/admin/diagnostics/forms-pipeline` snapshot capture
- `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production`
- `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command ...`

No runtime PASS claim is valid until `outputs/phase-11/snapshot-after.json` and `snapshot-diff.md` show AC-1..AC-6.
