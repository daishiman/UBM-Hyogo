# Phase 5 — 実装計画

## 変更対象ファイル

| ファイル | 種別 | 概要 |
| --- | --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 | HOLD 解除 + hourly schedule + 3 post-step + artifact upload |
| `.github/workflows/cf-audit-log-7day-summary.yml` | 新規 | 168 hourly snapshots aggregation + evidence PR 起票 |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 編集 | §11.1 contract + 変更履歴 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 編集 | Issue #549 entry を 3 段昇格仕様で更新 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 編集 | Issue #586 close-out section 追加 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 編集 | 2026-05-09 update 注記追加 |
| `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | 編集 | HOLD 解除を反映 |

## I/O 契約

- hourly snapshot file: `outputs/observation/<ISO8601-UTC-hour>.json`（`HourlySnapshot` schema）
- artifact name: `hourly-snapshot-${{ github.run_id }}` / retention: 8 days
- 7-day summary aggregation:
  - in: `hourly-merged/*.json`（`hourly-snapshot-*` artifact を `merge-multiple: true` で展開）
  - out json: `outputs/phase-11/evidence/hourly-run-7day-summary.json`
  - out md: `outputs/phase-11/evidence/hourly-run-7day.md`
  - out leakage log: `outputs/phase-11/evidence/leakage-grep-7day.log`
- 件数検証: `EXPECTED_SNAPSHOTS_7DAY=168`、不足時 step exit 1
