# Application audit_log retention runbook (Issue #315 Refs)

## 概要 / 不変条件

- application `audit_log` テーブル（`apps/api/src/repository/auditLog.ts`）は append-only。
- D1 内 retention: **直近 90 日**。`purgeExportedOlderThan` は manifest が `completed` の日付範囲のみ DELETE 対象とする（未 export / failed 行は purge しない安全装置）。
- R2 retention: **Object Lock COMPLIANCE mode 7 年**。retention 期間内の削除・上書きは API レベルで不可。
- export 経路に raw email / 電話番号 / 住所 / actor_email を出さない（CI redaction grep gate）。
- RTO: best-effort（cold storage 用途、ホットパス影響なし）。RPO: 1 日（日次 export）。

## 日次 export パイプライン

| コンポーネント | 配置 |
|----------------|------|
| GitHub Actions cron | `.github/workflows/audit-log-cold-storage.yml` (`0 3 * * *` UTC = JST 12:00) |
| 同時実行回避 | `cf-audit-log-cold-storage.yml` (`0 2 * * *`) と時間帯分離 |
| D1 read / manifest write | `apps/api/src/repository/auditLog.ts` (`listForExport` / `insert/complete/failExportManifest`) |
| redaction | `apps/api/src/lib/audit/redact.ts` |
| R2 PUT | `UBM_AUDIT_APP_COLD_STORAGE` binding（`apps/api/wrangler.toml`） |
| object key | `application/yyyy=YYYY/mm=MM/dd=DD/audit-log-<exportRunId>.jsonl.gz` |
| 2-phase commit | D1 `audit_log_export_manifest` (`pending → completed` / `failed`) |

## D1 retention 運用

```sql
-- 90 日前 UTC threshold
SELECT datetime('now', '-90 days');
```

実装: `auditLog.purgeExportedOlderThan(thresholdUtc)`。manifest が `completed` の `yyyy-mm-dd` 範囲のみ DELETE。

## R2 Object Lock 設定（手動セットアップ）

```bash
# Phase 11 user gate 後に手動実行
bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-prod --object-lock-enabled
bash scripts/cf.sh r2 bucket create ubm-audit-cold-storage-app-staging --object-lock-enabled
# retention 7 年 COMPLIANCE mode はバケット作成後に設定（Cloudflare dashboard / API）
```

注意: COMPLIANCE mode は account owner であっても retention 期間内に解除不可。

## semi-annual restore drill

```bash
# 任意 1 日分を R2 から GET し、gunzip + sha256 verify
bash scripts/cf.sh r2 object get \
  --bucket ubm-audit-cold-storage-app-prod \
  --key application/yyyy=2026/mm=01/dd=15/audit-log-<runId>.jsonl.gz \
  --output /tmp/restore-sample.jsonl.gz
gunzip -k /tmp/restore-sample.jsonl.gz
shasum -a 256 /tmp/restore-sample.jsonl  # D1 manifest.sha256 と一致確認
```

## failure escalation

- 24h 連続失敗 → `gh issue create` で severity P2 ticket を自動発火
- redaction grep gate 失敗 → CI blocking、severity P1 として手動エスカレーション

## 7 年経過後の手動削除手順

1. Object Lock retention 期限満了を Cloudflare dashboard で確認
2. `bash scripts/cf.sh r2 object delete` で対象 key を削除
3. D1 `audit_log_export_manifest` から該当行を archive table へ移動（任意）

## スコープアウト

- 外部 SIEM 連携（Datadog / Splunk / Elastic / Logpush）: 有料 SaaS 課金は solo dev 無料運用ポリシー外。R2 + Object Lock で長期保管・改ざん検知要件を満たす。
- hash chain による改ざん検知: Object Lock COMPLIANCE で immutability 担保済のため redundancy 過大。

## 関連参照

- `docs/30-workflows/issue-315-audit-log-application-cold-storage/`
- `docs/30-workflows/completed-tasks/issue-514-cf-audit-logs-cold-storage-r2-export/`
- `apps/api/migrations/0018_add_audit_log_export_manifest.sql`
