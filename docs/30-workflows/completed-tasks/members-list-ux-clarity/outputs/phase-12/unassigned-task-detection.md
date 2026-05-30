# Unassigned Task Detection

## Result

4件。

| ID | Issue | 仕様書 | 優先度 | 判定 |
| --- | --- | --- | --- | --- |
| task-members-ux-playwright-baseline-stabilization-001 | #1005 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/unassigned-task-specs/task-members-ux-playwright-baseline-stabilization-001.md` | 中 | current follow-up |
| task-members-selected-filters-chip-ux-hardening-001 | #1006 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/unassigned-task-specs/task-members-selected-filters-chip-ux-hardening-001.md` | 低 | current follow-up |
| task-members-density-toggle-help-hint-hardening-001 | #1007 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/unassigned-task-specs/task-members-density-toggle-help-hint-hardening-001.md` | 低 | current follow-up |
| task-members-list-ux-clarity-phase-artifact-reconciliation-001 | #1008 | `docs/30-workflows/completed-tasks/members-list-ux-clarity/unassigned-task-specs/task-members-list-ux-clarity-phase-artifact-reconciliation-001.md` | 中 | close-out follow-up |

## Review

1回目確認では `members-list-ux-clarity` の Phase 12 strict 7 と local visual evidence を確認し、当初の close-out report は未タスク0件だった。
2回目確認では SubAgent の独立分析と GitHub Issue / local unassigned-task 照合を実施し、既存 #222 / #224 / #998 では吸収できない今回サイクル固有の follow-up を4件に分離した。

重複回避:
- `task-11-followup-001-member-identities-local-seed.md` は `/members` data seed / runtime evidence の親課題であり、#1005 は Playwright spec の warm-up race 安定化に限定する。
- GitHub #222 は query parser shared 化、#224 は tags N+1、#998 は staging runtime/backfill/browser smoke であり、#1006 / #1007 / #1008 とは責務が異なる。

user-gated境界:
- baseline PNG更新、commit、push、PR、staging visual baseline は引き続き user-gated 境界として扱う。
