# Phase 12 — main

`[実装区分: 実装仕様書]`
workflow_state: `implemented_local_evidence_captured`

## 概要

issue-247 は UT-06-FU-A unassigned source（`UT-06-FU-A-open-next-config-regression-tests.md`）から起票した OpenNext Workers 設定回帰防止用の **infra regression test 追加** タスク。本フェーズで実装 + skill 同一 wave 同期を完了した。

## 成果物（実装・同期フェーズ）

- workflow ルート: `docs/30-workflows/issue-247-apps-web-opennext-config-regression-tests/`
- Phase 1〜13 13 ファイル
- `artifacts.json` (root + outputs mirror)
- `outputs/phase-11/manual-test-result.md`（実装フェーズで evidence 追記）
- `outputs/phase-12/` strict 7 ファイル

## 実装済み

- `apps/web/__tests__/opennext-config-regression.spec.ts`
- `.github/workflows/ci.yml` OpenNext config regression guard step
- `.claude/skills/aiworkflow-requirements/` quick-reference / resource-map / task-workflow-active / deployment OpenNext spec / artifact inventory / changelog / LOGS / lessons

## Gate 状況

| Gate | status |
|------|--------|
| Gate-A | passed（spec_review PASS） |
| Gate-B | passed（実装＋focused Vitest evidence PASS） |
| Gate-C | pending（commit/push/PR/issue mutation は user-gated） |
