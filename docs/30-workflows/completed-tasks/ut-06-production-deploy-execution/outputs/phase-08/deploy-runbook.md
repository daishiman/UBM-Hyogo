# Phase 8: 統合デプロイ runbook

> 本書は Phase 5 / Phase 11 で実行する全コマンドを一元化した runbook。各 Phase outputs は本書を参照する。

## 0. 前提

- 環境: mise (Node 24.15.0 / pnpm 10.33.2) + package/lockfile の wrangler version と一致
- アカウント: UBM 兵庫 Cloudflare アカウント (`wrangler whoami` で確認)
- ブランチ: `main` にマージ済の対象 commit から実行
- 全コマンド `mise exec --` 経由

## 1. 事前確認 (Phase 4)

```bash
bash scripts/cf.sh --version
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/api build
mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare
```

## 2. 本番デプロイ (Phase 5)

### Step 1: D1 バックアップ取得 (AC-7)

```bash
TS=$(date +%Y%m%d-%H%M%S)
bash scripts/cf.sh d1 export ubm-hyogo-db-prod \
  --env production \
  --output "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
shasum -a 256 "docs/30-workflows/ut-06-production-deploy-execution/outputs/phase-05/backup-${TS}.sql"
```

### Step 2: D1 マイグレーション適用 (AC-3)

```bash
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 3: apps/api Workers デプロイ (AC-2)

```bash
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
```

### Step 4: apps/web デプロイ (AC-1)

```bash
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production
```

### Step 5: 直後 smoke (AC-1 / AC-2 / AC-4 速報)

```bash
curl -sI https://<web-prod-url>
curl -sS https://<api-prod-host>/health
curl -sS https://<api-prod-host>/health/db
bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty
```

## 3. 本格 smoke test (Phase 11)

| ID | 観点 | コマンド | AC |
| --- | --- | --- | --- |
| S-01 | Web Top 200 | `curl -sI https://<web-url>` | AC-1 |
| S-02 | API /health 200 | `curl -sS https://<api-host>/health` | AC-2 |
| S-03 | API /health/db 200 | `curl -sS https://<api-host>/health/db` | AC-4 |
| S-04 | Web HTML 構造 | `curl -sS https://<web-url> \| head -n 50` | AC-1 |
| S-05 | API CORS preflight | `curl -sS -X OPTIONS -H "Origin: https://<web-url>" https://<api-host>/health` | AC-2 |
| S-06 | wrangler tail エラー監視 | `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production` | AC-2 |
| S-07 | D1 binding 経由 SELECT | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --command "SELECT 1"` | AC-4 |
| S-08 | Web→API XHR (実画面) | ブラウザ DevTools / Playwright | AC-1 / AC-2 |
| S-09 | favicon / static asset | `curl -sI https://<web-url>/favicon.ico` | AC-1 |
| S-10 | レスポンスヘッダ | `curl -sI -D - https://<api-host>/health` | AC-2 |

## 4. ロールバック (Phase 6)

詳細は `outputs/phase-02/rollback-runbook.md` を参照。要点:

```bash
# Workers (apps/api / apps/web) rollback
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/api/wrangler.toml --env production
bash scripts/cf.sh rollback <PREV_VERSION_ID> --config apps/web/wrangler.toml --env production

# D1 リストア
bash scripts/cf.sh d1 execute ubm-hyogo-db-prod \
  --env production --file outputs/phase-05/backup-<TS>.sql
```

## 5. 命名規則 (env-binding-matrix.md より)

| 項目 | production | staging |
| --- | --- | --- |
| Workers (api) | `ubm-hyogo-api` | `ubm-hyogo-api-staging` |
| Workers (web) | `ubm-hyogo-web` | `ubm-hyogo-web-staging` |
| D1 database | `ubm-hyogo-db-prod` | `ubm-hyogo-db-staging` |
| binding | `DB` | `DB` |

## 6. 依存資料

- `outputs/phase-02/deploy-design.md`
- `outputs/phase-02/rollback-runbook.md`
- `outputs/phase-02/env-binding-matrix.md`
- `outputs/phase-08/dry-config-policy.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md`
- `.claude/skills/aiworkflow-requirements/references/deployment-core.md`
