# Issue #497 Post-release Dashboard 30 Day Feedback

- Workflow root: `docs/30-workflows/issue-497-post-release-dashboard-30day-conclusion/`
- State: `spec_created / docs-only / NON_VISUAL / external-time-dependent`
- Parent trace: `docs/30-workflows/completed-tasks/issue-351-09c-post-release-dashboard-automation/outputs/phase-12/unassigned-task-detection.md`
- Runtime gate: 30 day schedule evidence is collected only after `min_by(.createdAt)` is older than or equal to the execution date minus 30 days.
- Changelog purpose: records the formalized Issue #497 follow-up contract. It is not runtime conclusion evidence.
- System spec sync: `references/deployment-gha.md` now records the 30 day schedule feedback contract, evidence files, redaction gate, and failure rate threshold.
- Active workflow sync: `references/task-workflow-active.md`, `indexes/quick-reference.md`, and `indexes/resource-map.md` include the Issue #497 follow-up route.
- Source task state: `docs/30-workflows/unassigned-task/task-issue-351-post-release-dashboard-30day-conclusion-001.md` is `formalized`; parent U-1 points to this workflow.
- Parent automation hardening: `redaction-check.sh` now writes `redaction-check.md`, and `ci.yml` runs `pnpm post-release-dashboard:test`.
- Lessons-learned: `lessons-learned/lessons-learned-issue-497-post-release-dashboard-30day-conclusion-2026-05.md` records L-497-001..004（外部時間依存の二相状態 / file-existence と runtime AC の分離 / 親契約 hardening を同サイクルで実施 / schedule 系 workflow の 3-fence detection model）.
- Parent artifact-inventory follow-up trace: `references/workflow-issue-351-09c-post-release-dashboard-automation-artifact-inventory.md` に Issue #497 follow-up workflow root を追記。
- Legacy filename register: 旧→新 filename 改名なし（新規 workflow root のため `references/legacy-ordinal-family-register.md` 更新不要）.
