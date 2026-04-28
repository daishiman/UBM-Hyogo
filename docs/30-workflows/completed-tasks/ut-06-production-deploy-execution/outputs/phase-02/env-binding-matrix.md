# Phase 2: 環境×binding マトリクス

## 1. 全体マトリクス

| 項目 | local | staging | production |
| --- | --- | --- | --- |
| apps/api Workers name | (wrangler dev) | `ubm-hyogo-api-staging` | `ubm-hyogo-api` |
| apps/web Workers/Pages name | (wrangler dev / next dev) | `ubm-hyogo-web-staging` | `ubm-hyogo-web` |
| wrangler env | (なし / `--local`) | `staging` | `production` |
| D1 binding | `DB` | `DB` | `DB` |
| D1 database_name | (local emulation) | `ubm-hyogo-db-staging` | `ubm-hyogo-db-prod` |
| D1 database_id | n/a | wrangler.toml に直書き (Phase 8 DRY 化検討) | wrangler.toml に直書き (同上) |
| KV binding | 未使用 | 未使用 | 未使用 |
| R2 binding | 未使用 | 未使用 | 未使用 |
| Queue binding | 未使用 | 未使用 | 未使用 |
| Service binding | 未使用 | 未使用 | 未使用 |
| `[vars] ENVIRONMENT` | development | staging | production |
| `[vars] SHEET_ID` | (1Password) | wrangler.toml | wrangler.toml |
| `[vars] FORM_ID` | (1Password) | wrangler.toml | wrangler.toml |
| Secrets (ランタイム) | 1Password Environments | Cloudflare Secrets | Cloudflare Secrets |
| Secrets (CI/CD) | n/a | GitHub Secrets | GitHub Secrets |
| 非機密設定値 | `.mise.toml` | GitHub Variables | GitHub Variables |
| compatibility_date | `2025-01-01` | `2025-01-01` | `2025-01-01` |
| compatibility_flags | `nodejs_compat` | `nodejs_compat` | `nodejs_compat` |
| Web 配信形式 | next dev | Pages (`.next`) ※ | Pages (`.next`) ※ |

※ OpenNext Workers (`.open-next/`) への移行は別タスク扱い。Phase 3 設計レビューで GO/NO-GO の判断材料として明示。

## 2. apps/api wrangler.toml 構造 (現状)

```
[トップレベル] = production 扱い
  ├── name = ubm-hyogo-api
  ├── [vars] ENVIRONMENT=production / SHEET_ID / FORM_ID
  └── [[d1_databases]] binding=DB / database_name=ubm-hyogo-db-prod

[env.staging]
  ├── name = ubm-hyogo-api-staging
  ├── [env.staging.vars]
  └── [[env.staging.d1_databases]] binding=DB / database_name=ubm-hyogo-db-staging
```

→ 明示的な `[env.production]` セクションは存在しない。`wrangler deploy --env production` はトップレベル設定を適用する。

## 3. apps/web wrangler.toml 構造 (現状)

```
[トップレベル] = production 扱い
  ├── name = ubm-hyogo-web
  ├── pages_build_output_dir = .next   ← Pages 形式
  └── [vars] ENVIRONMENT=production

[env.staging]
  ├── name = ubm-hyogo-web-staging
  └── [env.staging.vars]
```

## 4. binding 検証コマンド (Phase 4 verify suite で利用)

```bash
bash scripts/cf.sh whoami
bash scripts/cf.sh d1 list
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deployments list --config apps/web/wrangler.toml --env production
```

## 5. 不変条件との整合 (CLAUDE.md より)

| 不変条件 | 反映 |
| --- | --- |
| 5. D1 への直接アクセスは `apps/api` に閉じる | apps/web には D1 binding を設定しない (本マトリクス §1) |
| シークレット管理: ランタイムは Cloudflare Secrets | 本マトリクス §1 |
| 平文 `.env` のコミット禁止 | Phase 9 secret hygiene で再確認 |

## 6. Phase 8 DRY 化対象候補

1. apps/api: `[vars]` の `SHEET_ID` / `FORM_ID` が production / staging で重複定義
2. apps/api: `database_id` が wrangler.toml に直書き
3. `[env.production]` セクション明示化 (現状トップレベル設定が暗黙的に production)

→ 詳細方針は `outputs/phase-08/dry-config-policy.md` で確定。
