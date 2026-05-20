# Hourly 6 consecutive success evidence

Status: `PENDING_USER_GATE`

## 取得コマンド

```bash
gh run list --workflow=cf-audit-log-monitor.yml --branch dev --event schedule --limit 10 \
  --json databaseId,conclusion,createdAt,htmlUrl,event \
  > hourly-runs.json

jq '[.[] | select(.event=="schedule")] | .[:6] | all(.conclusion=="success")' hourly-runs.json
# 期待値: true
```

## PASS 条件

- 直近 6 件の schedule 起動 run の `conclusion` がすべて `success`
- 各 run の `htmlUrl` を本ファイルに転記

## 記録項目（PASS 達成後）

```yaml
collected_at: <ISO8601 UTC>
runs:
  - run_id: <id1>
    run_url: <url1>
    created_at: <ts1>
    conclusion: success
  - run_id: <id2>
    ...
  - run_id: <id6>
    ...
verdict: 6_consecutive_success_confirmed
```

## fail 時

途中 1 件でも `failure` があれば PASS 不成立。原因切り分けを Phase 07 fail table に従い実施し、6 連続 reset。secret value 起因の場合は本タスクスコープ内で再投入を user に依頼。Cloudflare API incident 等の外部起因の場合は別 issue 切り出しを Phase 12 unassigned-task-detection に記録。
