# 2026-05-04 Issue #433 UT-WEB-COV-05 wave-3 roadmap

## Summary

Registered `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/` as `implemented-local / implementation / NON_VISUAL / Phase 1-12 completed / Phase 13 blocked_pending_user_approval` workflow. Materialized `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` with apps/web / apps/api / packages/shared / packages/integrations coverage totals, 30 raw gaps, 19 resolved wave-3-unit gaps, and 8 candidate tasks. Wave-2 historical nested workflow roots remain under `completed-tasks/` and the wave-2 README link table was reconciled.

## Updated Canonical References

- `SKILL.md` (Changelog row `v2026.05.04-issue433-ut-web-cov-05-wave3-roadmap` added)
- `indexes/quick-reference.md` (wave-3 roadmap row + `verify-indexes-up-to-date` post-push CI gate boundary added)
- `indexes/resource-map.md` (Issue #433 wave-3 roadmap row added)
- `indexes/topic-map.md` (regenerated to include L-UTCOV-009/010/011 keywords and wave-3 roadmap path)
- `indexes/keywords.json` (regenerated)
- `references/task-workflow-active.md` (wave-3 roadmap active row + dependencies + lessons line `L-UTCOV-001〜011`)
- `references/lessons-learned-ut-coverage-2026-05-wave.md` (renumbered to L-UTCOV-001〜011; 009 = package filter / script name 実測, 010 = public use-case D1 mock SQL fragment dispatch + `failOnSql`, 011 = apps/web auth/fetch/session fetch-mock helper + 構造的 uncovered)
- `references/workflow-ut-coverage-2026-05-wave-artifact-inventory.md` (wave-3 roadmap entry + Gate Boundary Upgrade gate notes synced)
- `LOGS/_legacy.md` headline + `changelog/20260504-issue-433-ut-web-cov-05-wave3-roadmap.md`
- `docs/30-workflows/ut-coverage-2026-05-wave/README.md` (wave-3 roadmap link)
- `docs/30-workflows/unassigned-task/ut-web-cov-05-followup-post-wave2-gap-analysis.md` (transferred_to_workflow marker)

## Implementation Artifacts

- `docs/30-workflows/issue-433-ut-web-cov-05-wave3-roadmap/` Phase 1-13 specs + `outputs/phase-12/` strict 7 files
- `docs/30-workflows/ut-coverage-2026-05-wave/wave-3-roadmap.md` (package totals / 30 raw gaps / 19 wave-3-unit resolved gaps / 8 candidate tasks)
- `vitest.config.ts` root coverage exclude / React alias additions to stabilize isolated `node-linker` coverage runs (CI gate 修復のための scope 拡張)

## Deferred Evidence

- post-push `verify-indexes-up-to-date` CI gate green
- Phase 13 PR / push / commit (user-approval gated)
- 8 candidate wave-3 tasks の Phase 1-13 spec 作成と着手は本ロードマップの後続 wave 担当

## Boundary Notes

- AC-5: local indexes rebuild / drift 0 と post-push CI evidence は別 gate。Phase 12 では前者のみ PASS、後者は Phase 13 user approval 後に取得する。
- vitest.config.ts の編集は CI gate 修復目的の scope 拡張として `phase12-task-spec-compliance-check.md` で正当化済み。
