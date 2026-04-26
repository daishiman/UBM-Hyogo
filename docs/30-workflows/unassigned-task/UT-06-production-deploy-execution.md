# UT-06: 本番デプロイ実行

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-06 |
| タスク名 | 本番デプロイ実行 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

Cloudflare Pages / Workers / D1 の本番環境への初回デプロイを実施し、動作確認を行う。`05b-parallel-smoke-readiness-and-handoff` では一部の readiness チェックが対応予定だが、本番への実際のデプロイ実行は独立したタスクとして実施する必要がある。

## スコープ

### 含む
- Cloudflare Pages（`apps/web`）の本番環境への初回デプロイ実行
- Cloudflare Workers（`apps/api`）の本番環境への初回デプロイ実行
- Cloudflare D1 本番データベースへのマイグレーション初回適用
- デプロイ後の動作確認（smoke test）：ページアクセス・API レスポンス確認
- 本番 URL の確認と記録
- デプロイ成功／失敗時の判定基準の確認

### 含まない
- 本番データ（実ユーザーデータ）の投入
- Google Sheets から D1 への初回データ同期（UT-09 のスコープ）
- 継続的なモニタリング設定（UT-08 のスコープ）
- CI/CD パイプラインの構築（UT-05 のスコープ）
- アプリケーション機能の実装

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02-serial-monorepo-runtime-foundation | ビルド可能な monorepo 環境が整備されていること |
| 上流 | 03-serial-data-source-and-storage-contract | D1 スキーマ設計（UT-04）を含む本番 D1 の準備が完了していること |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | 本番デプロイに必要な Secrets / 環境変数の配置が完了していること |
| 上流 | UT-04 (D1 データスキーマ設計) | 本番 D1 にマイグレーションを適用するためにスキーマが確定していること |
| 上流 | UT-05 (CI/CD パイプライン実装) | 推奨だが必須ではない。CI/CD 未完の場合は手動デプロイで初回実施する |
| 上流 | 05b-parallel-smoke-readiness-and-handoff | readiness checklist が PASS であること |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本番 D1 が稼働していることが同期ジョブのテスト前提 |
| 下流 | 実装フェーズ全体 | 本番環境が稼働していることが実装フェーズの前提 |

## 着手タイミング

> **着手前提**: `02-serial-monorepo-runtime-foundation` と `03-serial-data-source-and-storage-contract`（UT-04 含む）が完了し、`04-serial-cicd-secrets-and-environment-sync` の Secrets 配置も完了してから着手すること。Wave 1 の最後に位置する。

| 条件 | 理由 |
| --- | --- |
| 02-serial-monorepo-runtime-foundation 完了 | ビルド可能な monorepo 環境が整備されていること |
| 03-serial-data-source-and-storage-contract 完了 | 本番 D1 スキーマ（UT-04）が確定・適用済みであること |
| 04-serial-cicd-secrets-and-environment-sync 完了 | 本番用 Secrets・環境変数が Cloudflare に配置済みであること |
| 05b-parallel-smoke-readiness-and-handoff PASS | readiness checklist が通過していること |

## 苦戦箇所・知見

**初回デプロイと既存デプロイの挙動差異**: Cloudflare Pages は初回デプロイ時にプロジェクト名・カスタムドメイン設定が確定する。2回目以降と手順が異なるため、初回は `wrangler pages project create` の実行が必要か確認する。

**D1 マイグレーションの本番適用リスク**: `wrangler d1 migrations apply --env production` は本番データベースを直接変更するため、不可逆な操作となりうる。実行前に D1 バックアップ（`wrangler d1 export`）の取得を必須手順とする。

**Cloudflare Workers の初回デプロイ後の KV / D1 バインディング確認**: wrangler.toml に定義したバインディングが本番環境で正しく解決されているかを、デプロイ後に Workers のログで確認する必要がある。特に `[[d1_databases]]` の `database_id` が dev / main で異なることに注意する。

**Pages のビルドキャッシュとデプロイ順序**: `apps/web` のビルドアーティファクトが `apps/api` の型定義に依存している場合、api の型生成を先にビルドしてから web のビルドを行う順序を守る必要がある。

**本番 URL の確定とドメイン設定**: Cloudflare Pages はデフォルトで `*.pages.dev` ドメインが割り当てられる。カスタムドメインを使用する場合は DNS 設定の伝播に時間がかかるため、smoke test のタイミングを適切に設定する。

**ロールバック手順の事前確認**: 本番デプロイ失敗時にすぐにロールバックできるよう、`wrangler rollback`（Pages）や 前バージョンへの `wrangler deploy` を事前に確認しておく。D1 のロールバックは D1 バックアップ（export した SQL）から手動でリストアする手順となる。

## 実行概要

- 事前確認として `05b-parallel-smoke-readiness-and-handoff` の readiness checklist が PASS であることと、D1 本番バックアップ取得（`wrangler d1 export --env production`）を実施する
- `wrangler d1 migrations apply --env production` を実行し、本番 D1 データベースに初期スキーマを適用する。適用結果（マイグレーション履歴）を記録する
- `wrangler pages deploy dist/ --project-name <project-name> --env production` を実行し、Cloudflare Pages（`apps/web`）を本番環境にデプロイする
- `wrangler deploy --env production` を実行し、Cloudflare Workers（`apps/api`）を本番環境にデプロイする
- デプロイ完了後、本番 URL へのアクセス・API の `/health` エンドポイントへのレスポンス確認・D1 バインディングの疎通確認を smoke test として実施し、結果を記録する

## 完了条件

- [ ] Cloudflare Pages（`apps/web`）が本番 URL でアクセス可能である
- [ ] Cloudflare Workers（`apps/api`）が本番環境でレスポンスを返す
- [ ] D1 本番データベースへのマイグレーションが正常に適用されている（マイグレーション履歴に記録されている）
- [ ] Workers から D1 へのバインディングが本番環境で疎通している
- [ ] デプロイ後の smoke test（ページアクセス・API レスポンス）が PASS している
- [ ] デプロイ実施記録（実施日時・デプロイ者・バージョン・結果）が文書化されている
- [ ] 失敗時のロールバック手順が確認されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Cloudflare Pages / Workers / D1 デプロイ手順 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | go-live / rollback 方針 |
| 必須 | docs/05b-parallel-smoke-readiness-and-handoff/index.md | readiness checklist・handoff 成果物確認 |
| 必須 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | D1 runbook（マイグレーション適用手順） |
| 必須 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | 本番 Secrets 配置確認 |
| 参考 | doc/00-getting-started-manual/specs/00-overview.md | システム全体像・本番環境の目標状態 |
| 参考 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | 未タスク検出元（UT-06 の出典） |
