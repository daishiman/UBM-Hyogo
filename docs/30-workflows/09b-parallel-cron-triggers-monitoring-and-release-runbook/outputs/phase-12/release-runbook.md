# release-runbook（最終版）

UBM 兵庫支部会 メンバーサイトの go-live / rollback / cron 制御を 1 ファイルで再現可能にする runbook。
docs-only / spec_created タスクの成果物として確定し、09c の production deploy で参照する。
09b では Cloudflare / D1 / `apps/api/wrangler.toml` を変更しない。deploy / rollback / cron disable のコマンドは、09c または緊急運用で実行する手順として扱う。

> 不変条件: #5（apps/web → D1 直接禁止）/ #6（GAS prototype 昇格しない）/ #10（Cloudflare 無料枠）/ #15（attendance 整合性）

## 1. 目的

- staging（09a）→ production（09c）の go-live を一意に再現可能にする
- worker / pages / D1 migration / cron の 4 種 rollback 手順を即実行可能な command で固定
- cron 一時停止 / 再開を誰でも実行可能にする
- monitoring dashboard URL の正本を提示

## 2. 関連 dashboard URL（6 種、placeholder）

| # | env var | URL |
| --- | --- | --- |
| 1 | ANALYTICS_URL_API_STAGING | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/analytics` |
| 2 | ANALYTICS_URL_API_PRODUCTION | `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/analytics` |
| 3 | ANALYTICS_URL_D1_STAGING | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-staging/metrics` |
| 4 | ANALYTICS_URL_D1_PRODUCTION | `https://dash.cloudflare.com/<account>/d1/databases/ubm-hyogo-db-prod/metrics` |
| 5 | ANALYTICS_URL_PAGES_STAGING | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web-staging` |
| 6 | ANALYTICS_URL_PAGES_PRODUCTION | `https://dash.cloudflare.com/<account>/pages/view/ubm-hyogo-web` |

補助:
- TRIGGER_URL_API_STAGING: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api-staging/staging/triggers`
- TRIGGER_URL_API_PRODUCTION: `https://dash.cloudflare.com/<account>/workers/services/view/ubm-hyogo-api/production/triggers`

Sentry / Logpush は 09b 時点では placeholder のみ:
- SENTRY_DSN: 未登録（unassigned-task-detection.md § Sentry 接続）
- LOGPUSH_SINK: 未設定（unassigned-task-detection.md § Logpush sink）

## 2.1 DB / binding / command target 対応表

| 環境 | Worker | DB binding | D1 `database_name` | wrangler command target |
| --- | --- | --- | --- | --- |
| staging | `ubm-hyogo-api-staging` | `DB` | `ubm-hyogo-db-staging` | `ubm-hyogo-db-staging --env staging` |
| production | `ubm-hyogo-api` | `DB` | `ubm-hyogo-db-prod` | `ubm-hyogo-db-prod --env production` |

## 2.2 09a handoff intake checklist

- [ ] 09a `outputs/phase-11/manual-smoke-log.md` の staging deploy / Forms sync smoke が PASS
- [ ] 09a で確認した staging Worker URL / Pages URL / 最新 `sync_jobs.id` を 09c の Phase 1 に転記
- [ ] Triggers 確認は Cloudflare Dashboard の Triggers タブを正とする。CLI は `wrangler deployments list` で deploy 世代を補助確認する
- [ ] legacy `0 * * * *` cron の残存は UT21-U05 に委譲済みで、09c Go/No-Go では「残存許容」を明示判断する

## 3. go-live フロー（staging → production）

> AC-3 対応セクション。AC matrix `phase-07/ac-matrix.md` § AC-3 を参照。

### 3.1 前提条件 check

- [ ] `feature/*` ブランチでの実装 + テスト完了
- [ ] `dev` ブランチへ PR merge → staging deploy（09a）成功
- [ ] 09a smoke 完了、`outputs/phase-11/manual-smoke-log.md` 全項目 ✓
- [ ] 上流 wave AC（08a / 08b）すべて達成
- [ ] release window 確認（高トラフィック時間帯回避、JST 03:00〜06:00 推奨）

### 3.2 dev → main マージ

```bash
# 起点ブランチ（dev）の最新を確認
git checkout dev && git pull origin dev

# main へ PR 作成（GitHub CLI）
gh pr create --base main --head dev \
  --title "release: <YYYY-MM-DD>" \
  --body "release runbook: docs/30-workflows/09b-.../outputs/phase-12/release-runbook.md"

# CI 完了後に merge
# （solo dev のため required reviewers = 0、CI gate のみ）
```

### 3.3 GitHub Actions `deploy-production` 起動確認

```bash
gh run list --workflow=deploy-production --limit 1
# expected: status=completed conclusion=success
```

### 3.4 D1 production migration 適用

```bash
# 1. 現在の migration 状況確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production

# 2. backup（任意、PII 注意）
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production \
  --output backup-$(date +%Y%m%d-%H%M%S).sql

# 3. apply（後方互換のみ）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
```

#### sanity check
- `wrangler d1 migrations list` で全 migration が `Applied`
- 直接 SQL（`DROP` / `ALTER ... DROP`）は使わない（spec/15-infrastructure-runbook.md 準拠）

### 3.5 wrangler deploy production

```bash
# apps/api
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production

# apps/web
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

#### sanity check
```bash
curl -sI https://ubm-hyogo-api.<account>.workers.dev/public/stats | head -1
# expected: HTTP/2 200
curl -sI https://ubm-hyogo-web.pages.dev/ | head -1
# expected: HTTP/2 200
```

### 3.6 cron triggers 確認

```bash
wrangler deployments list --config apps/api/wrangler.toml --env production | head -5
```

Cloudflare Dashboard の Triggers タブ（TRIGGER_URL_API_PRODUCTION）で以下 3 件が表示されることを目視確認:

- `0 * * * *`（legacy Sheets sync）
- `*/15 * * * *`（response sync）
- `0 18 * * *`（schema sync, 03:00 JST）

### 3.7 09c の post-release verification 起動

09c-serial-production-deploy-and-post-release-verification の Phase 5 以降を起動し、本 runbook の sync_jobs / attendance 整合性 SQL を実行する。

## 4. rollback 手順（worker / pages / D1 migration / cron の 4 種）

> AC-3, AC-7（不変条件 #5）対応。詳細は `outputs/phase-06/rollback-procedures.md` を本セクションで要約。

### 4.1 Worker rollback（apps/api）

```bash
wrangler deployments list --config apps/api/wrangler.toml --env production | head -10
bash scripts/cf.sh rollback <deploy_id> --config apps/api/wrangler.toml --env production
curl -sI https://ubm-hyogo-api.<account>.workers.dev/public/stats | head -1
# expected: HTTP/2 200
```

### 4.2 Pages rollback（apps/web）

```text
1. https://dash.cloudflare.com/<account>/pages
2. ubm-hyogo-web (production) を選択
3. Deployments タブ → 直前 successful → "..." → Rollback to this deployment
```

```bash
curl -sI https://ubm-hyogo-web.pages.dev/ | head -1
# expected: HTTP/2 200
```

> 不変条件 #5: 本セクションには apps/web 経由の D1 直接操作は **記載しない**。Pages rollback は Dashboard 操作のみ。

### 4.3 D1 migration rollback（緊急、後方互換 fix migration）

```bash
# 直接 SQL DROP/ALTER は禁止（spec/15-infrastructure-runbook.md 準拠）
wrangler d1 migrations create ubm-hyogo-db-prod fix_<issue> --config apps/api/wrangler.toml
# fix migration を編集（IF NOT EXISTS / DEFAULT NULL 等）
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
# expected: fix migration が Applied
```

### 4.4 Cron rollback / 一時停止

```toml
# apps/api/wrangler.toml の [env.production.triggers] を変更
[env.production.triggers]
crons = []
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

再開時は `crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]` に戻して deploy。

### 4.5 attendance 整合性確認（不変条件 #15、各 rollback 後必須）

```bash
# 重複チェック
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT meeting_id, member_id, COUNT(*) c FROM member_attendance WHERE deleted_at IS NULL GROUP BY meeting_id, member_id HAVING c > 1;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows

# 削除済みメンバーの残存
wrangler d1 execute ubm-hyogo-db-prod \
  --command "SELECT a.id FROM member_attendance a JOIN members m ON m.id = a.member_id WHERE m.deleted_at IS NOT NULL AND a.deleted_at IS NULL;" \
  --config apps/api/wrangler.toml --env production
# expected: 0 rows
```

## 5. cron 一時停止 / 再開

詳細は `outputs/phase-05/cron-deployment-runbook.md` Step 4 / Step 5。

### 一時停止（incident 時）

優先順 A（再 deploy）> B（Dashboard 手動）。

#### A. wrangler.toml `crons = []` 再 deploy

```toml
[env.production.triggers]
crons = []
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

#### B. Cloudflare Dashboard で disable

```text
TRIGGER_URL_API_PRODUCTION → 各 cron → Disable
```

### 再開

```toml
[env.production.triggers]
crons = ["0 * * * *", "0 18 * * *", "*/15 * * * *"]
```

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
```

#### sanity check
- 次の `*/15` 周期で `sync_jobs` に新規 `running` row が出現
- 30 分以内に少なくとも 1 件 `success` 行

## 6. 手動 sync 実行（admin endpoint 経由）

cron を待たずに sync を起動するときは 04c の admin endpoint を叩く（GAS apps script trigger は使わない）。

```bash
curl -X POST https://ubm-hyogo-api.<account>.workers.dev/admin/sync/schema \
  -H "Authorization: Bearer <admin_token>"

curl -X POST https://ubm-hyogo-api.<account>.workers.dev/admin/sync/responses \
  -H "Authorization: Bearer <admin_token>"
```

#### sanity check
- HTTP 200 / 202
- `sync_jobs` に新規 row、`running` → `success`

## 7. リリース後検証チェックリスト（10 ページ smoke）

| # | URL | 期待 |
| --- | --- | --- |
| 1 | `https://ubm-hyogo-web.pages.dev/` | 200 |
| 2 | `https://ubm-hyogo-web.pages.dev/about` | 200 |
| 3 | `https://ubm-hyogo-web.pages.dev/members` | 200 |
| 4 | `https://ubm-hyogo-web.pages.dev/meetings` | 200 |
| 5 | `https://ubm-hyogo-web.pages.dev/login` | 200 |
| 6 | `https://ubm-hyogo-web.pages.dev/me` | 認証後 200 |
| 7 | `https://ubm-hyogo-web.pages.dev/admin` | admin 認証後 200 |
| 8 | `https://ubm-hyogo-api.<account>.workers.dev/public/stats` | 200 |
| 9 | `https://ubm-hyogo-api.<account>.workers.dev/health` | 200 |
| 10 | TRIGGER_URL_API_PRODUCTION | cron 3 件表示 |

## 8. 連絡先 placeholder

| 重大度 | Slack | Email |
| --- | --- | --- |
| P0 | `<#ubm-hyogo-prod-incident>` | `<admin@ubm-hyogo.example>` |
| P1 | `<#ubm-hyogo-prod-incident>` | - |
| P2 | `<#ubm-hyogo-dev>` | - |

> 実値は Cloudflare Secrets / 1Password に置く。本ファイルには平文を書かない（CLAUDE.md secret 管理ポリシー、不変条件外の運用ルール）。

## 9. 改訂履歴

| 日付 | 変更 |
| --- | --- |
| 2026-04-26 | 初版（09b Phase 12 で作成） |

## 10. 関連 runbook

- `outputs/phase-12/incident-response-runbook.md`
- `outputs/phase-06/failure-cases.md`
- `outputs/phase-06/rollback-procedures.md`
- `outputs/phase-05/cron-deployment-runbook.md`
- `outputs/phase-07/ac-matrix.md`
