# Phase 1 Output: 要件定義

Issue #303 は closed / completed のまま参照する。タスク仕様は、UT-GOV-001 second-stage reapply の fresh GitHub GET evidence を入力正本として aiworkflow-requirements へ反映する実行仕様である。

## Acceptance Criteria

- AC-1: applied GET evidence の `required_status_checks.contexts` を dev / main 別に検証し、placeholder や null を final state として扱わない。
- AC-2: 反映先 references / indexes の current state と GitHub GET evidence の対応表を作成する。
- AC-3: `.claude/skills/aiworkflow-requirements/` を正本、`.agents/skills/aiworkflow-requirements/` を mirror として扱う。
- AC-4: `expected-contexts-*` や payload ではなく `branch-protection-applied-*` の fresh GET 由来であることを全更新記録に明記する。
- AC-5: Issue #303 は closed のまま `Refs #303` のみ採用し、`Closes #303` を使わない。
- AC-6: Phase 11 は NON_VISUAL 代替証跡で実施し、スクリーンショットを要求しない。
- AC-7: Phase 12 で implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check を作る。
- AC-8: Phase 13 は user approval gate を保持し、commit / push / PR は明示承認まで blocked とする。

## 現状メモ

上流 `completed-tasks/utgov001-second-stage-reapply` の applied evidence は placeholder であり、GitHub API の現在値とは一致しない。実行時は fresh GET を取得してから反映する。
