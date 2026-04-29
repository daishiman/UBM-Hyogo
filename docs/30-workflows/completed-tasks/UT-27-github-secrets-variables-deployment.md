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
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync |

## 目的

`backend-ci.yml` / `web-cd.yml` が参照する Cloudflare 認証情報・Pages プロジェクト名・Discord Webhook URL を GitHub の Secrets / Variables に配置し、`dev` / `main` ブランチへの push をトリガーとした CD ワークフローを実稼働状態にする。CD 配線が完成しても秘匿値が GitHub 側に存在しなければ deploy ジョブ全体が空振りに終わるため、配置タスクを独立して未タスク化する。

## スコープ

### 含む
- リポジトリ Secrets の配置: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DISCORD_WEBHOOK_URL`
- リポジトリ Variables の配置: `CLOUDFLARE_PAGES_PROJECT`
- GitHub Environments（`staging` / `production`）と repository-level スコープのどちらに配置するかの確定と適用
- 配置値と 1Password Environments（正本）との同期手順整備（手動同期 or `op` サービスアカウント運用方針の決定）
- `dev` ブランチへの dummy push による動作確認（staging への deploy + Discord 通知が両方成功すること）

### 含まない
- ワークフローファイル自体の編集（UT-05 のスコープ）
- Cloudflare 側の API Token 発行手順そのもの（前提として UT-05 / 01b で完了想定）
- `apps/api` / `apps/web` のランタイムシークレット（Cloudflare Secrets 側）
- 本番デプロイの実行（UT-06 の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | UT-05 (CI/CD パイプライン実装) | 参照される Secrets / Variables のキー名・スコープが workflow 側で確定していること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | API Token 発行・Account ID 取得の前提作業 |
| 上流 | UT-28 (Cloudflare Pages プロジェクト作成) | `CLOUDFLARE_PAGES_PROJECT` の値はこのタスクで命名確定する |
| 下流 | UT-06 (本番デプロイ実行) | Secrets が揃わないと本番 deploy 自体が走らない |
| 下流 | UT-29 (CD 後スモーク) | スモーク URL の組み立てに `CLOUDFLARE_PAGES_PROJECT` を再利用する |

## 苦戦箇所・知見

**Environments スコープと repository スコープの違い**: `backend-ci.yml` の `deploy-staging` ジョブは `environment: name: staging` を宣言している。GitHub の挙動として `environment` 指定があるジョブからは「environment-scoped secret/variable」が優先解決され、同名の repository-scoped を上書きする。staging だけ別の Cloudflare Account で運用したい場合に repository-scoped に値を入れていると意図せず production 値が staging で参照されることがある。Environments 側に明示配置することを既定方針とすると事故が減る。

**`CLOUDFLARE_PAGES_PROJECT` を Secret ではなく Variable にする理由**: 機密ではなく単なるプロジェクト名で、`web-cd.yml` の中で `${{ vars.X }}-staging` のように suffix 連結に使用される。Secret にすると CI ログがマスクされて運用ログから値を追えなくなり、デバッグ性が著しく落ちる。GitHub の Variable は repository / environment / organization の3層を持つので、environment-scoped variable に置く案も含めて配置層を最初に決め切る。

**`if: secrets.X != ''` が GitHub では評価できない問題**: 既存 backend-ci.yml は通知ステップで `if: ${{ always() && secrets.DISCORD_WEBHOOK_URL != '' }}` のような書き方を採るが、GitHub Actions は job-level の `secrets` コンテキストを `if` で直接条件評価できないため意図通りに動かないことがある。実装では「常に通知ステップに入って env で受け、シェル側で空文字判定して early-return」する形に逃がす。本タスクでは Webhook URL 未設定時に CI が無音失敗しないことを動作確認項目に加える。

**1Password Environments を正本にする運用**: ローカルの開発者は 1Password Environments を引いて使うのが正本フローだが、GitHub Actions ランナーから 1Password を引くには `op` サービスアカウント or `1password/load-secrets-action` の導入が必要になる。MVP 段階では「1Password が正本・GitHub Secrets は手動同期コピー」を許容し、将来的に `op` 化する旨を運用ルールに残す。「同期されたか」の検証手段（ハッシュ照合 or Last-Updated メモ）を運用ドキュメントに残しておくと、値ローテーション時の事故を防げる。

**`CLOUDFLARE_API_TOKEN` のスコープ最小化**: User API Token を発行する際に Global API Key を流用するのは厳禁。最低限必要なスコープは `Account.Cloudflare Pages.Edit` / `Account.Workers Scripts.Edit` / `Account.D1.Edit` / `Account.Account Settings.Read` 程度。スコープを広げ過ぎると漏洩時の影響範囲が拡大する。Token 名にも用途・発行日を含め、ローテーション履歴を追えるようにする。

## 実行概要

- リポジトリ Secrets / Variables を `gh` CLI で配置する。例:
  - `gh secret set CLOUDFLARE_API_TOKEN --body "..."`
  - `gh secret set CLOUDFLARE_ACCOUNT_ID --body "..."`
  - `gh secret set DISCORD_WEBHOOK_URL --body "..."`
  - `gh variable set CLOUDFLARE_PAGES_PROJECT --body "ubm-hyogo-web"`
- GitHub Environments を新設（`staging` / `production`）し、必要に応じて環境別の値を上書き配置する
- 配置値の正本（1Password Environments）からのコピー手順を `doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync` 配下のドキュメントに追記する
- `dev` ブランチに空コミットを push し、`backend-ci.yml` / `web-cd.yml` の `deploy-staging` ジョブが緑になることを確認する
- Discord Webhook 未設定時の挙動として、通知ステップが警告のみで CI 全体は通ることを別途確認する

## 完了条件

- [ ] `CLOUDFLARE_API_TOKEN` が必要スコープ（Pages Edit / Workers Scripts Edit / D1 Edit / Account Read）で配置済み
- [ ] `CLOUDFLARE_ACCOUNT_ID` が配置済み
- [ ] `DISCORD_WEBHOOK_URL` が配置済み（運用判断で未設定の場合はその旨をドキュメント化）
- [ ] `CLOUDFLARE_PAGES_PROJECT` が Variable として配置済み（値は UT-28 で確定したプロジェクト名）
- [ ] GitHub Environments の `staging` / `production` が作成され、environment-scoped 値の配置方針が決定済み
- [ ] `dev` ブランチへの push で `backend-ci.yml` の `deploy-staging` が成功する
- [ ] `dev` ブランチへの push で `web-cd.yml` の `deploy-staging` が成功する
- [ ] Discord 通知が成功（または未設定時に CI が落ちない）ことが確認済み
- [ ] 1Password Environments と GitHub Secrets / Variables の同期手順が運用ドキュメントに記載済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .github/workflows/backend-ci.yml | 参照する Secrets / Variables キーの確認 |
| 必須 | .github/workflows/web-cd.yml | 参照する Secrets / Variables キーの確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | CI/CD 仕様（Secrets 要件）の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Secrets 配置マトリクスの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | ローカル正本（1Password）と GitHub の同期方針 |
| 参考 | docs/unassigned-task/UT-05-cicd-pipeline-implementation.md | CI/CD ワークフロー本体タスクとの境界確認 |
| 参考 | docs/unassigned-task/UT-28-cloudflare-pages-projects-creation.md | `CLOUDFLARE_PAGES_PROJECT` の値確定タスク |
