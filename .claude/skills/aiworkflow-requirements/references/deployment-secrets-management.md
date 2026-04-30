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

### `GOOGLE_SERVICE_ACCOUNT_JSON` 投入ルール（UT-25 / 2026-04-29）

- `wrangler` は直接呼ばず、必ず `bash scripts/cf.sh secret put/list/delete --config apps/api/wrangler.toml --env <env>` 経由で実行する。
- 値は `op read "op://<Vault>/<Item>/<Field>" | bash scripts/cf.sh secret put ...` の stdin 経由で投入する。secret 値、JSON 内容、`private_key` の一部を文書・ログ・PR本文に転記しない。
- staging-first 固定。production への投入は staging の `secret list` name 確認後だけ実施する。
- rollback は `secret delete` 後、1Password の旧 revision から同じ secret 名へ再投入する。
- `GOOGLE_SHEETS_SA_JSON` は移行期間の legacy alias として実装側のみ許容し、Cloudflare Workers Secret の正本名は `GOOGLE_SERVICE_ACCOUNT_JSON` に統一する。

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

## GitHub Secrets（CI/CD 用）

GitHub リポジトリの `Settings > Secrets and variables > Actions` で管理。

### Required Secrets

| シークレット名 | 説明 | 使用箇所 |
| -------------- | ---- | -------- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（デプロイ用） | web-cd.yml, backend-ci.yml |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID | web-cd.yml, backend-ci.yml |
| `DISCORD_WEBHOOK_URL` | Discord Webhook（デプロイ通知） | 未使用（UT-08-IMPL で導入予定。現行 web-cd.yml / backend-ci.yml には参照なし） |
| `CODECOV_TOKEN` | Codecov カバレッジアップロード | ci.yml |

### GitHub Variables（非機密設定値）

`Settings > Secrets and variables > Actions > Variables` で管理。

| 変数名 | 説明 | 例 |
| ------ | ---- | -- |
| `CLOUDFLARE_PAGES_PROJECT` | Cloudflare Pages プロジェクト名 | `ubm-hyogo-web` |
| `CLOUDFLARE_WORKERS_DOMAIN` | Workers 本番ドメイン | `api.ubm-hyogo.workers.dev` |
| `CLOUDFLARE_WORKERS_STAGING_DOMAIN` | Workers ステージングドメイン | `api-staging.ubm-hyogo.workers.dev` |

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

### モニタリング系 Secret（UT-08 連携）

UT-08 モニタリング/アラート設計で追加される Secret 群は **すべて 1Password Environments** で正本管理し、Cloudflare Secrets / GitHub Secrets 経由で配布する。コードへのハードコード禁止。

| Secret 名 | 用途 | 配布先 |
| --- | --- | --- |
| `SLACK_ALERT_WEBHOOK_URL` | アラート通知（Slack Incoming Webhook） | Cloudflare Secrets |
| `ALERT_EMAIL_FALLBACK_TO` | Slack 失敗時の Email fallback 宛先 | Cloudflare Secrets |
| `UPTIMEROBOT_API_KEY` | 外形監視 monitor 設定 | GitHub Secrets / 手動運用 |

詳細は `docs/30-workflows/completed-tasks/ut-08-monitoring-alert-design/outputs/phase-02/secret-additions.md` を参照。

---

## UT-27: GitHub Secrets / Variables 同期運用（2026-04-29）

UT-27 で導入する GitHub 側 CD 値は、**1Password Environments を正本、GitHub Secrets / Variables を派生コピー**として扱う。実値は runbook、Phase outputs、ログに転記しない。

### 配置先

| 名前 | 種別 | 配置先 | 正本 |
| --- | --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Secret | GitHub environment secrets (`staging` / `production`) | 1Password |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | GitHub repository secret | 1Password |
| `DISCORD_WEBHOOK_URL` | Secret | GitHub repository secret | 1Password |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | GitHub repository variable | UT-28 の Pages project 名 |

### 手動同期パターン

```bash
export TMP_CF_TOKEN_STG="$(op read 'op://UBM-Hyogo/Cloudflare/api_token_staging')"
export TMP_CF_TOKEN_PRD="$(op read 'op://UBM-Hyogo/Cloudflare/api_token_production')"
gh secret set CLOUDFLARE_API_TOKEN --env staging --body "$TMP_CF_TOKEN_STG"
gh secret set CLOUDFLARE_API_TOKEN --env production --body "$TMP_CF_TOKEN_PRD"
unset TMP_CF_TOKEN_STG TMP_CF_TOKEN_PRD
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

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-29 | 1.2.0 | UT-27: GitHub Secrets / Variables の 1Password 正本・派生コピー運用、一時環境変数 + unset パターン、Last-Updated メモ運用を追記 |
| 2026-04-09 | 1.0.0 | 初版作成（Cloudflare/GitHub 2層シークレット管理） |
| 2026-04-27 | 1.1.0 | UT-06 派生: `scripts/cf.sh` を 1Password / esbuild / mise 統合の canonical wrapper として明文化。`wrangler login` ローカル OAuth トークン保持禁止と `op://` 参照経由の動的注入を必須化 |
| 2026-04-27 | 1.1.0 | UT-08 モニタリング系 Secret セクション追加 |
| 2026-04-29 | 1.2.0 | UT-25: `GOOGLE_SERVICE_ACCOUNT_JSON` を apps/api Workers Secret 正本名として追加し、`scripts/cf.sh` + stdin 投入 / staging-first / rollback / legacy alias 境界を明文化 |
