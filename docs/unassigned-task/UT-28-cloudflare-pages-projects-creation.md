# UT-28: Cloudflare Pages プロジェクト（staging / production）作成

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-28 |
| タスク名 | Cloudflare Pages プロジェクト（staging / production）作成 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| GitHub Issue | #48 |
| 検出元 | docs/04-serial-cicd-secrets-and-environment-sync の phase-12 |

## 目的

`web-cd.yml` が `dev` / `main` それぞれの push で参照する 2 つの Cloudflare Pages プロジェクト（production / staging）を作成し、`production_branch` / 互換性フラグ / アップロード成果物の方針を確定する。

## スコープ

### 含む

- Cloudflare Pages の production プロジェクト作成（`production_branch=main`）
- Cloudflare Pages の staging プロジェクト作成（`production_branch=dev`）
- `@opennextjs/cloudflare` が出力するビルド成果物との互換性設定確認
- Pages プロジェクト名を UT-27 の `CLOUDFLARE_PAGES_PROJECT_NAME` Variables に反映（UT-27 との連携）
- Cloudflare Workers compatibility_date / compatibility_flags の設定
- カスタムドメイン設定の方針確定（MVP では `*.pages.dev` ドメインを使用する場合はそれを明記）

### 含まない

- 独自ドメインの取得・DNS 設定（別タスク / 運用フェーズ）
- `apps/web` のビルド実装変更（04-serial / UT-21 等のスコープ）
- D1 / KV / R2 などのストレージ binding 設定（UT-02 / UT-04 等のスコープ）
- CD ワークフロー YAML の修正（04-serial で整備済みのものをそのまま使用）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | Cloudflare アカウントが有効で Pages が使用可能な状態であること |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | web-cd.yml が参照するプロジェクト名のフォーマットが確定済みであること |
| 連携 | UT-27（GitHub Secrets / Variables 配置） | Pages プロジェクト名確定後に Variables へ登録する必要がある |
| 下流 | UT-29（スモーク／ヘルスチェック自動化） | Pages の URL が確定しないとヘルスチェック先が定まらない |

## 着手タイミング

> **着手前提**: 01b が完了し Cloudflare アカウントへのアクセスが確立済みであること。04-serial の web-cd.yml がマージ済みであること。

| 条件 | 理由 |
| --- | --- |
| 01b 完了 | Cloudflare アカウントにプロジェクトを作成するために認証情報が必要 |
| 04-serial マージ済み | プロジェクト名の命名規則が workflow と一致している必要がある |
| UT-27 と同時並行可 | プロジェクト作成後に Variables を登録するため、UT-27 より先行か同時進行が望ましい |

## 苦戦箇所・知見

**`@opennextjs/cloudflare` のビルド出力構造**
`@opennextjs/cloudflare` は Next.js App Router のビルド成果物を Cloudflare Workers 向けに変換する。出力ディレクトリは通常 `.open-next/` または `dist/` だが、Pages へのアップロード時に `wrangler pages deploy` が期待するディレクトリを `--directory` フラグで明示する必要がある。web-cd.yml との整合性を確認すること。

**Pages プロジェクトの production_branch と branch deploy の違い**
Cloudflare Pages では、`production_branch` に設定したブランチへの push が「production デプロイ」として扱われ、それ以外のブランチは「preview デプロイ」として扱われる。staging 環境では `production_branch=dev` に設定することで `dev` ブランチの push が staging の production URL（`*.pages.dev`）に反映される設計とする。

**プロジェクト名の命名規則**
Cloudflare Pages のプロジェクト名はアカウント内でユニークである必要がある。また、`*.pages.dev` のサブドメインとして使用されるため、英数字とハイフンのみ使用可能。`ubm-hyogo-web`（production）/ `ubm-hyogo-web-staging`（staging）等の命名が想定される。web-cd.yml の `CLOUDFLARE_PAGES_PROJECT_NAME` Variables と完全一致させること。

**Direct Upload vs Git 連携**
Cloudflare Pages には「Git リポジトリ連携（自動ビルド）」と「Direct Upload（`wrangler pages deploy`）」の2方式がある。04-serial の web-cd.yml は GitHub Actions 経由の Direct Upload を採用しているため、Pages プロジェクト作成時に「Git 連携なし」で作成する必要がある（Git 連携を有効にすると二重デプロイが発生する）。

**互換性フラグと compatibility_date**
`@opennextjs/cloudflare` が要求する互換性フラグ（例: `nodejs_compat`）を Pages プロジェクトの設定で有効化する必要がある。`wrangler.toml` の `compatibility_date` と Pages プロジェクト側の設定が食い違うとランタイムエラーが発生する。`apps/web/wrangler.toml` の設定値を Pages プロジェクト作成時にそのまま引き継ぐこと。

**Pages の Free プランの制約**
Cloudflare Pages の Free プランでは、1プロジェクトあたり月 500 ビルド・月 500 万リクエストの制約がある。Direct Upload を使う場合はビルドカウントは消費しないが、リクエスト数の上限には注意すること（MVP フェーズでは問題なし）。

## 実行概要

1. Cloudflare Dashboard または `wrangler pages project create` コマンドで production プロジェクトを作成
   - プロジェクト名: `ubm-hyogo-web`（仮称、web-cd.yml と一致させること）
   - production_branch: `main`
   - Git 連携: なし（Direct Upload 方式）
2. 同様に staging プロジェクトを作成
   - プロジェクト名: `ubm-hyogo-web-staging`（仮称）
   - production_branch: `dev`
3. 両プロジェクトで `nodejs_compat` 等の互換性フラグを有効化
4. UT-27 と連携して `CLOUDFLARE_PAGES_PROJECT_NAME` Variables にプロジェクト名を登録
5. `wrangler pages deploy` でダミーデプロイを実施し、`*.pages.dev` URL で疎通確認

## 完了条件

- [ ] production 用 Cloudflare Pages プロジェクトが作成済み（`production_branch=main`）
- [ ] staging 用 Cloudflare Pages プロジェクトが作成済み（`production_branch=dev`）
- [ ] 両プロジェクトで Git 連携が無効（Direct Upload 方式）であることを確認
- [ ] `nodejs_compat` 等の必要な互換性フラグが両プロジェクトで有効化済み
- [ ] プロジェクト名が UT-27 の `CLOUDFLARE_PAGES_PROJECT_NAME` Variables に反映済み
- [ ] production プロジェクトの `*.pages.dev` URL で疎通確認済み
- [ ] staging プロジェクトの `*.pages.dev` URL で疎通確認済み
- [ ] プロジェクト名・URL・設定値を runbook に記録済み

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md | 検出原典 |
| 必須 | .github/workflows/web-cd.yml | Pages プロジェクト名参照箇所の確認 |
| 必須 | apps/web/wrangler.toml | compatibility_date / flags の確認 |
| 参考 | https://developers.cloudflare.com/pages/get-started/direct-upload/ | Direct Upload 公式 |
| 参考 | https://developers.cloudflare.com/pages/configuration/build-configuration/ | Pages 互換性設定 |
| 参考 | https://github.com/opennextjs/opennextjs-cloudflare | @opennextjs/cloudflare 公式 |
| 参考 | UT-27 仕様書 | Secrets / Variables 連携 |
