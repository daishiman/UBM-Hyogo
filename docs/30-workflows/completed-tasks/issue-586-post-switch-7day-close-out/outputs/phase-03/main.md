# Phase 3 — 設計

## hourly workflow（編集）

`.github/workflows/cf-audit-log-monitor.yml`

- `on.schedule: '5 * * * *'` を復活（HOLD 解除）
- `inputs.dry_run.default: false` に変更
- job-level `env:` で `CF_AUDIT_CLASSIFIER`（`vars.CF_AUDIT_CLASSIFIER || 'threshold'`）を参照
- `Compute window` step に `hour` output 追加（snapshot ファイル名に使用）
- `Build hourly snapshot` step を追加（`post-switch-monitor.ts --hour=<h> --out=outputs/observation/<h>.json`）
- `Secret leakage grep (post-step gate)` step 追加（`--exit-on-detect`、hourly fail 化）
- `Fallback rate alert (3h consecutive)` step 追加（`--threshold=0.05 --window=3`、`dry_run!=true` のときのみ）
- `Upload hourly artifact` step 追加（`actions/upload-artifact@v4`、`retention-days: 8`、`name: hourly-snapshot-${{ github.run_id }}`）
- HOLD コメント / `Enforce HOLD dry-run mode` step は撤去

## 7-day summary workflow（新規）

`.github/workflows/cf-audit-log-7day-summary.yml`

- `schedule: '0 1 */7 * *'` + `workflow_dispatch`
- cross-run `gh api` artifact zip download で `hourly-snapshot-*` と run URL 一覧を取得
- `post-switch-monitor.ts --aggregate --input=hourly-merged --out=<json>` + `--format=markdown --out=<md>`
- `EXPECTED_SNAPSHOTS_7DAY=168` 件数検証 → 不足時は exit 1
- `secret-leakage-grep.ts --exit-on-detect` を 7-day window で実行
- `peter-evans/create-pull-request@v6` で `chore/issue-586-7day-evidence-${{ github.run_id }}` ブランチに PR 起票（base=`dev`）

## SSOT 4 ファイル

| 同期先 | 反映内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | §11.1 Issue #586 contract 追加 + 変更履歴 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | Issue #549 entry を 3 段昇格対応に更新 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | Issue #586 close-out section 追加 |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` | 2026-05-09 update 注記追加 |

`docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` も HOLD 解除へ更新（Issue #518 終結手順）。
