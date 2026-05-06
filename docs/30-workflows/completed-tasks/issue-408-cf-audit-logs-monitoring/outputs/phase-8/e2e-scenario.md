# e2e シナリオ: schedule 1 サイクル統合テスト

## 前提

- `CF_AUDIT_TOKEN_PROD` GitHub Secret 登録済（Phase 5 完了）
- D1 `cf_audit_log` / `cf_audit_baseline` テーブル production 適用済（Phase 5 migration）
- `scripts/cf-audit-log/{fetch,analyze,baseline}.ts` 実装済
- `.github/workflows/cf-audit-log-monitor.yml` / `cf-audit-log-monitor-watchdog.yml` 配置済

## シナリオ S-1: 主 workflow の 1 サイクル実走

### コマンド

```bash
# 1) 手動 trigger（schedule を待たず即実行）
gh workflow run cf-audit-log-monitor.yml --ref dev

# 2) run id を取得
RUN_ID=$(gh run list --workflow=cf-audit-log-monitor.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# 3) 完了待機 + status 確認
gh run watch "$RUN_ID"
gh run view "$RUN_ID" --json status,conclusion,jobs
```

### 期待結果

- `status=completed` / `conclusion=success`
- jobs[*].steps すべて green（fetch / analyze / dedup-check）
- Cloudflare API 呼び出しは `Audit Logs:Read` scope のみで成功

## シナリオ S-2: D1 への ingest 確認

### コマンド

```bash
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) AS recent FROM cf_audit_log WHERE ingested_at_ms > (unixepoch() - 3600) * 1000"
```

### 期待結果

- `recent ≥ 1`（直近 1h の audit event が 1 件以上 ingest されている）
- 0 件の場合は Cloudflare 側に該当期間の audit log が存在しない可能性があるため、`min(ingested_at_ms)` / `max(ingested_at_ms)` を別 query で確認し、Cloudflare Dashboard の Audit Logs と突き合わせる

## シナリオ S-3: 合成 HIGH event 注入による Issue 自動起票

### コマンド

```bash
# 合成 fixture を inject（unknown IP からの認証成功イベント 1 件）
cp scripts/cf-audit-log/fixtures/synthetic-high.json /tmp/synthetic-high.json

# analyze を fixture mode で再 trigger
gh workflow run cf-audit-log-monitor.yml --ref dev \
  -f synthetic_input=fixtures/synthetic-high.json

# 起票された Issue を確認
gh issue list \
  --label "type:security,priority:high" \
    --json number,title,labels,createdAt
```

### 期待結果

- Issue が 1 件 `OPEN` で生成される
- title は `[cf-audit-log-monitor] HIGH: unexpected IP authentication success` 相当
- labels に `type:security` / `priority:high` / `bot:cf-audit-log-monitor` が付与
- body に fingerprint hash（dedup key）が含まれる

## シナリオ S-4: De-duplication 検証

### コマンド

```bash
# 同じ fixture で 2 回目を trigger
gh workflow run cf-audit-log-monitor.yml --ref dev \
  -f synthetic_input=fixtures/synthetic-high.json

# Issue 数が増えていないことを確認
gh issue list \
  --label "type:security,priority:high" \
    --json number,title \
  --jq 'length'
```

### 期待結果

- Issue 数が S-3 と同じ（増加しない）
- workflow log に `dedup: skip (fingerprint=...)` 相当の出力が残る
- 既存 Issue body に「再観測 timestamp」が追記される（comment ではなく body 上書き許容）

## シナリオ S-5: 重要度別 alerting の確認

| 重要度 | fixture | 期待 label |
| --- | --- | --- |
| HIGH | unknown IP からの認証成功 | `priority:high` + `type:security` |
| MEDIUM | 403 急増（per-minute baseline 超過） | `priority:medium` + `type:security` |
| LOW | 業務時間外（JST 22:00-06:00）利用 | `priority:low` + `type:security` |

各 fixture を順次 inject し、それぞれ Issue 起票を確認する。

## 終了条件

- S-1 〜 S-5 すべて期待結果通り
- evidence（実 run log / D1 row count / Issue JSON）は Phase 11 で採取・保存

## 関連

- `outputs/phase-8/watchdog-test.md`
- `outputs/phase-11/`（runtime evidence の保存先）
