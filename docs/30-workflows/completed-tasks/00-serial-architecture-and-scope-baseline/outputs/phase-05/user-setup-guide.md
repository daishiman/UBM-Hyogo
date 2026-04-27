# ユーザーセットアップガイド
# 手動で設定が必要な項目と手順

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| 作成日 | 2026-04-23 |
| 参照元 | outputs/phase-02/canonical-baseline.md セクション4 |

このドキュメントは **あなた（開発者）が手動で行う必要がある設定作業** をまとめたものです。
実値（APIキー・トークン等）はここには記載しません。取得先と設定先のみを示します。

---

## 設定作業の全体像

```
[1] Cloudflare アカウント設定
      ├─ Pages プロジェクト作成 (apps/web 用)
      ├─ Workers プロジェクト作成 (apps/api 用)
      ├─ D1 データベース作成
      └─ Cloudflare Secrets に実値を登録

[2] GitHub リポジトリ設定
      ├─ Secrets に CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID を登録
      └─ Variables にドメイン名・プロジェクト名を登録

[3] 1Password Environments 設定
      └─ ローカル開発用の全シークレットを登録

[4] Google Sheets 設定
      └─ Service Account を作成し、Sheets へのアクセス権を付与
```

---

## 1. Cloudflare アカウント設定

### 1-1. Cloudflare アカウント確認

- https://dash.cloudflare.com にログイン済みであること
- アカウント ID を控えておく（後で GitHub Secrets に登録する）

### 1-2. Cloudflare Pages プロジェクト作成 (apps/web 用)

| 項目 | 設定値 |
| --- | --- |
| プロジェクト名 | `ubm-hyogo-web`（任意、後で GitHub Variables に登録） |
| 本番ブランチ | `main` |
| staging ブランチ | `dev` |
| ビルドコマンド | `pnpm build`（Wave 1 実装後に設定） |
| 出力ディレクトリ | `.next`（Wave 1 実装後に設定） |

手順:
1. Cloudflare ダッシュボード → Workers & Pages → Create
2. Pages を選択 → GitHub リポジトリを連携
3. プロジェクト名と本番ブランチ (`main`) を設定
4. **staging 環境**: Settings → Builds & deployments → Add preview branch → `dev`

### 1-3. Cloudflare Workers プロジェクト作成 (apps/api 用)

| 項目 | 設定値 |
| --- | --- |
| Worker 名 | `ubm-hyogo-api`（任意、後で GitHub Variables に登録） |

手順:
1. Cloudflare ダッシュボード → Workers & Pages → Create → Worker
2. Worker 名を設定（デプロイは Wave 1 の CI/CD 設定後）

### 1-4. Cloudflare D1 データベース作成

| 項目 | 設定値 |
| --- | --- |
| DB 名 | `ubm-hyogo-db`（任意） |
| WAL mode | 有効（Wave 1 の wrangler.toml で設定） |

手順:
```sh
# Wrangler CLI を使用する場合
npx wrangler d1 create ubm-hyogo-db
```
または Cloudflare ダッシュボード → D1 → Create database

作成後、**Database ID** を控えておく（wrangler.toml に記載する）。

### 1-5. Cloudflare Secrets に実値を登録

以下のシークレットを登録する。**本番環境 (production) と staging 環境 (preview) の両方に設定すること。**

| シークレット名 | 取得元 | 設定先 |
| --- | --- | --- |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Cloudflare Pages / Workers の Secrets |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Cloudflare Pages / Workers の Secrets |
| `DATABASE_URL` | Cloudflare D1 ダッシュボードで確認 | Cloudflare Workers の Secrets |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` | Google Cloud Console（手順4参照） | Cloudflare Workers の Secrets |

登録方法（Wrangler CLI）:
```sh
# Workers への Secrets 登録
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put DATABASE_URL
npx wrangler secret put GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY
```

または Cloudflare ダッシュボード → Workers & Pages → プロジェクト選択 → Settings → Variables and Secrets

---

## 2. GitHub リポジトリ設定

### 2-1. GitHub Secrets の登録

Settings → Secrets and variables → Actions → New repository secret

| シークレット名 | 取得元 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens （「Edit Cloudflare Workers」テンプレートを使用） | CI/CD でのデプロイ認証 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare ダッシュボード右サイドバー「Account ID」 | CI/CD でのデプロイ対象アカウント指定 |

### 2-2. GitHub Variables の登録

Settings → Secrets and variables → Actions → Variables → New repository variable

| 変数名 | 設定値の例 | 用途 |
| --- | --- | --- |
| `CLOUDFLARE_PROJECT_NAME_WEB` | `ubm-hyogo-web` | Pages デプロイ先プロジェクト名 |
| `CLOUDFLARE_PROJECT_NAME_API` | `ubm-hyogo-api` | Workers デプロイ先 Worker 名 |
| `PRODUCTION_URL` | `https://ubm-hyogo.pages.dev` | 本番 URL（非機密） |

### 2-3. ブランチ保護ルールの設定

`main` ブランチ:
- Settings → Branches → Add branch protection rule
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Required approvals: **2**
- ✅ Require status checks to pass before merging（CI 設定後に追加）
- ✅ Do not allow bypassing the above settings

`dev` ブランチ:
- Branch name pattern: `dev`
- ✅ Require a pull request before merging
- ✅ Required approvals: **1**
- ✅ Do not allow force pushes

---

## 3. 1Password Environments 設定

**目的**: ローカル開発で使用するシークレットの正本を 1Password に置き、平文 `.env` ファイルをリポジトリにコミットしないようにする。

### 3-1. 1Password CLI のインストール

```sh
# macOS
brew install 1password-cli
op --version  # 動作確認
```

### 3-2. Vault / Item の作成

1Password アプリ（または Web）で以下を作成:

| 操作 | 設定値 |
| --- | --- |
| Vault 名 | `ubm-hyogo-dev`（任意） |
| Item 名 | `ubm-hyogo-local-env` |

Item に以下のフィールドを追加:

| フィールド名 | 値 |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API キーの実値 |
| `ANTHROPIC_API_KEY` | Anthropic API キーの実値 |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークンの実値 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID の実値 |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY` | Service Account JSON の内容 |
| `DATABASE_URL` | D1 のローカル接続文字列（Wave 1 の wrangler.toml 確定後に追記） |

### 3-3. ローカル開発での使用方法

Wave 1 実装後は以下のように使用する（参考）:
```sh
# op run コマンドで環境変数として注入してコマンドを実行
op run --env-file=".env.op.template" -- pnpm dev
```

---

## 4. Google Sheets 設定

### 4-1. Google Cloud Console で Service Account を作成

1. https://console.cloud.google.com → プロジェクト選択（または新規作成）
2. APIs & Services → Credentials → Create credentials → Service account
3. Service account 名: `ubm-hyogo-sheets-reader`（任意）
4. 作成後、Keys タブ → Add key → JSON → キーをダウンロード

**注意**: ダウンロードした JSON ファイルは 1Password に保存し、リポジトリには絶対にコミットしないこと。

### 4-2. Google Sheets API を有効化

APIs & Services → Library → 「Google Sheets API」を検索 → Enable

### 4-3. 対象 Spreadsheet へのアクセス権付与

1. 対象の Google Spreadsheet を開く
2. 右上の「共有」ボタン
3. Service Account のメールアドレス（`xxx@xxx.iam.gserviceaccount.com`）を追加
4. 権限: **閲覧者**（入力源としてのみ使用するため）

---

## 設定完了チェックリスト

### Cloudflare
- [ ] Cloudflare アカウントにログイン済み
- [ ] Pages プロジェクトを作成した（`main` ブランチ = 本番、`dev` ブランチ = staging）
- [ ] Workers プロジェクトを作成した
- [ ] D1 データベースを作成し、Database ID を控えた
- [ ] Cloudflare Secrets に4つのシークレットを登録した（本番 + staging）

### GitHub
- [ ] `CLOUDFLARE_API_TOKEN` を GitHub Secrets に登録した
- [ ] `CLOUDFLARE_ACCOUNT_ID` を GitHub Secrets に登録した
- [ ] GitHub Variables にプロジェクト名・URL を登録した
- [ ] `main` ブランチ保護ルール（2名レビュー / force push 禁止）を設定した
- [ ] `dev` ブランチ保護ルール（1名レビュー / force push 禁止）を設定した

### 1Password
- [ ] 1Password CLI をインストールした
- [ ] Vault / Item を作成し、全シークレットを登録した

### Google Sheets
- [ ] Google Cloud プロジェクトを作成/選択した
- [ ] Google Sheets API を有効化した
- [ ] Service Account を作成し、JSON キーを 1Password に保存した
- [ ] 対象 Spreadsheet に Service Account のメールアドレスを共有（閲覧者）した

---

## 参照ドキュメント

| ドキュメント | 内容 |
| --- | --- |
| `outputs/phase-02/canonical-baseline.md` セクション4 | シークレット配置マトリクス（どこに何を置くかの全体像） |
| `outputs/phase-02/decision-log.md` DL-06 | シークレット管理方針の採用理由 |
| `outputs/phase-02/canonical-baseline.md` セクション2 | ブランチ/環境対応表 |
