# Phase 3: 計画 — read-only コマンド実行手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-581-cf-audit-90day-reobservation-reminder` |
| Phase | 3 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |

[実装区分: ドキュメントのみ]

## 目的

Phase 6/7 で実行する read-only コマンドを順序付きで列挙し、failure mode と recovery path を明示する。

## コマンド一覧

### Gate-A: monitor history + watchdog HOLD state

```bash
# monitor workflow runs（90日分・JSON array 必須）
gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id, status, conclusion, createdAt:.created_at, updatedAt:.updated_at, headSha:.head_sha, event, url:.html_url}' \
  | jq -s '.' \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json

# watchdog lifecycle evidence
# Issue #518 deleted the watchdog workflow when cf-audit monitoring entered HOLD.
# Preserve that lifecycle state as JSON instead of querying a non-existent workflow.
jq -n '{
  workflow: "cf-audit-log-monitor-watchdog.yml",
  status: "deleted_by_issue_518_hold",
  source: "docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/",
  gateAUse: "watchdog heartbeat is not available during HOLD; Gate-A uses monitor run history plus this lifecycle marker"
}' \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gh-run-list-watchdog.json
```

### Gate-B: alert issues + D1 + baseline thresholds

```bash
# cf-audit ラベル付き issue（false positive 判定用）
gh api --paginate \
  'repos/daishiman/UBM-Hyogo/issues?state=all&labels=cf-audit&per_page=100' \
  --jq '.[] | {number, title, state, labels:[.labels[].name], createdAt:.created_at, closedAt:.closed_at}' \
  | jq -s '.' \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/gh-issues-cf-audit.json

# D1 cf_audit_log 90日集計（read-only SELECT のみ）
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json \
  --command "SELECT COUNT(*) AS total_events, SUM(CASE WHEN is_anomaly=1 THEN 1 ELSE 0 END) AS anomaly_events FROM cf_audit_log WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000;" \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/d1-cf-audit-90day-summary.json

# baseline thresholds
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json \
  --command "SELECT mean, stddev, p95, p99, recalibrated_at FROM cf_audit_baseline ORDER BY recalibrated_at DESC LIMIT 1;" \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/baseline-90day-thresholds.json
```

### Gate-C: tuning cost

```bash
# tuning cost 関連 issue（owner-authored monthly minutes log）
gh api --paginate \
  'repos/daishiman/UBM-Hyogo/issues?state=all&labels=cf-audit-tuning&per_page=100' \
  --jq '.[] | {number, title, state, body, createdAt:.created_at}' \
  | jq -s '.' \
  > docs/30-workflows/issue-581-cf-audit-90day-reobservation-reminder/outputs/phase-11/tuning-cost-issues.json
```

## failure mode と recovery

| failure | 検知 | recovery |
| --- | --- | --- |
| `gh api` rate limit | `403` レスポンス | retry-after 待機後再実行。token は read-only |
| D1 `no such table: cf_audit_log` | query result の `error` フィールド | `PENDING_RUNTIME_EVIDENCE` marker を `d1-cf-audit-90day-summary.json` に書き Gate-B pending 固定 |
| `cf-audit-log-monitor.yml` 90 日内に failure / gap が存在 | Gate-A 判定ロジック | Gate-A FAIL を記録し `observation_continue` |
| watchdog YAML 不在 | `.github/workflows/cf-audit-log-monitor-watchdog.yml` が存在しない | Issue #518 HOLD による削除済み lifecycle marker を `gh-run-list-watchdog.json` に保存し、非存在 workflow API は叩かない |
| baseline テーブル不在 | query result の `error` | `PENDING_RUNTIME_EVIDENCE` marker、Gate-B pending |

## 順序

1. precondition-check（Phase 5）
2. Gate-A コマンド（Phase 6）
3. Gate-B コマンド（Phase 7 前半）
4. Gate-C コマンド（Phase 7 後半）
5. redaction-check（Phase 9）
6. gate-decision.md 作成（Phase 11）
7. system-spec-update-summary.md 作成（Phase 12）

## 完了条件

- [ ] 全 Gate のコマンドが揃っている
- [ ] failure mode と recovery が網羅されている
- [ ] read-only 制約が破られていない（mutation コマンドが含まれない）

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/phase-03.md`
- `.claude/skills/task-specification-creator/references/commands.md`
