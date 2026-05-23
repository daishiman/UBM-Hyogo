# Phase 11: Manual Test (NON_VISUAL) plan / evidence template

visualEvidence: NON_VISUAL のため UI スクリーンショットは不要。
本タスクは staging D1 → R2 export 動作確認・restore drill を runbook 手順で実施することで evidence とする。

## 実行手順（user gate 後）

```bash
# 1. R2 bucket 作成 (Object Lock COMPLIANCE 7 年)
bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-staging --object-lock-enabled

# 2. D1 migration apply (staging)
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

# 3. wrangler binding 反映 deploy (staging)
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging

# 4. dry-run 確認 (workflow_dispatch から)
gh workflow run audit-log-cold-storage.yml -f dry_run=true -f target_date=$(date -u -d 'yesterday' +%F)

# 5. real run (workflow_dispatch dry_run=false)
gh workflow run audit-log-cold-storage.yml -f dry_run=false -f target_date=$(date -u -d 'yesterday' +%F)

# 6. restore drill (任意 1 日分)
bash scripts/cf.sh r2 object get \
  --bucket ubm-audit-cold-storage-app-staging \
  --key application/yyyy=YYYY/mm=MM/dd=DD/audit-log-<runId>.jsonl.gz \
  --output /tmp/restore.jsonl.gz
gunzip -k /tmp/restore.jsonl.gz
shasum -a 256 /tmp/restore.jsonl  # manifest.sha256 と一致確認
```

## evidence 期待値

- workflow run log: PASS
- D1 `audit_log_export_manifest` に当日 row が `completed` 状態
- R2 object 存在確認 (`r2 object list`)
- restore drill sha256 一致
- redaction grep: raw email/phone 0 件

> staging への実行は user gate 後の手動実施。本 PR 範囲では実装 + redaction 検証 + local test 通過まで。
