# Phase 12 — issue-912-idempotent-attendance-remove-retry

## Summary

Issue #912 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として実装・証跡取得まで完了した。

冪等 `DELETE /meetings/:sessionId/attendance/:memberId` を再利用し、`MeetingPanel.tsx` の `attendanceMutation` を 2 本に分割して解除側に `useAdminMutation` の retry / idempotencyKey opt-in を有効化した。focused Vitest は 3 ファイル 97 tests PASS。staging/production curl・commit・push・PR は user-gated。

## Strict 7 Outputs

| # | File | Status |
| --- | --- | --- |
| 1 | `main.md` | present |
| 2 | `implementation-guide.md` | present |
| 3 | `system-spec-update-summary.md` | present |
| 4 | `documentation-changelog.md` | present |
| 5 | `unassigned-task-detection.md` | present |
| 6 | `skill-feedback-report.md` | present |
| 7 | `phase12-task-spec-compliance-check.md` | present |
