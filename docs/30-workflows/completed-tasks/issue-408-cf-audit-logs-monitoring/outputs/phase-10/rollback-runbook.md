# Rollback Runbook（issue-408 cf-audit-log-monitor）

## 適用条件

- merge 後、運用中に以下のいずれかが発生
  - alerting の誤検知が運用許容を超え一時停止が必要
  - 監視 Token の漏洩疑い
  - D1 / GitHub Actions のコスト想定外超過
  - 監視ロジック自体の致命的バグ

## ロールバック前の確認

```bash
# 現状把握
gh workflow list | grep cf-audit-log
gh run list --workflow=cf-audit-log-monitor.yml --limit 5
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT COUNT(*) FROM cf_audit_log"
```

## ステップ 1: 主 workflow を無効化

```bash
gh workflow disable cf-audit-log-monitor.yml
gh workflow list | grep cf-audit-log-monitor   # state=disabled_manually を確認
```

**期待**: schedule が停止、新規 ingest が止まる。既存 D1 行はそのまま残る。

## ステップ 2: Watchdog workflow を無効化

```bash
gh workflow disable cf-audit-log-monitor-watchdog.yml
```

**期待**: 主 workflow を止めた後の watchdog による誤 alert 起票を防ぐ。

## ステップ 3: 監視 Token を revoke

- Cloudflare Dashboard > My Profile > API Tokens から `CF_AUDIT_TOKEN_PROD` 用 Token を Revoke
- GitHub Secret 側は **そのまま残しても無害**（Token 自体が無効化されるため）。完全 cleanup する場合は:

```bash
gh secret delete CF_AUDIT_TOKEN_PROD --repo daishiman/UBM-Hyogo
```

**重要**: `CLOUDFLARE_API_TOKEN`（deploy Token）には絶対に触らない。両 Token は scope 分離されており本 rollback とは独立。

## ステップ 4 (オプション): D1 テーブル DROP

データを完全に消去する場合のみ実施。クエリ用途でログを残したい場合はステップ 4 をスキップして workflow 無効化のみで終わらせる。

```bash
# 事前バックアップ（推奨）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output cf-audit-log-backup-$(date +%Y%m%d).sql

# DROP 実行
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "DROP TABLE IF EXISTS cf_audit_log; DROP TABLE IF EXISTS cf_audit_baseline;"
```

**期待**: 2 テーブルが削除され、後続 PR の migration 再適用で再構築可能。

## ステップ 5: PR を revert

```bash
# PR 番号を確認
gh pr list --state merged --search "issue-408 in:title" --json number,mergeCommit

# PR revert（推奨）
gh pr revert <PR_NUMBER>

# または直接 git revert
git revert -m 1 <MERGE_COMMIT_SHA>
git push origin main
```

**期待**: workflow / migration / scripts が repository から削除され、次回 deploy で完全に巻き戻る。

## staging dry-run

- staging mirror が存在する場合、本番 rollback 前に staging で同手順を 1 回流し、各ステップの exit code と D1 状態を観測する
- staging mirror が **存在しない場合** は production-direct rollback となる。リスク受容として以下を記録:
  - workflow disable / Token revoke は副作用が `cf-audit-log` 系のみで他経路に影響しないこと
  - DROP TABLE は事前 export を必須化することでデータ損失リスクを軽減
  - revert 時の D1 schema 不整合は migration 再適用で復旧可能

## 検証

```bash
# 1) workflow 停止確認
gh workflow list | grep cf-audit-log
# 2) Token 失効確認（401 を期待）
curl -H "Authorization: Bearer <REVOKED_TOKEN>" \
  https://api.cloudflare.com/client/v4/accounts/<ACCT>/audit_logs
# 3) revert merge 後の状態確認
git log --oneline -5
```

## 関連

- `outputs/phase-10/review-checklist.md`
- SSOT: `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- SSOT: `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`
