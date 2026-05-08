# System Spec Update Summary

## Updated Canonical Specs

| File | Update |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | Issue #408 contract を Issue #518 HOLD / manual-check-only へ同期 |
| `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | `CF_AUDIT_*` secrets は HOLD 中も保持し手動確認時のみ使用する境界を追加 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 状態を HOLD / manual-check-only へ更新 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 即時導線を Issue #408 / #518 HOLD 表記へ更新 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | resource map を HOLD 状態と runbook へ更新 |
| `.claude/skills/aiworkflow-requirements/changelog/20260507-issue518-cf-audit-logs-hold.md` | 変更履歴を追加 |

## Decision

aiworkflow-requirements sync is required because the runtime contract changed from hourly automatic monitoring to manual-check-only HOLD. This is not a docs-only note; it changes operational truth for workflow triggers, watchdog existence, and secret usage.

## Boundary

Phase 11 post-merge runtime evidence remains `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` until after merge and one hourly tick observation.
