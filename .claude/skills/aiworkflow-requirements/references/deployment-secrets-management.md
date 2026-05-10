# シークレット・環境変数管理

> 本ドキュメントは ubm-hyogo のデプロイメント仕様書の一部です。
> 管理: .claude/skills/aiworkflow-requirements/

---

## 概要

ubm-hyogo は **Cloudflare** と **GitHub** の2箇所でシークレットを管理する。

| 管理場所 | 何を置くか | 理由 |
| -------- | ---------- | ---- |
| **Cloudflare** | ランタイムシークレット（外部 API キー、DB 接続情報） | Worker/Pages が直接使用するため |
| **GitHub Secrets** | デプロイシークレット（Cloudflare API Token）| CI/CD 自動化のため |
| **GitHub Variables** | 非機密設定値（ドメイン名、プロジェクト名） | 環境別の設定切り替えのため |

---

## 管理場所の判断フロー

```
APIキーはどこで使われるか？

Runtime（Workers/Pages で直接使用）
  → Cloudflare Secrets で管理

CI/CD（GitHub Actions で使用）
  → GitHub Secrets で管理

公開情報（ドメイン名など）
  → GitHub Variables または wrangler.toml [vars] で管理
```

---

## Cloudflare Secrets（ランタイム）

### Cloudflare Workers（バックエンド `apps/api/`）

```bash
# production 環境
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put DATABASE_URL --env production
wrangler secret put SLACK_BOT_TOKEN --env production

# staging 環境
wrangler secret put OPENAI_API_KEY --env staging
wrangler secret put DATABASE_URL --env staging
wrangler secret put SLACK_BOT_TOKEN --env staging
```

| シークレット名 | 説明 | 環境 |
| -------------- | ---- | ---- |
| `OPENAI_API_KEY` | OpenAI API キー（AI機能） | production / staging |
| `ANTHROPIC_API_KEY` | Anthropic API キー（Claude） | production / staging |
| `DATABASE_URL` | Cloudflare D1 接続 URL | production / staging |
| `SLACK_BOT_TOKEN` | Slack Bot Token（通知機能） | production / staging |
| `DISCORD_WEBHOOK_URL` | Discord Webhook（内部通知） | production / staging |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Sheets API 用 Service Account JSON key。`apps/api/src/jobs/sheets-fetcher.ts` / `sync-sheets-to-d1.ts` が `env.GOOGLE_SERVICE_ACCOUNT_JSON` として参照する正本名。値は `wrangler secret list` でも参照不可（name のみ） | production / staging |
| `MAIL_PROVIDER_KEY` | Magic Link メール送信 provider API key。`apps/api/src/index.ts` の mail sender factory が参照する正本名。値は 1Password 正本から stdin 投入し、docs / logs / PR に転記しない | production / staging |
| `AUDIT_CORRELATION_SALT` | audit-correlation fingerprintHash 生成用 salt。1Password `op://CloudflareSecurity/AuditCorrelationSalt/value` が正本。値は docs / logs / PR / evidence に残さない | production / staging |
| `AUDIT_CORRELATION_SALT_PREVIOUS` | Issue #555 rotation window 中だけ存在する previous salt。1Password `op://CloudflareSecurity/AuditCorrelationSaltPrevious/value` が正本。window 終了後に Cloudflare Secrets と 1Password から削除 / archive する | production / staging |

### `GOOGLE_SERVICE_ACCOUNT_JSON` 投入ルール（UT-25 / 2026-04-29）

- `wrangler` は直接呼ばず、必ず `bash scripts/cf.sh secret put/list/delete --config apps/api/wrangler.toml --env <env>` 経由で実行する。
- 値は `op read "op://<Vault>/<Item>/<Field>" | bash scripts/cf.sh secret put ...` の stdin 経由で投入する。secret 値、JSON 内容、`private_key` の一部を文書・ログ・PR本文に転記しない。
- staging-first 固定。production への投入は staging の `secret list` name 確認後だけ実施する。
- rollback は `secret delete` 後、1Password の旧 revision から同じ secret 名へ再投入する。
- `GOOGLE_SHEETS_SA_JSON` は移行期間の legacy alias として実装側のみ許容し、Cloudflare Workers Secret の正本名は `GOOGLE_SERVICE_ACCOUNT_JSON` に統一する。

### Auth mail env 投入ルール（05b-A / 2026-05-01）

- Cloudflare Workers Secret の正本名は `MAIL_PROVIDER_KEY`。旧 `RESEND_API_KEY` は新規 provisioning しない。
- `MAIL_FROM_ADDRESS` と `AUTH_URL` は Secret ではなく `apps/api/wrangler.toml` の `[env.<env>.vars]` / Cloudflare Variables で管理する。
- 値は `op read "op://UBM-Hyogo/auth-mail-<env>/MAIL_PROVIDER_KEY" | bash scripts/cf.sh secret put MAIL_PROVIDER_KEY --config apps/api/wrangler.toml --env <env>` の stdin 経由で投入する。
- staging-first 固定。staging の name-only secret list と Magic Link smoke は 09a、production readiness は 09c が所有する。
- evidence には key 名と `op://Vault/Item/Field` 参照だけを残し、値・値ハッシュ・provider response body は残さない。

### Audit correlation salt rotation（Issue #555 / 2026-05-08）

- Secret policy の正本は本ファイル。parallel `references/secrets-management.md` is intentionally not created。
- `AUDIT_CORRELATION_SALT` は current、`AUDIT_CORRELATION_SALT_PREVIOUS` は rotation window 中だけの previous とする。
- 1Password references は `op://CloudflareSecurity/AuditCorrelationSalt/value` と `op://CloudflareSecurity/AuditCorrelationSaltPrevious/value` に統一する。
- `scripts/audit-correlation/rotate-salt.sh` は `--dry-run` / `--apply` / `--rollback` / `--end-rotation` の 4 modes を持つ。production mutation は user gate + explicit confirmation なしに実行しない。
- staging `--end-rotation` は previous secret delete 後に Worker deploy まで実行し、env binding refresh を完了させる。production deploy は user gate 後の明示操作に限定する。
- dual-hash bridge は 7 日を既定 window とし、window に現れない actor の旧 incident は自動 backfill しない。
- evidence には secret 名、1Password reference、command exit code、redacted runner output のみを残す。salt literal、salt hash full value、Cloudflare token、GitHub PAT は保存禁止。

### Cloudflare Pages（フロントエンド `apps/web/`）

```bash
# サーバーサイドのシークレット（NEXT_PUBLIC_ではないもの）
wrangler pages secret put API_SECRET_KEY --project-name=ubm-hyogo-web
```

> **注意**: `NEXT_PUBLIC_*` の値はビルド時に埋め込まれるため、シークレットではなく Cloudflare Pages の「Environment Variables」で管理する。

| 変数名 | 説明 | 分類 |
| ------ | ---- | ---- |
| `NEXT_PUBLIC_API_URL` | API のベース URL（公開） | Environment Variable |
| `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID` | CF アカウント ID（公開） | Environment Variable |
| `API_SECRET_KEY` | サーバーサイドの秘密鍵 | Secret |

---

## GitHub Secrets / Variables（CI/CD 用）

GitHub リポジトリの `Settings > Secrets and variables > Actions` で管理。

### Slack Incident Runbook Delivery（09c / 2026-05-06）

09c production deploy 後に incident response runbook を Slack bot で配信し、message timestamp と permalink を Phase 11 evidence に残す。値そのものは文書・log・PR に記録しない。

| 種別 | 名前 | 設置先 | 1Password 正本 | 用途 |
| --- | --- | --- | --- | --- |
| bot token | `SLACK_BOT_TOKEN_INCIDENT_RUNBOOK` | GitHub environment secrets: `production-slack-delivery-dryrun` / `production-slack-delivery` | `op://UBM-Hyogo/Slack Bot - Incident Runbook/credential` | `chat.postMessage` / `chat.getPermalink` |
| production channel id | `SLACK_INCIDENT_RUNBOOK_CHANNEL_ID` | GitHub environment variable: `production-slack-delivery` | n/a | `#ubm-hyogo-incident-runbook` 宛先 |
| dry-run channel id | `SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID` | GitHub environment variable: `production-slack-delivery-dryrun` | n/a | `#ubm-hyogo-incident-runbook-dryrun` 宛先 |

Rotation 手順:

1. 1Password の `Slack Bot - Incident Runbook` item で token を更新する。
2. `gh secret set SLACK_BOT_TOKEN_INCIDENT_RUNBOOK < new_value` を標準入力経由で実行し、shell history に値を残さない。
3. Slack admin UI で旧 token を revoke する。
4. dry-run delivery を実行し、`slack-delivery-dryrun.json` の `ok=true` / `message.permalink` を確認する。

取扱原則:

- `xox[b]-` 値、値ハッシュ、Slack API response body の secret 相当部分を docs / logs / PR に残さない。
- dry-run は GitHub environment `production-slack-delivery-dryrun`（reviewer なし）で secret / variable を解決する。
- production 配信は GitHub environment `production-slack-delivery` の reviewer approval 後のみ実行する。
- `workflow_run` は `backend-ci` / `web-cd` の main 成功後 automatic dry-run のみ。production は `workflow_dispatch` + `dryrun_evidence_confirmed=true` + environment approval に限定する。

### Required Secrets

| シークレット名 | 説明 | 使用箇所 |
| -------------- | ---- | -------- |
| `CLOUDFLARE_API_TOKEN` | 現行 `backend-ci.yml` / `web-cd.yml` の environment-scoped Cloudflare API Token | backend-ci.yml / web-cd.yml |
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | D1 migration 用 Cloudflare API Token target contract。runtime cutover 未完了 | Pending |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Workers deploy 用 Cloudflare API Token target contract。runtime cutover 未完了 | Pending |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | 旧 Pages deploy 用 Cloudflare API Token target contract。Issue #331 後の `web-cd.yml` では未参照 | Deprecated target |
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | D1 migration 用 Cloudflare API Token | backend-ci.yml |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Workers deploy 用 Cloudflare API Token | backend-ci.yml。web-cd.yml は 2026-05-09 task-01 alignment 後に使用しない |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Deprecated historical Pages deploy token | Deprecated for web-cd.yml after OpenNext Workers cutover |
| `CLOUDFLARE_API_TOKEN` | web-cd の environment-scoped deploy token 正本名。OIDC cutover までは transitional direct token として維持 | web-cd.yml |
| `CLOUDFLARE_API_TOKEN_STAGING` | Cloudflare API Token（D1 migration verification staging 用） | d1-migration-verify.yml |
| `CF_AUDIT_TOKEN_PROD` | Cloudflare Audit Logs 読み取り専用 Token（監視用）。scope は `Account > Audit Logs:Read` のみ。deploy 用 token と名前・権限・rotation を分離する。Issue #518 HOLD 中も保持し、手動確認時だけ使う | `cf-audit-log-monitor.yml`（HOLD 中は `workflow_dispatch` のみ） |
| `CF_AUDIT_D1_TOKEN_PROD` | cf-audit-log monitor が D1 `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` へ書き込むための最小権限 Cloudflare Token。deploy 用 token は監視 workflow に注入しない。Issue #518 HOLD 中も保持 | `cf-audit-log-monitor.yml` (`environment: production`, HOLD 中は手動 run のみ) |
| `DISCORD_WEBHOOK_URL` | Discord Webhook（デプロイ通知） | 未使用（UT-08-IMPL で導入予定。現行 web-cd.yml / backend-ci.yml には参照なし） |
| `CODECOV_TOKEN` | Codecov カバレッジアップロード | ci.yml |

### Issue #571 staging runtime smoke GitHub Environment（2026-05-08）

`staging-runtime-smoke` は Issue #571 の staging runtime smoke CI 専用 GitHub Environment。current cycle は `implemented-local / implementation / NON_VISUAL` であり、実 Environment 作成と secret 配置は user approval 後に行う。2026-05-10 の task-02 close-out 以降、配置 runbook の入口正本は `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md` とする。推奨実行経路は `bash scripts/smoke/provision-staging-secrets.sh` で、`op read` 出力は `gh secret set --body -` へ stdin で直結する。手動 `gh secret set` は fallback として runbook に残す。

| Category | Secret | Placement | Purpose |
| --- | --- | --- | --- |
| staging runtime credential | `STAGING_API_BASE` | GitHub Environment secret: `staging-runtime-smoke` | staging API base URL for smoke |
| staging runtime credential | `STAGING_ADMIN_BEARER` | GitHub Environment secret: `staging-runtime-smoke` | admin read-only smoke auth |
| staging runtime credential | `STAGING_MEMBER_ID` | GitHub Environment secret: `staging-runtime-smoke` | member fixture id |
| staging runtime credential | `STAGING_ME_BEARER` | GitHub Environment secret: `staging-runtime-smoke` | member `/me` smoke auth |
| staging runtime credential | `SLACK_WEBHOOK_INCIDENT` | GitHub Environment secret: `staging-runtime-smoke` | failure-only incident post |

Rules:

- Repository-scoped secrets must not store staging runtime credentials.
- The smoke workflow is invoked through reusable `workflow_call` from `backend-ci.yml`; no repository-scoped dispatch token is required for Issue #571.
- Evidence may record secret names and placement only. Values, value hashes, token fragments, webhook URLs, and decoded cookies are forbidden in docs, logs, artifacts, PR body, and commit messages.
- Before runtime execution, validate both name-only secret inventory and a value-without-printing staging marker check for `STAGING_API_BASE`.
- `scripts/smoke/provision-staging-secrets.sh` verifies the final environment inventory by secret name only. Runtime smoke success is not implied until a user-approved Actions run produces fresh evidence.

#### Environment 作成済み・secret 0 件問題（CI recovery / 2026-05-09）

GitHub Environment は作成されているが secret が 0 件のまま staging runtime smoke を起動すると、`runtime-smoke-staging.yml` 内の `${VAR:?}` チェックが exit 2 を返し、smoke job 全段が連鎖失敗する。これは Environment が「存在する」ことと「runtime credential が揃っている」ことを区別しない設計に由来する pre-flight gap であり、CI recovery wave で次の verification pattern を canonical に固定した。

| 観点 | 正本 |
| --- | --- |
| pre-flight 経路 | `bash scripts/smoke/provision-staging-secrets.sh`（idempotent / redacted） |
| inventory check | `gh secret list --env staging-runtime-smoke --json name -q '.[].name'` で **name のみ** を確認。値・値 hash を出力しない |
| 投入経路 | `op read "op://<Vault>/<Item>/<Field>" \| gh secret set <NAME> --env staging-runtime-smoke --body -` の stdin 直結 |
| smoke 起動 gate | user-approved Actions run 前の inventory は 5 secret（`STAGING_API_BASE` / `STAGING_ADMIN_BEARER` / `STAGING_MEMBER_ID` / `STAGING_ME_BEARER` / `SLACK_WEBHOOK_INCIDENT`）一致を確認する。ただし workflow 内 early-fail は smoke 本体必須 4 secret のみを対象にし、Slack は failure summary post step の fail-closed guard が担当する |
| `${VAR:?}` の扱い | smoke workflow 側では smoke 本体必須 4 secret を name-only early-fail する。invocation 前の runbook/helper pre-flight で 0 件を検出し、連鎖失敗を抑止する |
| ログ衛生 | Environment 名と secret 名のみを stdout に出力。値、Authorization header、cookie, decoded webhook URL は出力 / 文書 / PR / evidence に転記禁止 |

### GitHub Variables（非機密設定値）

`Settings > Secrets and variables > Actions > Variables` で管理。

| 変数名 | 説明 | 例 |
| ------ | ---- | -- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account 識別子。資格情報ではないため Repository Variable として管理し、workflow では `${{ vars.CLOUDFLARE_ACCOUNT_ID }}` で参照 | `b3dde7be...` |
| `CLOUDFLARE_PAGES_PROJECT` | Deprecated。Issue #331 後の `web-cd.yml` では未参照。Pages project retirement / rollback window 完了後に削除候補 | `ubm-hyogo-web` |
| `CLOUDFLARE_PAGES_PROJECT` | Deprecated for current web-cd.yml after OpenNext Workers cutover. Historical Pages project name retained for UT-28 references only; new web deploy logic uses `apps/web/wrangler.toml` `[env.*].name` | `ubm-hyogo-web` |
| `CLOUDFLARE_WORKERS_DOMAIN` | Workers 本番ドメイン | `api.ubm-hyogo.workers.dev` |
| `CLOUDFLARE_WORKERS_STAGING_DOMAIN` | Workers ステージングドメイン | `api-staging.ubm-hyogo.workers.dev` |
| `CF_AUDIT_CLASSIFIER` | Cloudflare Audit Logs analyzer の classifier 選択。既定値は `threshold`。`ml` は Issue #515 Gate 後のみ | `threshold` |
| `ML_MODEL_PATH` | Gate 後の ML model artifact path。`op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` 参照のみを workflow contract に置き、解決値は secret として扱って logs / docs / PR body に残さない。production 設定は Gate-0〜C 通過後のみ | 未設定 |
| `CF_AUDIT_FALLBACK_RATE_THRESHOLD` | Issue #549 production ML switch 後の fallback rate alert 閾値。既定は `0.05` | `0.05` |
| `CF_AUDIT_FALLBACK_RATE_CONSECUTIVE_HOURS` | fallback rate alert の連続超過時間。既定は `3` | `3` |
| `CF_AUDIT_REDACT_SECRET` | redacted feature export の actor hash salt。feature export workflow でのみ使う secret。ログ・dataset へ値を出さない | GitHub environment secret |

---

## wrangler.toml の環境別設定

ランタイムで使用する**非機密**設定値（シークレットでないもの）は `wrangler.toml` の `[vars]` セクションで管理する。

```toml
# apps/api/wrangler.toml

name = "ubm-hyogo-api"

[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"

[env.staging]
name = "ubm-hyogo-api-staging"

[env.staging.vars]
ENVIRONMENT = "staging"
LOG_LEVEL = "debug"

[env.production]
name = "ubm-hyogo-api"

[env.production.vars]
ENVIRONMENT = "production"
LOG_LEVEL = "warn"
```

> **シークレットは wrangler.toml に記載しない**。`wrangler secret put` で登録する。

---

## ローカル開発での設定

ローカルの環境変数は、**1Password Environments** を正本にする。
`gitignore` 付きの平文 `.env` を秘密の正本にしない。環境変数は vault item に押し込まず、Environment に `key=value` で持たせる。

### 推奨構成

1. `1Password Developer` を有効化する
2. `Developer > View Environments` でプロジェクト用 Environment を作る
3. 変数は `OPENAI_API_KEY=...` のように Environment に直接追加する
4. 必要なら `Local .env file` destination を `/Users/dm/secrets/.env` に mount する
5. リポジトリにはサンプルの `*.example` だけを置く

### 理由

- 1Password Environments はプロジェクトの環境変数を vault から分離して管理できる
- local `.env` file destination は plaintext をディスクに書かずに `.env` として読める
- `Secure Note` は一般メモ用途であり、環境変数の管理単位としては不適切
- `op run` を経由した secret reference ファイル管理より、Environment 正本の方が設定の意味が明確

### 例外的にファイルを使う場合

```bash
# 1Password Environments から mount される例
OPENAI_API_KEY=...
DATABASE_URL=...
SLACK_BOT_TOKEN=...
```

```bash
# /Users/dm/secrets/.env（1Password が mount、手編集しない）
NEXT_PUBLIC_API_URL=http://localhost:8787
API_SECRET_KEY=...
```

> ここでの `.env` は 1Password が mount する読み取り専用の destination であり、手で平文を置く場所ではない。

---

## Cloudflare CLI ラッパー: `scripts/cf.sh`（UT-06 派生 / 2026-04-27）

ローカルでの `wrangler` 直接実行および `wrangler login`（OAuth トークンを `~/Library/Preferences/.wrangler/config/default.toml` に保持する方式）は **使用禁止**。Claude Code および手動オペレーション双方で次の canonical wrapper のみを使う。

```bash
# 認証確認
bash scripts/cf.sh whoami

# D1 操作
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup.sql

# デプロイ・rollback
bash scripts/cf.sh deploy   --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy   --config apps/web/wrangler.toml --env production
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

`scripts/cf.sh` の役割（1Password / esbuild / mise 統合の canonical wrapper）:

| 役割 | 内容 |
| --- | --- |
| 1Password 注入 | `scripts/with-env.sh` 経由で `op run --env-file=.env` を呼び、`.env` 内の `op://Vault/Item/Field` 参照から `CLOUDFLARE_API_TOKEN` 等を環境変数として揮発的に渡す（ファイルやログには残らない） |
| esbuild 不整合解決 | グローバル `esbuild` とのバージョン不整合を `ESBUILD_BINARY_PATH` で自動解決（worktree のローカル `node_modules/esbuild` を優先解決） |
| Node 24 / pnpm 10 強制 | `mise exec --` 経由で mise 管理の Node / pnpm バイナリを保証 |
| ローカル wrangler 優先 | グローバル `wrangler` ではなく worktree の `node_modules/.bin/wrangler` を解決し、wrangler 4.x strict mode の前提を満たす |

**禁止事項（Claude Code を含む全 AI エージェントに適用）**:

- `.env` の中身を `cat` / `Read` / `grep` 等で表示・読み取らない（実値は op 参照のみだが慣性事故防止）
- API Token 値・OAuth トークン値を出力やドキュメントに転記しない
- `wrangler login` でローカル OAuth トークン（`~/Library/Preferences/.wrangler/config/default.toml`）を保持しない。`.env` の op 参照に一本化する
- ローカル `.env` には実値を書かない（AI 学習混入防止）。値は 1Password に保管し、`.env` には `op://Vault/Item/Field` 参照のみを記述する

---

## セキュリティ原則

| 原則 | 説明 |
| ---- | ---- |
| シークレットの分離 | 本番と staging は別のシークレット値を使用する |
| 最小権限 | Cloudflare API Token は必要なスコープのみ付与 |
| ローテーション | 90日ごとにシークレットをローテーションする |
| 監査 | GitHub Actions のログにシークレット値が出力されないことを確認 |

---

## Cloudflare API Token の作成手順

```
Cloudflare Dashboard > My Profile > API Tokens > Create Token

テンプレート: Edit Cloudflare Workers
スコープ:
  - Account > Workers Scripts: Edit
  - Account > Cloudflare Pages: Edit
  - Account > D1: Edit（D1 を使用する場合）
  - Zone > Zone: Read（カスタムドメインを使用する場合）
```

---

## Cloudflare API Token 90 日 rotation runbook（Issue #407 / 2026-05-06）

Cloudflare API Token の 90 日 rotation は `docs/30-workflows/issue-407-cf-token-rotation-90day-runbook-automation/` を current implementation spec とし、手動 runbook と GitHub Actions reminder workflow の 2 層で管理する。

| 項目 | 正本 |
| --- | --- |
| runbook | `docs/30-workflows/operations/cf-token-rotation-runbook.md` |
| 実施記録 | `docs/30-workflows/operations/cf-token-rotation-log.md` |
| reminder workflow | `.github/workflows/cf-token-rotation-reminder.yml` |
| checker | `scripts/check-cf-rotation-reminder.sh` |
| 発行日 variable | GitHub Variable `CF_TOKEN_ISSUED_AT` |

運用境界:

- Token 値 / Token ID / scope 値は runbook、実施記録、Phase outputs、GitHub Issue、PR body、evidence に記録しない。
- rotation 自動化はしない。workflow は 85 日経過時点で Issue を起票する reminder のみ。
- staging-first、24h 並行運用、旧 Token disable 後 24h delete、rollback 経路を runbook の必須 gate とする。
- 実 production rotation と `gh secret set` は user 明示承認後のみ実行する。

### モニタリング系 Secret（UT-08 連携）

UT-08 モニタリング/アラート設計で追加される Secret 群は **すべて 1Password Environments** で正本管理し、Cloudflare Secrets / GitHub Secrets 経由で配布する。コードへのハードコード禁止。

| Secret 名 | 用途 | 配布先 |
| --- | --- | --- |
| `SLACK_ALERT_WEBHOOK_URL` | アラート通知（Slack Incoming Webhook） | Cloudflare Secrets |
| `ALERT_EMAIL_FALLBACK_TO` | Slack 失敗時の Email fallback 宛先 | Cloudflare Secrets |
| `UPTIMEROBOT_API_KEY` | 外形監視 monitor 設定 | GitHub Secrets / 手動運用 |

詳細は `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md` を参照。

### 09b-A Sentry / Slack runtime smoke Secret（2026-05-05）

09b-A incident response runtime smoke は **Cloudflare Workers runtime secret** として次を正本化する。値は 1Password 正本から stdin 投入し、docs / logs / PR body / evidence に実値・実値 hash・DSN host/project id・webhook URL を記録しない。

| Secret 名 | 用途 | 配布先 | 正本 |
| --- | --- | --- | --- |
| `SENTRY_DSN_API` | API Worker Sentry SDK DSN | Cloudflare Secrets (`apps/api`, staging / production) | `op://UBM-Hyogo/Sentry API DSN (<env>)/dsn` |
| `SENTRY_DSN_WEB` | Web Worker Sentry SDK DSN | Cloudflare Secrets (`apps/web`, staging / production) | `op://UBM-Hyogo/Sentry Web DSN (<env>)/dsn` |
| `SLACK_WEBHOOK_INCIDENT` | incident response Slack Incoming Webhook | Cloudflare Secrets (`apps/api`, staging / production) | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` |
| `SLACK_WORKFLOW_URL` | optional Slack workflow endpoint。採用しない環境では未配置 | Cloudflare Secrets (`apps/api`, staging / production) | `op://UBM-Hyogo/Slack Incident Workflow (<env>)/url` |
| `SMOKE_ADMIN_TOKEN` | `/admin/smoke/observability` Bearer token | Cloudflare Secrets (`apps/api`, staging / production) | `op://UBM-Hyogo/Smoke Admin Token (<env>)/token` |

既存 `SLACK_ALERT_WEBHOOK_URL` は UT-08 の汎用 monitoring alert 名であり、09b-A の incident response 正本名としては使わない。移行期間に旧名参照が見つかった場合は、09b-A Phase 5 Step 0 で列挙し、`SLACK_WEBHOOK_INCIDENT` へ一本化する。

Production observability smoke uses the same secret names as staging with environment-scoped values. It must be placed through `bash scripts/cf.sh secret put --env production` after G1 approval. `wrangler.toml` stores `ENVIRONMENT = "production"` and Worker routing facts only; secret values and secret binding declarations are not written there.

### Issue #520 Slack incident channel webhook provisioning（2026-05-07）

`SLACK_WEBHOOK_INCIDENT` is the canonical incoming webhook secret for `#ubm-hyogo-incidents`. The value is a secret and must never be written to repository files, logs, workflow outputs, issue bodies, PR bodies, or commit messages.

| Secret 名 | 用途 | 配布先 | 正本 |
| --- | --- | --- | --- |
| `SLACK_WEBHOOK_INCIDENT` | `#ubm-hyogo-incidents` incoming webhook for staging / production observability smoke | Cloudflare Secrets (`apps/api`, staging / production) and GitHub Actions secret when CI smoke requires it | `op://Employee/ubm-hyogo-env/SLACK_WEBHOOK_INCIDENT_<ENV>` |

Placement gates:

- G1: create or reuse the Slack channel and incoming webhook.
- G2: store the value in 1Password and place the staging Cloudflare secret with `bash scripts/cf.sh secret put`.
- G3: after staging smoke PASS, place the production Cloudflare secret.
- G4: production smoke PASS and `bash scripts/redaction-grep.sh .` PASS.

`wrangler secret put` must not be executed directly. Use `bash scripts/cf.sh secret put SLACK_WEBHOOK_INCIDENT --config apps/api/wrangler.toml --env <env>` with the value supplied by stdin from 1Password. Name-only verification may use `bash scripts/cf.sh secret list --config apps/api/wrangler.toml --env <env> | grep SLACK_WEBHOOK_INCIDENT`.

### Issue #408 Cloudflare Audit Logs monitoring Secret（2026-05-06）

Issue #408 は Cloudflare Audit Logs 監視 workflow 仕様である。Issue #518 により自動監視は `HOLD / manual-check-only` へ縮退したが、手動確認と将来再開のため deploy token とは別に次の監視用 Secret を正本化する。値は 1Password 正本から GitHub environment secret へ派生コピーし、docs / logs / PR body / Phase evidence に実値・値 hash・Authorization header を残さない。

| Secret 名 | 用途 | 配布先 | 正本 |
| --- | --- | --- | --- |
| `CF_AUDIT_TOKEN_PROD` | Cloudflare Audit Logs 読み取り専用 Token。scope は `Account > Audit Logs:Read` のみ | GitHub environment secret (`production`) | 1Password（Issue #408 実装 PR で item/path を確定） |
| `CF_AUDIT_D1_TOKEN_PROD` | Audit log 監視 workflow 専用 D1 書き込み Token。D1 execute に必要な最小 scope のみ。deploy / Workers edit には使わない | GitHub environment secret (`production`) | 1Password（Issue #408 runtime runbook で item/path を確定） |

運用ルール:

- `CF_AUDIT_TOKEN_PROD` は `CLOUDFLARE_API_TOKEN` の代替として deploy / D1 migration / Workers Scripts edit に使わない。監視 workflow から deploy 用 `CLOUDFLARE_API_TOKEN` は外し、D1 書き込みは `CF_AUDIT_D1_TOKEN_PROD` に分離する。
- rotation は deploy token と独立に実施し、rotation window は Issue #408 の baseline 学習対象から除外する。
- Phase 11 evidence は token 値ではなく、`Audit Logs:Read` の scope 確認結果と secret 名だけを保存する。
- runtime workflow (`.github/workflows/cf-audit-log-monitor.yml`)、scripts (`scripts/cf-audit-log/**`)、D1 migration (`apps/api/migrations/0014_create_cf_audit_log.sql`) を Issue #408 実装 PR で追加した（2026-05-06）。Issue #518 で `cf-audit-log-monitor.yml` は schedule 削除 + `dry_run=true` 既定に変更し、`cf-audit-log-monitor-watchdog.yml` は削除した。**ただし** token 発行 / 1Password 登録 / GitHub Secret 登録 / 7 日 baseline 学習 は production 担当者が手動で行う runbook 工程であり、本 PR のコード merge では完了扱いにしない。HOLD 中の運用正本は `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`。
- runtime workflow (`.github/workflows/cf-audit-log-monitor.yml` / `cf-audit-log-monitor-watchdog.yml`)、scripts (`scripts/cf-audit-log/**`)、D1 migration (`apps/api/migrations/0014_create_cf_audit_log.sql`) を Issue #408 実装 PR で追加した（2026-05-06）。**ただし** token 発行 / 1Password 登録 / GitHub Secret 登録 / 7 日 baseline 学習 は production 担当者が手動で行う runbook 工程であり、本 PR のコード merge では完了扱いにしない。`docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-5/secrets-registration.md`（または phase-12 implementation guide）を正本として段階的に green 化する。
- Issue #515 の `CF_AUDIT_CLASSIFIER` は repository variable として `threshold` を既定にする。Issue #549 の Gate-0〜C 通過後のみ production switch PR で `ml` に変更する。`ML_MODEL_PATH` は `op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD` を正本参照とし、docs / logs / PR body には解決値を残さない。`CF_AUDIT_REDACT_SECRET` は feature export Gate 後に設定し、ML-ready abstraction では secret 値を要求しない。

### Issue #514 Cloudflare Audit Logs cold storage R2 export Secret（2026-05-07）

Issue #514 は `spec_created / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` の cold storage export 仕様である。GitHub Actions から R2 へ redacted audit log を PUT するため、監視 Token とは別に export 専用 Secret を正本化する。

| Secret 名 | 用途 | 配布先 | 正本 |
| --- | --- | --- | --- |
| `CF_AUDIT_R2_TOKEN_PROD` | Audit log cold storage export 専用 R2 Token。R2 object PUT / GetObject restore drill に必要な最小 scope のみ | GitHub environment secret (`production`) | 1Password（G1 approval 後に item/path を確定） |

運用ルール:

- `CF_AUDIT_R2_TOKEN_PROD` は `CF_AUDIT_TOKEN_PROD`（Audit Logs:Read）や deploy 用 token の代替として使わない。
- `UBM_AUDIT_COLD_STORAGE` binding は `apps/api/wrangler.toml` の R2 binding 名として使い、secret 値や token preview は config / docs / evidence に保存しない。
- Runtime order は G1 R2 bucket / binding / Secret preflight -> G2 D1 manifest migration apply -> G3-prod first export + restore drill -> G4 commit/push/PR。
- Evidence は secret 名、run id、object key、row count、sha256、redaction policy version まで保存可。token 値、Bearer header、value hash、full IP、full User-Agent は保存禁止。

---

## UT-27: GitHub Secrets / Variables 同期運用（2026-04-29）

UT-27 で導入する GitHub 側 CD 値は、**1Password Environments を正本、GitHub Secrets / Variables を派生コピー**として扱う。実値は runbook、Phase outputs、ログに転記しない。

### 配置先

| 名前 | 種別 | 配置先 | 正本 |
| --- | --- | --- | --- |
| `CF_TOKEN_D1_STAGING` / `CF_TOKEN_D1_PRODUCTION` | Secret | GitHub environment secrets (`staging` / `production`) | 1Password |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Secret | GitHub environment secrets (`staging` / `production`) | 1Password |
| `CLOUDFLARE_API_TOKEN` | Secret | GitHub environment secrets (`staging` / `production`) | Current runtime secret for `backend-ci.yml` / `web-cd.yml` |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Secret | GitHub environment secrets (`staging` / `production`) | Deprecated target; not referenced by current `web-cd.yml` |
| `CF_TOKEN_WORKERS_STAGING` / `CF_TOKEN_WORKERS_PRODUCTION` | Secret | GitHub environment secrets (`staging` / `production`) | 1Password（backend-ci Workers deploy 用。web-cd は使用しない） |
| `CF_TOKEN_PAGES_STAGING` / `CF_TOKEN_PAGES_PRODUCTION` | Secret | Historical GitHub environment secrets (`staging` / `production`) | 1Password historical Pages references only |
| `CLOUDFLARE_API_TOKEN` | Secret | GitHub environment secrets (`staging` / `production`) | web-cd deploy token 正本名。OIDC cutover までは transitional direct token |
| `CLOUDFLARE_ACCOUNT_ID` | Variable | GitHub repository variable | 1Password（識別子として管理、GitHub では非 Secret） |
| `DISCORD_WEBHOOK_URL` | Secret | GitHub repository secret | 1Password |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | GitHub repository variable | Deprecated after Issue #331; delete only with Pages retirement approval |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | GitHub repository variable | Deprecated historical UT-28 Pages project name; current `web-cd.yml` must not read it |

### 手動同期パターン

```bash
for ENV in staging production; do
  for SCOPE in D1 WORKERS PAGES; do
    SECRET_NAME="CF_TOKEN_${SCOPE}_${ENV^^}"
    op read "op://UBM-Hyogo/Cloudflare/${SECRET_NAME}" \
      | gh secret set "$SECRET_NAME" --env "$ENV" --repo daishiman/UBM-Hyogo
  done
done
```

要件:

- 値は一時環境変数にのみ置き、ファイル化しない。
- `--body "実値"` のように shell history に残る書き方を禁止する。
- repository-scoped と environment-scoped の同名併存は、意図がある場合を除き drift として扱う。
- Cloudflare API Token は Pages Edit / Workers Scripts Edit / D1 Edit / Account Settings Read の最小スコープにする。
- 同期後は 1Password Item Notes に Last-Updated 日時だけを記録し、値ハッシュは記録しない。

### rollback 経路

配置失敗 / token 漏洩 / environment 構成ミス時は以下 3 経路から状況に応じて選択する。秘密漏洩時は (2) → (1) の順序で必ず token 失効を先行させる。

| # | 経路 | コマンド / 操作 | 用途 |
| --- | --- | --- | --- |
| 1 | GitHub 側で削除 → 再注入 | `gh secret delete <NAME> --env <name>` → 1Password から `op read` → `gh secret set` 再実行 | 配置ミス / 値の rollback |
| 2 | Cloudflare 側で token 失効・再発行 | Cloudflare ダッシュボードで該当 API Token を Revoke → 新規発行 → 1Password 更新 → GitHub 同期 | 秘密漏洩 / token compromise |
| 3 | Environment 自体を削除 | `gh api repos/{owner}/{repo}/environments/{name} -X DELETE` | environment 構成の最終手段（全 environment-scoped secret/variable も同時に消える点に注意） |

---

## U-FIX-CF-ACCT-01-DERIV-02: Cloudflare deploy token split

2026-05-09 task-01 alignment 以降、GitHub Actions の Cloudflare deploy token は workflow ごとに正本名を分ける。backend-ci は用途と環境で分けた 6 Secret を維持し、web-cd は実 GitHub Environment に登録済みの `CLOUDFLARE_API_TOKEN` を正本名として使う。

| Secret | Scope | GitHub environment | Consumer |
| --- | --- | --- | --- |
| `CF_TOKEN_D1_STAGING` | `D1:Edit`, `Account Settings:Read` | `staging` | `backend-ci.yml` D1 migration |
| `CF_TOKEN_D1_PRODUCTION` | `D1:Edit`, `Account Settings:Read` | `production` | `backend-ci.yml` D1 migration |
| `CF_TOKEN_WORKERS_STAGING` | `Workers Scripts:Edit`, `Account Settings:Read` | `staging` | `backend-ci.yml` Workers deploy |
| `CF_TOKEN_WORKERS_PRODUCTION` | `Workers Scripts:Edit`, `Account Settings:Read` | `production` | `backend-ci.yml` Workers deploy |
| `CF_TOKEN_PAGES_STAGING` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `staging` | Deprecated Pages target; not referenced by current `web-cd.yml` |
| `CF_TOKEN_PAGES_PRODUCTION` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `production` | Deprecated Pages target; not referenced by current `web-cd.yml` |
| `CLOUDFLARE_API_TOKEN` | `Workers Scripts:Edit`, `Account Settings:Read` | `staging` / `production` | `web-cd.yml` deploy token 正本名。environment-scoped secret として保持 |
| `CF_TOKEN_PAGES_STAGING` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `staging` | Deprecated historical Pages deploy token |
| `CF_TOKEN_PAGES_PRODUCTION` | `Cloudflare Pages:Edit`, `Account Settings:Read` | `production` | Deprecated historical Pages deploy token |

`CLOUDFLARE_API_TOKEN` remains the current runtime deploy secret until the token split/OIDC cutover is explicitly executed. Evidence must not include token values, value hashes, or token previews.
`CLOUDFLARE_API_TOKEN` is deprecated for backend deploy workflows, but remains the current web-cd environment-scoped deploy token until the OIDC cutover replaces direct token injection. Evidence must not include token values, value hashes, or token previews.

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-05-09 | 1.4.1 | CI recovery task-01: web-cd の deploy secret 正本名を environment-scoped `CLOUDFLARE_API_TOKEN` へ同期。`CF_TOKEN_WORKERS_*` は backend-ci Workers deploy 用として維持し、web-cd では使用しない境界へ補正。 |
| 2026-05-10 | 1.4.1 | task-02 close-out: 配置 runbook 入口を `docs/30-workflows/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md`、推奨実行経路を `scripts/smoke/provision-staging-secrets.sh` として分離。workflow early-fail は smoke 本体必須 4 secret、Slack は failure summary post step の fail-closed guard が担当する境界へ補正 |
| 2026-05-09 | 1.4.0 | CI recovery wave: Issue #571 staging runtime smoke 節に「Environment 作成済み・secret 0 件問題」の pre-flight 検証 pattern を追加。`scripts/smoke/provision-staging-secrets.sh` を canonical 投入経路、`gh secret list --json name -q` を name-only inventory として正本化し、`${VAR:?}` 連鎖失敗の抑止経路を明記 |
| 2026-05-07 | 1.3.1 | Issue #518 Cloudflare Audit Logs HOLD を反映。監視 secret は保持するが、schedule 自動監視と watchdog は停止し、手動確認時のみ利用する |
| 2026-05-06 | 1.3.0 | U-FIX-CF-ACCT-01-DERIV-02: Cloudflare deploy token を D1 / Workers / Pages x staging / production の 6 Secret へ分割。旧 `CLOUDFLARE_API_TOKEN` は 24h 並行保持後に失効する deprecated secret として扱う。 |
| 2026-04-29 | 1.2.0 | UT-27: GitHub Secrets / Variables の 1Password 正本・派生コピー運用、一時環境変数 + unset パターン、Last-Updated メモ運用を追記 |
| 2026-05-06 | 1.3.0 | Issue #408 Cloudflare Audit Logs monitoring の `CF_AUDIT_TOKEN_PROD` を `spec_created / runtime pending` として追加。deploy token と監視 token の名前・scope・rotation 分離を正本化 |
| 2026-04-09 | 1.0.0 | 初版作成（Cloudflare/GitHub 2層シークレット管理） |
| 2026-04-27 | 1.1.0 | UT-06 派生: `scripts/cf.sh` を 1Password / esbuild / mise 統合の canonical wrapper として明文化。`wrangler login` ローカル OAuth トークン保持禁止と `op://` 参照経由の動的注入を必須化 |
| 2026-04-27 | 1.1.0 | UT-08 モニタリング系 Secret セクション追加 |
| 2026-04-29 | 1.2.0 | UT-25: `GOOGLE_SERVICE_ACCOUNT_JSON` を apps/api Workers Secret 正本名として追加し、`scripts/cf.sh` + stdin 投入 / staging-first / rollback / legacy alias 境界を明文化 |
