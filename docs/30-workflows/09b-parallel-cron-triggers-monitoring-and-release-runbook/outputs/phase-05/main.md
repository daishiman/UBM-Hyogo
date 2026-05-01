# Phase 5 出力: 実装ランブックサマリ

## 1. 目的

cron deployment / 一時停止 / 再開、release 全体フロー、incident response の各 runbook を、コピペ可能 command + 擬似コード + sanity check 付きで固定する。docs-only / spec_created のため wrangler.toml は placeholder 表記。最終版 release-runbook / incident-response-runbook は Phase 12 で完成。

## 2. 3 runbook と配置先

| runbook | 本 Phase での擬似 | 最終版 |
| --- | --- | --- |
| cron-deployment-runbook | `outputs/phase-05/cron-deployment-runbook.md`（本 Phase で完成） | `outputs/phase-12/release-runbook.md` の cron 制御章で再利用 |
| release-runbook | 本 main.md の擬似 | `outputs/phase-12/release-runbook.md` |
| incident-response-runbook | 本 main.md の擬似 | `outputs/phase-12/incident-response-runbook.md` |

## 3. release-runbook 擬似（Phase 12 で完成版）

### 3.1 go-live 全体フロー

1. ブランチ戦略確認: `dev` → `main` PR が merge 済みであること
2. GitHub Actions `deploy-production` が起動し成功（Workers / Pages 双方）
3. D1 production migration 適用（後方互換）
   ```bash
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
   bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
   ```
4. wrangler deploy production（apps/api / apps/web 両方）
   ```bash
   bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
   bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
   ```
5. cron triggers 確認
   ```bash
   wrangler deployments list --config apps/api/wrangler.toml --env production | head -5
   # Cloudflare Dashboard:
   # https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/triggers
   # expected: cron 3 件 (`0 * * * *`, `0 18 * * *`, `*/15 * * * *`) 表示
   ```
6. 09c の post-release verification 起動

### 3.2 rollback フロー（worker / pages）

```bash
# 直前 deploy id 取得
wrangler deployments list --config apps/api/wrangler.toml --env production | head -5

# Worker rollback
wrangler rollback <deploy_id> --config apps/api/wrangler.toml --env production

# 確認
curl -sI https://ubm-hyogo-api.<account>.workers.dev/public/stats | head -1
# expected: HTTP/2 200

# Pages rollback は Cloudflare Dashboard
# Pages → ubm-hyogo-web → Deployments → 直前の successful → "Rollback to this deployment"
```

- 注意: D1 migration の rollback は後方互換 fix migration で行い、直接 SQL は使わない（spec/15-infrastructure-runbook.md 準拠）
- 注意: 不変条件 #5 — apps/web 配下から D1 を直接叩く rollback コマンドは記載しない

### 3.3 cron 制御フロー

- 一時停止: cron-deployment-runbook Step 4
- 再開: cron-deployment-runbook Step 5
- 手動実行: `POST /admin/sync/schema`, `POST /admin/sync/responses`（04c 仕様）

### 3.4 dashboard URL

- Workers staging: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics`
- Workers production: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics`
- D1 staging: `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-staging/metrics`
- D1 production: `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-prod/metrics`
- Pages staging: `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web-staging`
- Pages production: `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web`

## 4. incident-response-runbook 擬似（Phase 12 で完成版）

### 4.1 initial response（5 分以内）

1. dashboard で error 多発 / sync_jobs.failed 急増を観測
2. 重大度判定（P0 / P1 / P2）
3. P0/P1 の場合: cron 一時停止（cron-deployment-runbook Step 4）
4. 直前 deploy への rollback 実施

### 4.2 escalation matrix

| 重大度 | 内容 | 対応者 | 通知先 placeholder |
| --- | --- | --- | --- |
| P0 | production 全停止 / データ消失 | release-staging + release-runbook 担当 | Slack: `<#ubm-hyogo-prod-incident>`, Email: `<admin@ubm-hyogo.example>` |
| P1 | sync 完全停止 / authn 不可 | release-runbook 担当 | Slack: `<#ubm-hyogo-prod-incident>` |
| P2 | sync 遅延 / 部分機能停止 | dev 担当 | Slack: `<#ubm-hyogo-dev>` |

### 4.3 postmortem template

```markdown
# Postmortem: <incident title>
- date: YYYY-MM-DD
- severity: P0 / P1 / P2
- duration: HH:MM
- detection: <how detected>
- root cause: <root cause>
- mitigation: <what was done>
- timeline:
  - HH:MM 検知
  - HH:MM 重大度判定
  - HH:MM cron 停止
  - HH:MM rollback
  - HH:MM 復旧確認
- action items:
  - [ ] <preventive measure>
```

## 5. 各ステップ後の sanity check（共通）

- secret を log に出力していないか（`.env` は `op` 参照のみ、Cloudflare Secrets は `wrangler secret put` 経由）
- production と staging を取り違えていないか（`--env` フラグ確認）
- artifacts.json に途中状態を反映したか
- 09a の runbook と用語が揃っているか（`rollback` / `cron` / `<placeholder>` 表記統一）

## 6. 完了条件チェック

- [x] cron deployment runbook 完成（cron-deployment-runbook.md）
- [x] release 全体 runbook 擬似完成
- [x] incident response 擬似完成
- [x] 各 sanity check 記述済み
- [x] 09a / 09c との用語統一（DRY 化詳細は Phase 8）

## 7. 次 Phase への引き継ぎ

- 3 runbook 擬似コードを Phase 6 異常系に流用（failure case の mitigation 列）
- Phase 12 で release-runbook / incident-response-runbook の最終版を生成
