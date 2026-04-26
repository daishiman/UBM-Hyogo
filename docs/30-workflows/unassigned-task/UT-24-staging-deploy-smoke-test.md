# UT-24: 初回 staging deploy smoke test

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-24 |
| タスク名 | 初回 staging deploy smoke test |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | open |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md (U-05) |

## 目的

04-serial-cicd-secrets-and-environment-sync で整備した CD ワークフロー（`web-cd.yml` / `backend-deploy.yml`）が、実際に Cloudflare Workers へデプロイできることを `dev` ブランチへの初回マージ時に smoke test として検証する。

「ワークフローが存在する」から「ワークフローが実際にデプロイを成功させる」への証明を行い、以降の継続的デリバリーの基盤として信頼できる状態を確立する。

## スコープ

### 含む

- `dev` ブランチへの PR マージをトリガーとした CD ワークフローの初回実行
- `apps/web` の Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) への staging デプロイ成功確認
- `apps/api` の Cloudflare Workers (Hono) への staging デプロイ成功確認
- GitHub Actions ログでの各ステップ成功確認（build / deploy / health check）
- デプロイ後の staging URL への HTTP アクセス確認（200 応答）
- D1 binding が staging 環境で正しく参照できることの確認
- GitHub Actions の secrets が正しく参照されていることの確認（CLOUDFLARE_API_TOKEN 等）
- smoke test 結果のドキュメント記録（outputs または LOGS.md への記録）

### 含まない

- production へのデプロイ（本タスクは staging のみ）
- E2E テストや UI テスト（別タスクのスコープ）
- パフォーマンス検証・負荷テスト
- カスタムドメインの動作確認（UT-16 のスコープ）
- アプリケーション機能の動作確認（認証・フォーム取得等）
- ワークフローファイル自体の修正（04-serial で整備済みのものを使用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | web-cd.yml / backend-deploy.yml が整備済みであること |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | staging Cloudflare Workers インスタンスが存在すること |
| 上流 | UT-22（D1 migration SQL 実装） | staging D1 への migration 適用済みで binding が有効であること |
| 上流 | 02-serial-monorepo-runtime-foundation | apps/web / apps/api がビルド可能な状態であること |
| 下流 | UT-06（production deploy 実行） | staging smoke test 成功が production 昇格の前提 |
| 下流 | 05b-parallel-smoke-readiness-and-handoff | staging 動作確認が handoff の前提条件 |

## 着手タイミング

> **着手前提**: 04-serial がマージ済みで、`dev` ブランチに CD ワークフローが存在し、GitHub Secrets に `CLOUDFLARE_API_TOKEN` 等の必要シークレットが登録済みであること。

| 条件 | 理由 |
| --- | --- |
| 04-serial マージ済み | web-cd.yml / backend-deploy.yml が dev ブランチに存在する |
| GitHub Secrets 設定済み | ワークフローが API Token を参照できなければデプロイ不可 |
| staging D1 binding 有効 | UT-22 で migration 適用済みの staging D1 が wrangler.toml に定義済み |
| apps/web / apps/api がビルド通過 | ビルドエラーが先に解消されていないとデプロイ失敗する |

## 苦戦箇所・知見

**`@opennextjs/cloudflare` のビルド成果物と Workers の互換性**
Next.js App Router を Cloudflare Workers で動かす `@opennextjs/cloudflare` は、通常の `next build` とは異なるビルドパイプラインを使う。ローカルで `pnpm build` が通っても、`wrangler deploy` 時に Workers ランタイム非対応の Node.js API を使っているとエラーになる。初回デプロイ前に `wrangler dev` でローカル Workers シミュレーション確認を推奨。

**`CLOUDFLARE_API_TOKEN` のスコープ不足**
Cloudflare API Token に Workers のデプロイ権限（`Workers Scripts: Edit`）と D1 の参照権限が含まれていないとデプロイが失敗する。04-serial の secrets-placement-matrix.md に記載されているトークンのスコープと、実際の Token 設定が一致しているかを最初に確認すること。

**wrangler.toml の `[env.staging]` セクション漏れ**
monorepo 構成では `apps/api/wrangler.toml` と `apps/web/wrangler.toml` それぞれに staging 環境の定義が必要。`[env.staging]` セクションが欠けていると `--env staging` フラグを渡しても production 設定で上書きされる。

**GitHub Actions のキャッシュ・pnpm バージョン差異**
CI 環境の pnpm バージョンが `.mise.toml` で固定した pnpm 10 と異なる場合、`pnpm install` が失敗したり lockfile 不一致エラーが出る。ワークフローの `setup-node` + `pnpm/action-setup` のバージョン指定が `.mise.toml` と一致していることを確認する。

**D1 binding が staging では異なる database_id を参照する**
`wrangler.toml` で `[env.staging]` の `[[d1_databases]]` が production とは別の `database_id` を指している必要がある。staging デプロイ後に D1 に接続できない場合は binding 定義の database_id を最初に確認すること。

**smoke test 結果の記録忘れ**
「デプロイが成功した」という事実を次のタスク担当者が把握できるよう、GitHub Actions のジョブ URL と staging の確認 URL を outputs または LOGS.md に残す。特に UT-06 や 05b が「staging 確認済み」を前提とするため、エビデンスが必須。

## 実行概要

1. `dev` ブランチに最新の実装（apps/web / apps/api のビルド通過状態）がマージされていることを確認する
2. GitHub Actions で `web-cd.yml` / `backend-deploy.yml` が自動トリガーされることを確認する
3. GitHub Actions のログを確認し、各ステップ（install / build / deploy）の成功を記録する
4. デプロイ後に Cloudflare Dashboard で staging Workers がデプロイされていることを確認する
5. staging URL に対して `curl` または ブラウザで HTTP 200 応答を確認する
6. `apps/api` のヘルスチェックエンドポイント（`GET /healthz` 等）が staging で応答することを確認する
7. GitHub Actions ジョブ URL と staging 確認 URL を outputs / LOGS.md に記録する

## 完了条件

- [ ] `dev` ブランチへのマージで `web-cd.yml` が自動実行され、全ステップが green
- [ ] `dev` ブランチへのマージで `backend-deploy.yml` が自動実行され、全ステップが green
- [ ] staging の `apps/web` URL に HTTP 200 でアクセス可能
- [ ] staging の `apps/api` ヘルスチェックエンドポイントが HTTP 200 で応答
- [ ] Cloudflare Dashboard で staging Workers が最新バージョンで表示されている
- [ ] D1 binding が staging Workers から正しく参照できることを確認（binding エラーなし）
- [ ] GitHub Actions ジョブ URL を outputs / LOGS.md に記録済み
- [ ] staging 確認 URL（Workers URL）を outputs / LOGS.md に記録済み
- [ ] 失敗した場合は原因と対処を LOGS.md に記録し、再実行後に全条件を満たす

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-02/workflow-topology.md | CD ワークフローの構成と secrets 定義 |
| 必須 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-05/github-actions-drafts.md | web-cd.yml / backend-deploy.yml の設計 |
| 必須 | apps/api/wrangler.toml | D1 binding と staging 環境定義 |
| 必須 | apps/web/wrangler.toml | Workers 設定と staging 環境定義 |
| 参考 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md (U-05) | 検出原典 |
| 参考 | https://developers.cloudflare.com/workers/wrangler/commands/#deploy | wrangler deploy コマンドリファレンス |
| 参考 | https://github.com/cloudflare/opennextjs-cloudflare | @opennextjs/cloudflare ビルド手順 |
