# U-UT01-09 docs-only close-out hardening

Date: 2026-04-30

## Summary

U-UT01-09 Phase 12 review feedback を受け、docs-only / NON_VISUAL / spec_created close-out でも、Phase 12 main を含む 7 成果物、root / outputs `artifacts.json` parity、起票元 unassigned close-out、system spec / LOGS / SKILL 履歴の同 wave 更新を必須化した。

## Updated

- `SKILL.md`
- `references/phase-12-documentation-guide.md`
- `references/phase-12-pitfalls.md`（[UBM-023] / [UBM-024] 追加）
- `references/patterns-lessons-and-pitfalls.md`（Resumable Batch / Cron Budget チェック項目追加）
- `../aiworkflow-requirements/references/lessons-learned-u-ut01-09-retry-offset-2026-04.md`（相互参照対象）

## Rule

1. **7 成果物の必須化**: docs-only / NON_VISUAL / spec_created でも Phase 12 main を含む 7 成果物を作成する（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）。
2. **artifacts.json parity**: root `artifacts.json` と `outputs/artifacts.json` の `metadata.workflow_state` / `metadata.docsOnly` / `metadata.taskType` を二重明示し、両者を同 wave で同期する。
3. **起票元 unassigned close-out**: 起票元 `unassigned-task/<起票元>.md` の AC 行と後継 workflow path を同 wave 更新し、quick-reference / resource-map / task-workflow-active / SKILL / LOGS まで一括同期する（[UBM-023]）。
4. **approval 分離**: `technical_go` と `user_approved` を分離する。Phase 11/12 の文書 close-out は進行できても、commit / push / PR はユーザー承認なしに実行しない（[UBM-024]）。
5. **offset budget**: chunk / cursor / processed_offset / invocation budget / invalidation 条件は spec 段階から数値で固定し、cron 実行間隔と max retry を combined budget として確定する（aiworkflow-requirements `references/lessons-learned-u-ut01-09-retry-offset-2026-04.md` L-UUT0109-003 参照）。
