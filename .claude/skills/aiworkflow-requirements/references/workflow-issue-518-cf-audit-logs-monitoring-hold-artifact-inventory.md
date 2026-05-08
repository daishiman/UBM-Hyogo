# Artifact Inventory: issue-518-cf-audit-logs-monitoring-hold

## Metadata

| Field | Value |
| --- | --- |
| Workflow | `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/` |
| State | `implemented-local / NON_VISUAL / HOLD / manual-check-only / Issue #518 CLOSED` |
| Parent issue | `https://github.com/daishiman/UBM-Hyogo/issues/518` |
| Predecessor | Issue #408 (Cloudflare Audit Logs Monitoring 構築) — `docs/30-workflows/completed-tasks/issue-408-cf-audit-logs-monitoring/` |
| Sync date | 2026-05-07 |

## Current Canonical Set

| Layer | Path | Role |
| --- | --- | --- |
| workflow root | `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/` | Phase 1-13 HOLD spec（縮退仕様の正本） |
| phase 12 evidence | `docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/outputs/phase-12/` | strict 7 files（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check） |
| weekly runbook | `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` | 週次手動確認 runbook の正本（経路 A: workflow_dispatch / 経路 B: local 実行 / 検知パターン / 再開条件） |
| modified workflow | `.github/workflows/cf-audit-log-monitor.yml` | schedule 削除 + `workflow_dispatch` のみ + `dry_run` 既定 `true` + `dry_run=false` 拒否 step |
| deleted workflow | `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 削除（hourly schedule 停止と同一 wave） |
| preserved scripts | `scripts/cf-audit-log/*.ts` | fetch / analyze / classifier / d1-client / issue-reporter — 手動 run と再開時の再利用前提で保持 |
| preserved schema | `apps/api/migrations/0014_create_cf_audit_log.sql` / `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` | rollback しない |
| preserved secrets | `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` | 保持。手動 run / 再開時に再利用 |
| spec sync | `references/observability-monitoring.md` §9 / `references/deployment-secrets-management.md` / `references/task-workflow-active.md` / `references/database-schema-cf-audit-log.md` / `indexes/quick-reference.md` / `indexes/resource-map.md` / `LOGS/_legacy.md` | HOLD 化を同一 wave で同期 |
| lessons | `references/lessons-learned-issue-518-cf-audit-logs-hold-2026-05.md` | L-ISSUE518-001 〜 003（schedule 削除三段防壁 / watchdog ライフサイクル同期 / 再開条件 spec 固定） |
| changelog | `.claude/skills/aiworkflow-requirements/changelog/20260507-issue518-cf-audit-logs-hold.md` | wave 単位の差分要約 |

## Boundary

- HOLD は workflow / scripts / schema / secret を保持し、自動起動経路（`on.schedule`）と公開 alerting（GitHub Issue 起票）を物理的に塞ぐ運用判断であり、Issue #408 の rollback ではない。
- runtime 上の `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` は HOLD 中の境界状態として `runtime PASS` と同義に扱わない。実 `PASS` 認定は再開後の hourly run / D1 row / synthetic issue / dedup / watchdog / token scope / baseline artifact の 7 evidence が実値化した時点。
- 自動監視の再開は以下 4 条件全てが満たされた時のみ。一つでも欠ける場合は週次手動確認 runbook で凌ぐ:
  1. Cloudflare token misuse の具体的な兆候の発生
  2. private な監視証跡置き場（非公開 repo / 暗号化 storage 等）の用意
  3. 無料枠を超えない実行頻度と保存先の設計確定
  4. 監視結果を公開 Issue に出さない alerting 経路の用意
- followup（unassigned-task）: `U-FIX-CF-ACCT-01-DERIV-04-FU-02-cold-storage.md` / `FU-03-ml-anomaly.md` / `FU-04-github-audit-merge.md` は本 HOLD 解除の前提条件（特に FU-02 cold-storage は再開条件 #2 に直結）。
