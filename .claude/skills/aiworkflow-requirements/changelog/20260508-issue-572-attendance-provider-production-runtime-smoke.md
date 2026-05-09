# Issue #572 attendanceProvider production runtime smoke

| version | date | summary |
| --- | --- | --- |
| v2026.05.08-issue572-attendance-provider-production-runtime-smoke | 2026-05-08 | Issue #572 attendanceProvider production runtime smoke を `implemented-local / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` として同期。Phase 12 skill-feedback-report の 3 findings（runner 命名分裂 / 状態語彙 / Phase 12 path 実在検証）を `lessons-learned-issue-572-attendance-provider-production-runtime-smoke-2026-05.md` に L-572-001..003 として正本化し、artifact inventory を新設。`SKILL.md` / `LOGS/_legacy.md` / `indexes/{keywords.json, quick-reference.md, resource-map.md, topic-map.md}` / `references/task-workflow-active.md` を同一 wave で同期済み。Issue #371 `PASS_RUNTIME_VERIFIED` 昇格・production GET smoke 実行・commit / push / PR は user approval 後のみ。 |

## 反映内容

- `references/lessons-learned-issue-572-attendance-provider-production-runtime-smoke-2026-05.md` を新規追加し、Phase 12 skill-feedback-report.md の 3 findings を L-572-001..003 として転記。
- `references/workflow-issue-572-attendance-provider-production-runtime-smoke-artifact-inventory.md` を新規追加し、`apps/api/scripts/runtime-smoke/`（`run-smoke.sh` / `run-production-smoke.sh` / `redact-filter-production.sh` / `lib/api-url-guard.sh` / `lib/evidence-summary.sh` / `README.md`）、`scripts/lib/redaction.sh`、`docs/30-workflows/runbooks/production-runtime-smoke-attendance.md`、`tests/unit/runtime-smoke.test.sh`、`tests/unit/redaction.test.sh` を inventory 化。
- 状態語彙 `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（contract ready + runtime evidence pending_user_gate）を Issue #572 文脈で採用し、`PASS_RUNTIME_VERIFIED` は production GET smoke 実行後の昇格にのみ使用する境界を明文化。
- Phase 12 strict 7 files の filename exact match と path 実在検証（runbook / runner / unit test）を再発防止条項として L-572-003 で固定。
- 関連 PR / Issue: GitHub Issue #572（本タスク起票元、CLOSED 維持）、Issue #371（attendanceProvider DI migration / `PASS_RUNTIME_VERIFIED` 昇格対象）。PR 文面は `Refs #572` のみ（`Closes #572` 不可）。
