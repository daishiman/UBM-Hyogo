# Workflow dispatch dry_run evidence

Status: `PENDING_USER_GATE`

## 取得コマンド（user 承認後のみ）

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true --ref dev
sleep 60
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --event workflow_dispatch --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --json conclusion,htmlUrl,createdAt
```

## PASS 条件

- `conclusion == "success"`
- "Fetch audit logs into D1" step が success（過去 10 連続 fail で `exit 2` だった step）
- "Secret leakage grep (post-step gate)" step が success（exit 0）

## 記録項目（PASS 達成後に追記）

```yaml
run_id: <RUN_ID>
run_url: https://github.com/daishiman/UBM-Hyogo/actions/runs/<RUN_ID>
created_at: <ISO8601 UTC>
conclusion: success
dry_run: true
step_failures: 0
```

## 取得不能の場合

step 単位で fail を `gh api /repos/daishiman/UBM-Hyogo/actions/runs/<RUN_ID>/jobs` で切り分け、Phase 07「fail 時の対応」表に従い root cause を Phase 12 unassigned-task-detection に記録。
