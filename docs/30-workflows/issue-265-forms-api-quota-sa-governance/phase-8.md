---
workflow_id: issue-265-forms-api-quota-sa-governance
phase: 8
taskType: docs-only
visualEvidence: NON_VISUAL
state: spec_created
---

# Phase 8 (root pointer)

正本: `outputs/phase-8/phase-8.md`。

## サマリ

- リスク R-1〜R-7（旧 Sheets API 混入 / 実値混入 / 別 API 同居 / cron 変更 / wrangler 直接呼び / 切替時 403 / 参照孤立）。
- 更新トリガー 4 種（cron 変更 / 別 API 同居 / rotation / project 切替）。
- 廃止条件: Forms API 撤退 or 同期方式根本変更。
