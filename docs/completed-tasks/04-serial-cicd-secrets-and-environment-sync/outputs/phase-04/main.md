# Phase 4 成果物: 事前検証手順書

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | cicd-secrets-and-environment-sync |
| Phase 番号 | 4 / 13 |
| Phase 名称 | 事前検証手順 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (セットアップ実行) |
| 状態 | completed |

---

## 1. 実行前チェックリスト

### 1-1. 既存ワークフローの確認

| # | 確認項目 | 確認方法 | 期待状態 |
| --- | --- | --- | --- |
| 1 | `.github/workflows/` に既存の CI/CD ファイルがあるか | `ls .github/workflows/` | ファイル一覧が確認できる |
| 2 | 既存ワークフローのトリガーブランチが `dev` / `main` と一致するか | ファイル内の `branches:` を目視確認 | `dev` → staging, `main` → production に対応 |
| 3 | `apps/web` と `apps/api` が同一ワークフローに混在していないか | ワークフロー内の `working-directory` または `path` フィルタを確認 | 分離されている (または未作成) |
| 4 | `ci.yml` / `web-cd.yml` / `backend-deploy.yml` の命名が計画と一致するか | `ls .github/workflows/` | 計画通りのファイル名が存在する (または未作成で新規作成予定) |

### 1-2. 現在のシークレット配置の確認

| # | 確認項目 | 確認方法 |
| --- | --- | --- |
| 1 | GitHub Secrets に登録済みの変数一覧 | `gh secret list` |
| 2 | GitHub Variables に登録済みの変数一覧 | `gh variable list` |
| 3 | Cloudflare Workers (web) に登録済みのシークレット | `wrangler secret list --name <WEB_WORKER_NAME>` |
| 4 | Cloudflare Workers (api) に登録済みのシークレット | `wrangler secret list --name <API_WORKER_NAME>` |
| 5 | GitHub Environments (`dev` / `main`) の存在確認 | `gh api repos/{owner}/{repo}/environments` |

### 1-3. ブランチ設定の確認

| # | 確認項目 | 確認方法 | 期待状態 |
| --- | --- | --- | --- |
| 1 | `dev` ブランチが存在するか | `git branch -a \| grep dev` | `remotes/origin/dev` が存在する |
| 2 | `main` ブランチが保護ルールを持つか | `gh api repos/{owner}/{repo}/branches/main/protection` | 保護ルールが設定済み |
| 3 | `feature/*` → `dev` の PR フローが機能するか | GitHub ブランチ設定を目視確認 | デフォルトブランチが `main` で `dev` が staging に対応 |

---

## 2. 実行環境の前提条件

### 2-1. GitHub Actions 権限

| 権限 | 要件 | 確認方法 |
| --- | --- | --- |
| Secrets の読み書き | リポジトリの Admin または Secrets 管理権限 | `gh auth status` でログインアカウントを確認 |
| Environments の作成 | リポジトリの Admin 権限 | GitHub リポジトリ設定画面で確認 |
| Variables の読み書き | リポジトリの Admin または Variables 管理権限 | `gh variable list` が実行できること |
| Actions ワークフローの作成・編集 | `.github/workflows/` への書き込み権限 | `git push` が通ること |

### 2-2. Cloudflare API 権限

| 権限 | 要件 | 確認方法 |
| --- | --- | --- |
| Workers のデプロイ | `Edit Cloudflare Workers` 権限を持つ API トークン | `wrangler whoami` |
| Secrets の設定 | Workers のシークレット管理権限 | `wrangler secret list` が実行できること |
| D1 アクセス | D1 データベースの読み書き権限 | `wrangler d1 list` が実行できること |

### 2-3. 1Password Environments の設定

| 前提条件 | 確認方法 |
| --- | --- |
| 1Password CLI (`op`) がインストール済み | `op --version` |
| 対象の Vault にアクセス権限がある | `op vault list` |
| `UBM-Hyogo` 用の Vault または Item が存在する | `op item list --vault <VAULT_NAME>` |

---

## 3. 検証コマンド一覧と期待出力

### 3-1. GitHub 関連

```bash
# ログイン状態の確認
gh auth status
# 期待出力: "Logged in to github.com as <username>"

# GitHub Secrets の一覧取得
gh secret list
# 期待出力: CLOUDFLARE_API_TOKEN と CLOUDFLARE_ACCOUNT_ID が存在する (または空欄で新規設定が必要)

# GitHub Variables の一覧取得
gh variable list
# 期待出力: CLOUDFLARE_ACCOUNT_ID 等の非機密設定が存在する (または空欄)

# GitHub Environments の確認
gh api repos/{owner}/{repo}/environments
# 期待出力: "dev" と "main" の2環境が存在する (または空で新規作成が必要)

# 既存ワークフローファイルの一覧
ls .github/workflows/
# 期待出力: ci.yml / web-cd.yml / backend-deploy.yml が存在する (または未作成)

# ワークフロー内のブランチトリガー確認
rg -n "branches:" .github/workflows/
# 期待出力: dev / main が適切なワークフローに対応している
```

### 3-2. Cloudflare 関連

```bash
# Wrangler 認証状態の確認
wrangler whoami
# 期待出力: "You are logged in with an API Token" + アカウント情報

# Web Worker のシークレット一覧
wrangler secret list --name <WEB_WORKER_NAME>
# 期待出力: GOOGLE_CLIENT_SECRET が存在する (または空で新規設定が必要)

# API Worker のシークレット一覧
wrangler secret list --name <API_WORKER_NAME>
# 期待出力: GOOGLE_CLIENT_SECRET / GOOGLE_SERVICE_ACCOUNT_JSON が存在する (または空)

# D1 データベースの確認
wrangler d1 list
# 期待出力: UBM Hyogo 用の D1 データベースが存在する
```

### 3-3. コードベース内のシークレット参照確認

```bash
# ワークフロー内のシークレット参照をすべて抽出
rg -n "secrets\." .github/workflows/
# 期待出力: runtime secret (GOOGLE_*) が deploy ワークフローに混入していないこと

# runtime secret が web/api コードに平文でハードコードされていないか確認
rg -rn "GOOGLE_CLIENT_SECRET|GOOGLE_SERVICE_ACCOUNT_JSON" apps/ --include="*.ts" --include="*.js"
# 期待出力: 環境変数参照 (process.env.*) のみで実値は存在しない

# .env ファイルが gitignore されているか確認
cat .gitignore | grep ".env"
# 期待出力: ".env" または ".env*" が含まれる

# 誤って .env がコミットされていないか確認
git log --oneline --all -- "*.env" ".env*"
# 期待出力: 何も出力されない (コミット履歴なし)
```

### 3-4. ブランチ戦略の確認

```bash
# リモートブランチの一覧
git branch -a
# 期待出力: remotes/origin/dev と remotes/origin/main が存在する

# dev ブランチの最新コミットが main より進んでいるか
git log --oneline main..origin/dev
# 期待出力: staging 用の追加コミットが存在する (または同一コミット)

# main ブランチの保護ルール確認
gh api repos/{owner}/{repo}/branches/main/protection
# 期待出力: required_status_checks 等の保護設定が存在する
```

---

## 4. シークレット配置の確認手順

> 注意: 以下のコマンドはシークレットの存在確認のみを行います。実値は出力されません。

### 4-1. シークレット配置マトリクスの確認

| 変数名 | 置き場所 | 確認コマンド |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | `gh secret list \| grep CLOUDFLARE_API_TOKEN` |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | `gh secret list \| grep CLOUDFLARE_ACCOUNT_ID` |
| `GOOGLE_CLIENT_SECRET` | Cloudflare Secrets (web + api) + 1Password | `wrangler secret list --name <WORKER_NAME> \| grep GOOGLE_CLIENT_SECRET` |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Cloudflare Secrets (api) + 1Password | `wrangler secret list --name <API_WORKER_NAME> \| grep GOOGLE_SERVICE_ACCOUNT_JSON` |

### 4-2. 誤配置のチェック

```bash
# GOOGLE_* が GitHub Secrets に誤って登録されていないか
gh secret list | grep "GOOGLE_"
# 期待出力: 何も出力されない (runtime secret は GitHub Secrets に置かない)

# CLOUDFLARE_API_TOKEN が Cloudflare Secrets に誤って登録されていないか
wrangler secret list --name <WEB_WORKER_NAME> | grep "CLOUDFLARE_API_TOKEN"
# 期待出力: 何も出力されない (deploy secret は Cloudflare Secrets に置かない)
```

---

## 5. 事前検証の PASS / FAIL 判定基準

| チェック項目 | PASS 条件 | FAIL 時の対処 |
| --- | --- | --- |
| GitHub 認証 | `gh auth status` が認証済みを返す | `gh auth login` で再認証 |
| Cloudflare 認証 | `wrangler whoami` が API Token 認証を返す | `wrangler login` または CLOUDFLARE_API_TOKEN 環境変数を設定 |
| .env がコミット履歴にない | `git log -- "*.env"` が空を返す | git history から除去 (BFG 等を使用) |
| runtime secret が GitHub Secrets にない | `gh secret list \| grep "GOOGLE_"` が空を返す | 誤登録された secret を削除 |
| deploy secret が Cloudflare Secrets にない | `wrangler secret list \| grep "CLOUDFLARE_"` が空を返す | 誤登録された secret を削除 |
| `dev` ブランチが存在する | `git branch -a \| grep "origin/dev"` にヒット | `git push origin main:dev` で dev ブランチを作成 |
| ワークフローのブランチトリガーが正しい | `rg "branches:" .github/workflows/` の出力がブランチ戦略と一致 | ワークフロー YAML を修正 |

**全項目が PASS であれば Phase 5 に進む。1件でも FAIL があれば対処後に再検証する。**

---

## 6. Phase 5 (セットアップ実行) への引き継ぎ事項

### 引き継ぎ情報

| 項目 | 内容 |
| --- | --- |
| 登録が必要な GitHub Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| 登録が必要な Cloudflare Secrets (web) | `GOOGLE_CLIENT_SECRET` |
| 登録が必要な Cloudflare Secrets (api) | `GOOGLE_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON` |
| 作成が必要な GitHub Environments | `dev` (staging), `main` (production) |
| 作成が必要なワークフローファイル | `ci.yml`, `web-cd.yml`, `backend-deploy.yml` |
| 1Password への記録対象 | `GOOGLE_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON` の実値 |

### ブロック条件

- 本 Phase の全チェック項目が PASS でなければ Phase 5 に進まない
- 特に `.env` のコミット履歴混入は Phase 5 開始前に必ず解消する

### Open Questions

| # | 質問 | 確認先 |
| --- | --- | --- |
| Q1 | Web Worker の本番名称は何か (wrangler.toml の `name` 値) | `apps/web/wrangler.toml` |
| Q2 | API Worker の本番名称は何か | `apps/api/wrangler.toml` |
| Q3 | dev 環境用の Cloudflare Worker は staging 用に別名か同名か | アーキテクチャ仕様書を参照 |
