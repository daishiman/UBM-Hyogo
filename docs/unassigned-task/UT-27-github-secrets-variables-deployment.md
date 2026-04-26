# UT-27: GitHub Secrets / Variables 配置実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-27 |
| タスク名 | GitHub Secrets / Variables 配置実行 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #47 |
| 検出元 | docs/04-serial-cicd-secrets-and-environment-sync の phase-12 |

## 目的

`backend-ci.yml` / `web-cd.yml` が参照する Cloudflare 認証情報・Pages プロジェクト名・Discord Webhook URL を GitHub の Secrets / Variables に配置し、`dev` / `main` ブランチへの push をトリガーとした CD ワークフローを実稼働状態にする。

## スコープ

### 含む

- リポジトリ Secrets への登録: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK_URL`
- リポジトリ Variables への登録: `CLOUDFLARE_PAGES_PROJECT_NAME`（staging / production 用の値を確定）
- 登録後に `dev` / `main` push で CD ワークフローが正常起動することの確認
- 登録手順の runbook 化（1Password との対応関係を明示）
- GitHub Actions の `workflow_dispatch` で手動トリガーし、Secrets 参照が正常か検証

### 含まない

- Cloudflare API Token の新規発行（1Password 上で管理済みのものを使用）
- Cloudflare Pages プロジェクト自体の作成（UT-28 のスコープ）
- CD ワークフロー YAML の修正（04-serial で整備済みのものをそのまま使用）
- Discord Webhook URL の新規発行

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | CD workflow YAML が確定・マージ済みであること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare Account ID / API Token が発行済みであること |
| 下流 | UT-28（Cloudflare Pages プロジェクト作成） | Pages プロジェクト名が確定しないと Variables の値が定まらない |
| 下流 | UT-29（スモーク／ヘルスチェック自動化） | Secrets 配置が完了しないと CD ジョブ自体が動かない |
| 下流 | UT-22（D1 migration SQL 実体記述） | CI から `wrangler` を実行するために `CLOUDFLARE_API_TOKEN` が必要 |

## 着手タイミング

> **着手前提**: 04-serial がマージ済みかつ Cloudflare API Token / Account ID が 1Password に保管済みであること。

| 条件 | 理由 |
| --- | --- |
| 04-serial マージ済み | workflow YAML が main に存在しないと Secrets を参照するジョブが存在しない |
| 01b 完了 | Cloudflare 認証情報が発行済みでないと登録値が確定しない |
| UT-28 着手開始後 | Pages プロジェクト名が決まってから Variables を登録する方が望ましい（同時並行も可） |

## 苦戦箇所・知見

**GitHub Secrets は登録後に値を参照できない**
GitHub の仕様上、一度登録した Secret の値は UI / API で読み返すことができない。登録前に 1Password の正本値をコピーし、登録後は `echo "***"` でマスクされた出力しか得られない。誤登録した場合は上書き登録（同名 Secret を再 PUT）で対応する。

**Variables と Secrets の使い分け**
`CLOUDFLARE_PAGES_PROJECT_NAME` は機密情報ではないため Variables（平文）として登録する。`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `DISCORD_WEBHOOK_URL` は機密情報なので Secrets に登録する。Variables は GitHub UI でも値が可視状態になるため、誤って Token 類を Variables に登録しないよう注意が必要。

**Environment-scoped Secrets の必要性**
staging 用と production 用で異なる `CLOUDFLARE_API_TOKEN` を使う場合は、GitHub Environments（`staging` / `production`）に紐づいた Environment Secrets を利用する。同一 Token を両環境で共用する場合はリポジトリ Secrets 1 つで足りる。04-serial の workflow 設計に合わせて判断すること。

**`gh secret set` コマンドによる一括登録**
GitHub CLI を使うと `gh secret set SECRET_NAME --body "value"` で登録できる。複数 Secrets を一括で登録する場合は `gh secret set -f .env.secrets` 形式も使用可能だが、`.env.secrets` ファイルをリポジトリにコミットしないよう注意する（`.gitignore` に追加する）。

**Discord Webhook URL のローテーション**
Discord の Webhook URL は チャンネル設定から再発行可能。漏洩した場合は即座にローテーションし、GitHub Secret を上書き登録する。

## 実行概要

1. 1Password から `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK_URL` の値を取得
2. `gh secret set` または GitHub UI から リポジトリ Secrets に登録
3. UT-28 と連携して `CLOUDFLARE_PAGES_PROJECT_NAME` の値を確定し、Variables に登録
4. `dev` ブランチへダミーコミットを push し、CD ワークフローが起動して Secrets を正常に参照できることを確認
5. 登録手順を runbook（`docs/04-serial-cicd-secrets-and-environment-sync/` 配下）に記録

## 完了条件

- [ ] `CLOUDFLARE_API_TOKEN` がリポジトリ Secrets に登録済み
- [ ] `CLOUDFLARE_ACCOUNT_ID` がリポジトリ Secrets に登録済み
- [ ] `DISCORD_WEBHOOK_URL` がリポジトリ Secrets に登録済み
- [ ] `CLOUDFLARE_PAGES_PROJECT_NAME` がリポジトリ Variables に登録済み（staging / production の値が確定）
- [ ] `dev` push で `web-cd.yml` が起動し、Secrets 参照エラーなく実行されることを確認
- [ ] `main` push で `backend-ci.yml` が起動し、Secrets 参照エラーなく実行されることを確認
- [ ] 登録手順（使用した `gh` コマンドと 1Password 対応）が runbook に記録済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md | 検出原典 |
| 必須 | .github/workflows/backend-ci.yml | 参照 Secrets / Variables の一覧確認 |
| 必須 | .github/workflows/web-cd.yml | 参照 Secrets / Variables の一覧確認 |
| 参考 | https://docs.github.com/en/actions/security-guides/encrypted-secrets | GitHub Secrets 公式 |
| 参考 | https://docs.github.com/en/actions/learn-github-actions/variables | GitHub Variables 公式 |
| 参考 | https://cli.github.com/manual/gh_secret_set | gh secret set コマンド |
