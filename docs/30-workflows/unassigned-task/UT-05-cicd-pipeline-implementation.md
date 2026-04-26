# UT-05: CI/CD パイプライン実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-05 |
| タスク名 | CI/CD パイプライン実装 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | あり |
| 組み込み先 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync |

## 目的

GitHub Actions を使用して `feature→dev→main` のブランチプッシュ時に自動テスト・自動デプロイを行うパイプラインを構築する。UBM 兵庫支部会システムの継続的デリバリーを実現し、手動デプロイのミスや環境差異を排除する。

## スコープ

### 含む
- CI ワークフロー（`ci.yml`）: PR・プッシュ時の自動テスト（lint / typecheck / unit test）
- Web CD ワークフロー（`web-cd.yml`）: Cloudflare Pages への自動デプロイ
- Backend deploy ワークフロー: Cloudflare Workers への自動デプロイ
- `dev` ブランチ → dev 環境、`main` ブランチ → 本番環境のトリガー設定
- GitHub Secrets への Cloudflare API Token / Account ID の配置
- D1 マイグレーション自動適用のワークフロー組み込み

### 含まない
- 通知基盤の常設導入（UT-07 のスコープ）
- アプリケーションコードの実装
- 本番データ投入
- モニタリング・アラート設定（UT-08 のスコープ）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02-serial-monorepo-runtime-foundation | monorepo 構造・パッケージスクリプト（lint/test/build）が確立していることが前提 |
| 上流 | 01a-parallel-github-and-branch-governance | GitHub リポジトリ・ブランチ保護ルールが設定されていること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウント・Pages/Workers プロジェクトが作成されていること |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | シークレット配置マトリクス・ワークフロートポロジーの設計が完了していること |
| 下流 | UT-06 (本番デプロイ実行) | CI/CD パイプライン完成後に本番への初回デプロイが実施できる |
| 下流 | 05b-parallel-smoke-readiness-and-handoff | CI/CD の readiness が最終ゲートチェックの対象になる |

## 苦戦箇所・知見

**web と api の deploy path の分離**: Cloudflare Pages（フロントエンド）と Cloudflare Workers（バックエンド）は異なるデプロイ機構を持つ。Pages は `wrangler pages deploy`、Workers は `wrangler deploy` を使用し、それぞれに異なる API Token スコープが必要になる場合がある。一つのトークンで両方をカバーできるか事前に確認する。

**monorepo でのジョブフィルタリング**: `apps/web` のみ変更された場合に backend deploy をスキップするなど、変更パスに基づいたジョブの条件実行（`paths` フィルター）を設計しないと無駄な deploy が頻発する。`paths-filter` アクションの活用を検討する。

**D1 マイグレーションの自動適用タイミング**: deploy ジョブと D1 migration apply ジョブの順序を誤るとアプリがスキーマ不一致状態で起動してしまう。migration → deploy の順序を明示的に依存関係として定義する必要がある。

**1Password Environments との連携**: ローカルの正本シークレットは 1Password Environments で管理するが、GitHub Actions には直接連携できない。`op run` を CI 環境で使う場合のサービスアカウント設定か、GitHub Secrets への手動同期手順を明確にしておく。

**ブランチ名の揺れ**: `deployment-branch-strategy.md` で `dev` ブランチが正式名称とされているが、外部ドキュメントで揺れが見られる場合がある。ワークフローファイル内のブランチ名は正本に合わせて統一する。

## 実行概要

- `04-serial-cicd-secrets-and-environment-sync` の Phase 2 成果物（`workflow-topology.md` / `secrets-placement-matrix.md`）を基に、GitHub Actions ワークフローファイルのドラフトを作成する
- `ci.yml` に lint / typecheck / vitest の実行ステップを定義し、PR 作成時および `dev` / `main` ブランチへのプッシュ時にトリガーされるよう設定する
- `web-cd.yml` に Cloudflare Pages の `wrangler pages deploy` ステップを定義し、`dev` プッシュ時は dev 環境、`main` プッシュ時は本番環境にデプロイされるよう環境変数で切り替える
- backend deploy ワークフローに Cloudflare Workers の `wrangler deploy` ステップと D1 マイグレーション適用（`wrangler d1 migrations apply`）を順序付きで定義する
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を GitHub Secrets に配置し、ワークフローから参照できることを確認する

## 完了条件

- [ ] `ci.yml` が作成され、PR / push 時に lint・typecheck・test が自動実行される
- [ ] Web CD ワークフローが作成され、`dev` / `main` ブランチへのプッシュで Cloudflare Pages へ自動デプロイされる
- [ ] Backend deploy ワークフローが作成され、D1 migration → Workers deploy の順序が保証されている
- [ ] `dev` ブランチは dev 環境、`main` ブランチは本番環境にデプロイされることが確認されている
- [ ] GitHub Secrets に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` が設定されている
- [ ] CI が失敗した場合にデプロイがブロックされることが確認されている
- [ ] `04-serial-cicd-secrets-and-environment-sync` の AC-1〜AC-5 との整合性が確認されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | CI/CD タスクの目的・AC・スコープ確認 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | CI/CD 方針・ワークフロー設計の正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md | dev / main ブランチマッピングの正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare / GitHub Secrets / 1Password の配置方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | ローカルシークレットの正本 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | 未タスク検出元（UT-05 の出典） |
