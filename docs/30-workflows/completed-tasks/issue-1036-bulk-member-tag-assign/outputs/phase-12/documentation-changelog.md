# Documentation changelog

Date: 2026-06-01

## Workflow-local

- Created the `docs/30-workflows/completed-tasks/issue-1036-bulk-member-tag-assign/` workflow (new):
  `index.md`, `artifacts.json`, Phase 1-13 files, `tasks/task-A|B|C.md`.
- Created strict 7 Phase 12 outputs under `outputs/phase-12/`:
  `main.md`, `implementation-guide.md`, `system-spec-update-summary.md`,
  `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`,
  `phase12-task-spec-compliance-check.md`.
- Updated `phase-11-manual-test.md` with VISUAL_ON_EXECUTION screenshot canonical names
  and saved 4 local fixture screenshots:
  `bulk-tag-picker-assign-mode.png`, `bulk-tag-picker-unassign-mode.png`,
  `bulk-tag-result-all-success.png`, `bulk-tag-result-partial-failure.png`.
- Kept root `artifacts.json` and `outputs/artifacts.json` mirrored (status
  `implemented_local_runtime_pending`).
- Recorded the #913 decoupling rationale (DB natural idempotency) and the audit `batchId`
  correlation (no `correlation_id` column) in Phase 2/3 and the implementation guide.

## aiworkflow-requirements（global skill sync）

- Same-wave registration候補として Issue #1036 workflow を artifact inventory /
  quick-reference / resource-map / task-workflow-active へ discoverable 化する
  implementation ledger entry として記録。
- current API references（`api-endpoints.md` 等）への `POST /admin/members/tags/bulk` /
  `GET /admin/tags` 反映は workflow-local 正本と実コードで完了。global index 追記は現時点 N/A。

## task-specification-creator（global skill sync）

- No template change required. The workflow follows existing strict 7 physical outputs,
  root/output artifacts parity, workflow state vocabulary, and VISUAL_ON_EXECUTION boundary rules.
- usage log のみ（template no-op）。

## Notes

- 本 wave は実装・検証・ドキュメント同期まで完了。commit・PR・GitHub issue mutation は一切行わない。
- Issue #1036 は CLOSED 維持（reopen しない）。
