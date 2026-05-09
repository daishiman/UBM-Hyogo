# Phase 6: 実行手順 / コマンド仕様

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 6 |
| Phase 名 | 実行手順 / コマンド仕様 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

後続実行者が runtime evidence を取得する順序を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 6-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 6-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 6-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 手順

1. GitHub Actions run history を取得する。
2. Watchdog run history と stale issue を取得する。
3. D1 read-only summary を取得する。
4. Gate-A/B/C を `gate-decision.md` に記録する。
5. Phase 12 の正本同期対象を更新する。

## コマンド

```bash
mkdir -p docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11

gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id,status,conclusion,createdAt:.created_at,updatedAt:.updated_at,headSha:.head_sha,event,url:.html_url}' \
  | jq -s '.' \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-cf-audit-log-monitor.json

gh run list --workflow=cf-audit-log-monitor-watchdog.yml --limit 200 \
  --json databaseId,status,conclusion,createdAt,updatedAt,event,url \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-run-list-watchdog.json

gh issue list --state all --label cf-audit --limit 200 \
  --json number,title,state,labels,createdAt,closedAt,url \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/gh-issues-cf-audit.json
```

D1:

```bash
bash scripts/cf.sh audit-log baseline --days 90 \
  --output docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/baseline-90day-thresholds.json

bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --remote --json \
  --command "SELECT COUNT(*) AS total FROM cf_audit_log WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000;" \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/d1-cf-audit-90day-summary.json
```

Tuning cost:

```bash
gh issue list --state all --search "cf-audit tuning OR cf audit baseline" --limit 200 \
  --json number,title,state,labels,createdAt,closedAt,url \
  > docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/outputs/phase-11/tuning-cost-issues.json
```

`tuning-cost-summary.md` には `YYYY-MM`、入力 issue/runbook/manual log、合計分、月 240 分以上かを記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-06.md` | Phase 6 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 各コマンドの stdout が指定ファイルに保存されている。
- [ ] D1 コマンドは `--command "SELECT ..."` のみ。
- [ ] 認証不足の場合は Phase 8 の `blocked_auth_required` として記録する。
