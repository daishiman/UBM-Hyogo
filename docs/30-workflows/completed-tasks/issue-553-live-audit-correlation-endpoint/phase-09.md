# Phase 9: デプロイ準備 / wrangler env / 1Password 参照 / Cloudflare Secrets 投入

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| Source | `outputs/phase-9/phase-9.md` |
| 区分 | 設定 / 文書化 / Cloudflare 反映準備 |
| 想定所要 | 0.5 人日 |

## 目的

本 Issue は live wiring を伴うため、Phase 5-7 で実装したコードを staging で稼働させるための env / Secrets / D1 binding / cron triggers を `apps/api/wrangler.toml` と Cloudflare Secrets / D1 に反映する手順を確定する。**実 Secrets 投入と production D1 migration apply は Phase 13 G2 / G3 ゲート後に限定**し、本 Phase では「ファイル編集」「staging Secrets 投入手順の明文化」「.dev.vars.example 更新」「D1 migration apply 手順の明文化」までを完結させる。

## 実行タスク

1. **`apps/api/wrangler.toml` の env / triggers / D1 binding 追加**

   反映する設定（仕様）:

   ```toml
   # ルート（共通 / 主に開発用）
   name = "ubm-hyogo-api"
   compatibility_date = "2026-04-01"
   main = "src/index.ts"

   [[d1_databases]]
   binding = "DB"
   database_name = "ubm-hyogo-db-dev"
   database_id = "<dev d1 id>"
   migrations_dir = "migrations"

   [vars]
   AUDIT_CORRELATION_FINGERPRINT_VERSION = "1"
   AUDIT_CORRELATION_RUNBOOK_BASE_URL = "https://github.com/daishiman/UBM-Hyogo/blob/main/docs/runbooks/audit-correlation.md"
   AUDIT_CORRELATION_SLACK_DRY_RUN = "true"

   [env.staging]

   [env.staging.vars]
   AUDIT_CORRELATION_FINGERPRINT_VERSION = "1"
   AUDIT_CORRELATION_RUNBOOK_BASE_URL = "https://github.com/daishiman/UBM-Hyogo/blob/main/docs/runbooks/audit-correlation.md"
   AUDIT_CORRELATION_SLACK_DRY_RUN = "true"   # staging は常時 dry-run channel

   [env.staging.triggers]
   crons = ["*/15 * * * *"]

   [[env.staging.d1_databases]]
   binding = "DB"
   database_name = "ubm-hyogo-db-staging"
   database_id = "<staging d1 id>"
   migrations_dir = "migrations"

   [env.production]

   [env.production.vars]
   AUDIT_CORRELATION_FINGERPRINT_VERSION = "1"
   AUDIT_CORRELATION_RUNBOOK_BASE_URL = "https://github.com/daishiman/UBM-Hyogo/blob/main/docs/runbooks/audit-correlation.md"
   AUDIT_CORRELATION_SLACK_DRY_RUN = "false"  # production は本番 channel

   [env.production.triggers]
   crons = ["*/15 * * * *"]

   [[env.production.d1_databases]]
   binding = "DB"
   database_name = "ubm-hyogo-db-prod"
   database_id = "<prod d1 id>"
   migrations_dir = "migrations"
   ```

   - **secret 系は `wrangler.toml` には書かない**（Cloudflare Secrets binding として `env.GITHUB_AUDIT_PAT` / `env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `env.AUDIT_CORRELATION_INTERNAL_TOKEN` / `env.AUDIT_CORRELATION_SALT` でランタイム参照可能）。
   - 既存の `[vars]` / `[env.*.vars]` / `[[d1_databases]]` セクションが既にある場合は、上記の `AUDIT_CORRELATION_*` キーと `[triggers]` / `[env.*.triggers]` のみを追加する形でマージする。
   - `[env.staging]` / `[env.production]` の triggers は **同一 cron 式（`*/15 * * * *`）** を使用し、Slack 出力先のみ `AUDIT_CORRELATION_SLACK_DRY_RUN` で切り替える。

2. **`.dev.vars.example` への 1Password 参照追記**

   ```
   # apps/api/.dev.vars.example
   GITHUB_AUDIT_PAT="op://CloudflareSecurity/GitHubAuditPAT/credential"
   SLACK_AUDIT_INCIDENT_WEBHOOK_URL="op://CloudflareSecurity/SlackAuditIncidentWebhook/url"
   AUDIT_CORRELATION_INTERNAL_TOKEN="op://CloudflareSecurity/AuditCorrelationInternalToken/value"
   AUDIT_CORRELATION_SALT="op://CloudflareSecurity/AuditCorrelationSalt/value"
   ```

   - **実値は絶対に書かない**。`op://Vault/Item/Field` 参照のみ。
   - ローカル `wrangler dev` 実行は `bash scripts/cf.sh` を必ず経由（内部で `op run --env-file=.env -- wrangler ...` ラップ）。

3. **1Password vault 設計（実値は CLI 越しに別オペで登録済み前提。本仕様書には値を書かない）**

   | 1Password 参照 | Cloudflare Secret 名 | 用途 |
   | --- | --- | --- |
   | `op://CloudflareSecurity/GitHubAuditPAT/credential` | `GITHUB_AUDIT_PAT` | `/orgs/{org}/audit-log` への live fetch |
   | `op://CloudflareSecurity/SlackAuditIncidentWebhook/url` | `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` | HIGH alert 通知先 webhook |
   | `op://CloudflareSecurity/AuditCorrelationInternalToken/value` | `AUDIT_CORRELATION_INTERNAL_TOKEN` | `POST /internal/audit-correlation/run` の internal token authz |
   | `op://CloudflareSecurity/AuditCorrelationSalt/value` | `AUDIT_CORRELATION_SALT` | fingerprint hash の salt（v1） |

   存在確認（**値は表示しない**）:

   ```bash
   op item get GitHubAuditPAT --vault CloudflareSecurity --format json | jq '.id'
   op item get SlackAuditIncidentWebhook --vault CloudflareSecurity --format json | jq '.id'
   op item get AuditCorrelationInternalToken --vault CloudflareSecurity --format json | jq '.id'
   op item get AuditCorrelationSalt --vault CloudflareSecurity --format json | jq '.id'
   ```

4. **Cloudflare Secrets 投入手順（staging のみ Phase 9 で投入可能。production は Phase 13 G3 ゲート後）**

   stdin 経由で値を渡し、コマンドラインや shell history に値を残さない方式を必ず使う:

   ```bash
   # staging への 4 シークレット投入。値は op run で stdin に流す。
   op read "op://CloudflareSecurity/GitHubAuditPAT/credential" \
     | bash scripts/cf.sh secret put GITHUB_AUDIT_PAT \
         --config apps/api/wrangler.toml --env staging

   op read "op://CloudflareSecurity/SlackAuditIncidentWebhook/url" \
     | bash scripts/cf.sh secret put SLACK_AUDIT_INCIDENT_WEBHOOK_URL \
         --config apps/api/wrangler.toml --env staging

   op read "op://CloudflareSecurity/AuditCorrelationInternalToken/value" \
     | bash scripts/cf.sh secret put AUDIT_CORRELATION_INTERNAL_TOKEN \
         --config apps/api/wrangler.toml --env staging

   op read "op://CloudflareSecurity/AuditCorrelationSalt/value" \
     | bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT \
         --config apps/api/wrangler.toml --env staging

   # 投入確認（key 名のみ。値は表示されない）
   bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging
   ```

   production 用コマンド（**Phase 13 G3 ゲート通過後に限り実行**。本 Phase では runbook に記すのみ）:

   ```bash
   op read "op://CloudflareSecurity/GitHubAuditPAT/credential" \
     | bash scripts/cf.sh secret put GITHUB_AUDIT_PAT \
         --config apps/api/wrangler.toml --env production
   # 同様に SLACK_AUDIT_INCIDENT_WEBHOOK_URL / AUDIT_CORRELATION_INTERNAL_TOKEN / AUDIT_CORRELATION_SALT
   bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env production
   ```

5. **D1 migration apply 手順（staging は Phase 9 で apply 可能。production は Phase 13 G2 ゲート後）**

   migration ファイル: `apps/api/migrations/NNNN_audit_correlation_findings.sql`（Phase 5 で実装済）。

   staging 適用:

   ```bash
   # 適用前の migration list 確認（drift がないこと）
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

   # 適用
   bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging

   # 適用後 schema 確認
   bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
     --command "SELECT name FROM sqlite_master WHERE type='table' AND name='audit_correlation_findings';"

   # 列一覧確認
   bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
     --command "PRAGMA table_info(audit_correlation_findings);"
   ```

   production 用コマンド（**Phase 13 G2 ゲート通過後に限り実行**）:

   ```bash
   bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
   bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
   ```

   apply 順序: **staging → 24h 観測（cron 96 回相当）→ production**。production 直前に staging で `audit_correlation_findings` 行が想定通り格納されていることを Phase 10 で確認する。

6. **runbook 反映**
   - `docs/runbooks/audit-correlation.md` に上記 4-5 のコマンド列を「live wiring デプロイ手順」節として追記する草案を `outputs/phase-9/phase-9.md` に貼る（実反映は Phase 12）。

## 変更対象ファイル / コマンド対象

| パス | 種別 | 役割 |
| --- | --- | --- |
| `apps/api/wrangler.toml` | 編集 | `[vars]` / `[env.staging.*]` / `[env.production.*]` / `[triggers]` 追加 |
| `apps/api/.dev.vars.example` | 編集 | 4 種類の op 参照を追記 |
| `docs/runbooks/audit-correlation.md` | 編集（Phase 12 で確定） | live wiring デプロイ手順節追記 |
| Cloudflare Secrets (staging) | 投入 | 4 シークレット |
| D1 `ubm-hyogo-db-staging` | migration apply | `audit_correlation_findings` table |

## 実行手順

```bash
# === Step 1: wrangler.toml / .dev.vars.example 編集 ===
# Edit tool で apps/api/wrangler.toml に [env.staging.*] / [env.production.*] / [triggers] 追加
# Edit tool で apps/api/.dev.vars.example に 4 種類の op 参照を追記

# === Step 2: 編集差分の安全性チェック（実値が混入していないこと） ===
git diff apps/api/wrangler.toml apps/api/.dev.vars.example \
  | grep -E 'ghp_|github_pat_|hooks\.slack\.com/services/|xox[bp]-' \
  && { echo "literal leaked into config files"; exit 1; } || echo "ok"

# === Step 3: 1Password item 存在確認（値は表示しない） ===
op item get GitHubAuditPAT --vault CloudflareSecurity --format json | jq '.id'
op item get SlackAuditIncidentWebhook --vault CloudflareSecurity --format json | jq '.id'
op item get AuditCorrelationInternalToken --vault CloudflareSecurity --format json | jq '.id'
op item get AuditCorrelationSalt --vault CloudflareSecurity --format json | jq '.id'

# === Step 4: staging Secrets 投入（stdin 経由で値を渡す） ===
op read "op://CloudflareSecurity/GitHubAuditPAT/credential" \
  | bash scripts/cf.sh secret put GITHUB_AUDIT_PAT \
      --config apps/api/wrangler.toml --env staging
op read "op://CloudflareSecurity/SlackAuditIncidentWebhook/url" \
  | bash scripts/cf.sh secret put SLACK_AUDIT_INCIDENT_WEBHOOK_URL \
      --config apps/api/wrangler.toml --env staging
op read "op://CloudflareSecurity/AuditCorrelationInternalToken/value" \
  | bash scripts/cf.sh secret put AUDIT_CORRELATION_INTERNAL_TOKEN \
      --config apps/api/wrangler.toml --env staging
op read "op://CloudflareSecurity/AuditCorrelationSalt/value" \
  | bash scripts/cf.sh secret put AUDIT_CORRELATION_SALT \
      --config apps/api/wrangler.toml --env staging

# === Step 5: staging Secrets 投入確認（key 名のみ） ===
bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env staging \
  | tee outputs/phase-9/staging-secret-list.log

# === Step 6: D1 migration apply（staging） ===
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-9/staging-d1-migrations-before.log
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging \
  | tee outputs/phase-9/staging-d1-migrations-apply.log

# === Step 7: schema 確認 ===
bash scripts/cf.sh d1 execute ubm-hyogo-db-staging --env staging \
  --command "PRAGMA table_info(audit_correlation_findings);" \
  | tee outputs/phase-9/staging-d1-schema.log
```

## 検証コマンド / 期待出力

| コマンド | 期待出力 |
| --- | --- |
| `git diff` への secret literal grep | 検出 0 件 |
| `op item get ... --format json \| jq '.id'` | 各 item の id が返る（4 件すべて） |
| `bash scripts/cf.sh secret list --env staging` | `GITHUB_AUDIT_PAT` / `SLACK_AUDIT_INCIDENT_WEBHOOK_URL` / `AUDIT_CORRELATION_INTERNAL_TOKEN` / `AUDIT_CORRELATION_SALT` の 4 行を含む（値は表示されない） |
| `d1 migrations apply` | `Applied N migration(s)` に新 migration が含まれる |
| `PRAGMA table_info(audit_correlation_findings);` | Phase 8 の保存可否表に列挙した列のみ存在（PII 列なし） |

## evidence 配置先

- `outputs/phase-9/phase-9.md`（手順実行サマリ）
- `outputs/phase-9/staging-secret-list.log`（key 名のみ。値は含まない）
- `outputs/phase-9/staging-d1-migrations-before.log`
- `outputs/phase-9/staging-d1-migrations-apply.log`
- `outputs/phase-9/staging-d1-schema.log`
- `outputs/phase-9/wrangler-toml-diff.patch`（`git diff apps/api/wrangler.toml` の出力）

## 安全性チェック（secret / 平文露出が無いこと）

```bash
# 編集後の wrangler.toml / .dev.vars.example に literal が混入していないこと
grep -REn 'ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|hooks\.slack\.com/services/[A-Z0-9/]+|xox[bp]-[A-Za-z0-9-]+' \
  apps/api/wrangler.toml apps/api/.dev.vars.example \
  && { echo "literal leaked"; exit 1; } || echo "ok"

# Phase 9 evidence log にも値が漏れていないこと
grep -REn 'ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|hooks\.slack\.com/services/[A-Z0-9/]+|xox[bp]-[A-Za-z0-9-]+' \
  outputs/phase-9 \
  && { echo "literal leaked into evidence"; exit 1; } || echo "ok"

# secret list 出力に value 列が無いこと（key 名のみで構成されていること）
grep -E '(ghp_|github_pat_|https://hooks\.slack\.com)' outputs/phase-9/staging-secret-list.log \
  && { echo "secret value leaked"; exit 1; } || echo "ok"
```

## 統合テスト連携

- Phase 10 で staging cron 1 回成功と Slack dry-run 投稿を実施するため、本 Phase で staging Secrets / D1 schema が揃っている必要がある。
- production への適用は Phase 13 G2 / G3 ゲート以後に限定。

## 参照資料

- CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」「`apps/web` env アクセス不変条件」
- `scripts/cf.sh` / `scripts/with-env.sh`
- 親ワークフロー Phase 9: `docs/30-workflows/completed-tasks/issue-516-github-audit-log-cross-source-correlation/phase-09.md`
- Cloudflare Workers Cron Triggers Docs（`wrangler.toml` `[triggers]` / `[env.*.triggers]`）

## 成果物

- `apps/api/wrangler.toml` への `[env.staging.*]` / `[env.production.*]` / `[triggers]` 追加
- `apps/api/.dev.vars.example` への 4 種類 op 参照追記
- `outputs/phase-9/phase-9.md`
  - wrangler.toml 編集 diff サマリ
  - 1Password item 存在確認 evidence
  - staging Secrets 投入 evidence（key 名のみ）
  - staging D1 migration apply evidence
  - production 用コマンド草案（Phase 13 G2/G3 後に実行）

## 完了条件（DoD）

- [ ] `apps/api/wrangler.toml` に `[env.staging.triggers]` / `[env.production.triggers]` の `crons = ["*/15 * * * *"]` が追加されている。
- [ ] `[env.staging.vars]` / `[env.production.vars]` に `AUDIT_CORRELATION_FINGERPRINT_VERSION` / `AUDIT_CORRELATION_RUNBOOK_BASE_URL` / `AUDIT_CORRELATION_SLACK_DRY_RUN` が定義されている。
- [ ] `apps/api/.dev.vars.example` に 4 種類の `op://` 参照のみが追記され、実値が含まれない。
- [ ] 1Password item 4 種が存在することを id 確認で記録（値は表示しない）。
- [ ] staging Secrets が 4 種類すべて投入され、`secret list` 出力で key 名が確認できる。
- [ ] staging D1 に `audit_correlation_findings` table が apply 済みで、`PRAGMA table_info` 結果が Phase 8 の保存可否表と一致する（PII 列なし）。
- [ ] 本 Phase の編集 / evidence のいずれにも secret literal が含まれない（grep gate green）。
- [ ] production Secrets 投入と production D1 migration apply は **未実施**で、コマンドのみ runbook 草案に記載されている（Phase 13 G2/G3 ゲート後実行）。
