# Phase 12 main

## Summary

`implementation_complete_pending_pr`: 2026-05-15 にユーザーがローカルで production / staging coverage SQL を実行し両方 0 件を確認したうえで、`apps/api/src/repository/schemaQuestions.ts#findStableKeyByQuestionId` の `schema_questions.stable_key` SELECT fallback を削除した。`resolve-stable-key.spec.ts` を fallback retired セマンティクスへ書き換え、focused unit test 6/6 PASS、`tsc -p apps/api` PASS、target file 内 static grep 0 件を確認した。aiworkflow-requirements 正本（`database-implementation-core.md`）の lookup 順序 / contract / 移行終端条件を retired 表記に同期した。残る作業は Phase 13 ユーザー承認後の commit / push / PR 作成のみ。

## Boundary

- Issue #299 state は OPEN のまま維持（ユーザー指示）。PR 本文は `Refs #299` を使用し `Closes #299` は使用しない。
- 本 Phase 12 はローカル実装完了 + close-out documentation を示す。commit / push / PR / Issue mutation はいずれも Phase 13 ユーザー承認後にのみ実行する。

## Strict 7 inventory

| File | State |
| --- | --- |
| `main.md` | `completed (implementation_complete_pending_pr)` |
| `implementation-guide.md` | `completed (implementation_complete_pending_pr)` |
| `system-spec-update-summary.md` | `completed (implementation_complete_pending_pr)` |
| `documentation-changelog.md` | `completed (implementation_complete_pending_pr)` |
| `unassigned-task-detection.md` | `completed (implementation_complete_pending_pr)` |
| `skill-feedback-report.md` | `completed (implementation_complete_pending_pr)` |
| `phase12-task-spec-compliance-check.md` | `completed (implementation_complete_pending_pr)` |
