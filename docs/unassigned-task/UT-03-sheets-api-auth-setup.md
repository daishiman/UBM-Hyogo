# UT-03: Sheets API 認証方式設定

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-03 |
| タスク名 | Sheets API 認証方式設定 |
| 優先度 | HIGH |
| 推奨Wave | Wave 1 |
| 状態 | unassigned |
| 作成日 | 2026-04-23 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |

## 目的

Google Sheets API v4 への接続認証方式（Service Account JSON key / OAuth 2.0）を選定し、Cloudflare Workers からの認証フローを実装する。UT-01 の同期設計と並行して進め、セキュアな認証基盤を確立することで、後続の同期ジョブ実装（UT-09）が安全かつ確実に Sheets データへアクセスできる状態を作る。

## スコープ

### 含む
- 認証方式の比較評価（Service Account JSON key vs OAuth 2.0 の比較・採択理由）
- 採択方式の認証フロー実装（Cloudflare Workers 内での認証処理）
- Service Account または OAuth credentials の作成手順（Google Cloud Console 操作）
- シークレット管理方針（`GOOGLE_SERVICE_ACCOUNT_JSON` 等の Cloudflare Secrets への配置）
- 認証フローの動作確認（実際に Sheets API v4 からデータ取得できることの確認）
- packages/integrations 内への認証モジュール配置

### 含まない
- 同期ロジックの実装（→ UT-09 で実施）
- エンドユーザー向け OAuth ログインフロー（Google 認証によるユーザーログインとは別物）
- Google Drive API の権限設定（→ 01c-parallel-google-workspace-bootstrap で実施）
- D1 スキーマ設計（→ UT-04 で実施）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap | Google Cloud Project・Service Account・OAuth client の作成が完了している必要がある |
| 上流 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation | packages/integrations の責務境界が確定している必要がある |
| 上流 | UT-01 (Sheets→D1 同期方式定義) | 同期フロー設計に依存して認証が必要なエンドポイントが確定する |
| 下流 | UT-09 (Sheets→D1 同期ジョブ実装) | 本タスクで確立した認証モジュールを同期ジョブが利用する |
| 下流 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract | Sheets 接続認証が確立していることを前提に契約設計が進む |
| 連携 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync | 認証シークレットの CI/CD 環境への配置は 04 タスクで実施 |

## 着手タイミング

> **着手前提**: `01c-parallel-google-workspace-bootstrap` が完了してから着手すること。UT-01 と並列着手が可能。

| 条件 | 理由 |
| --- | --- |
| 01c-parallel-google-workspace-bootstrap 完了 | Google Workspace の認証設定・Service Account の発行元が確定している必要がある |
| UT-01 着手と並列 OK | 同期フロー設計（UT-01）と認証方式設定（UT-03）は独立しており同時並行できる |

## 苦戦箇所・知見

**1. Service Account JSON key vs OAuth 2.0 の選定で迷いやすい**
サーバー間通信（Cloudflare Workers → Sheets API）には Service Account が適しているが、JSON key ファイルをシークレットとして管理する際に「ファイル全体を Base64 エンコードして1つの env 変数に収める」というパターンが必要になる。Cloudflare Secrets は文字列のみ受け付けるため、JSON をそのまま格納することになるが、Workers 側での `JSON.parse()` 時のエラーハンドリングを丁寧に実装しないと runtime エラーが起きやすい。

**2. Cloudflare Workers でのトークン refresh が難しい**
Service Account 認証は JWT を生成してアクセストークンを取得する2段階フローを必要とする。Workers の fetch API を使ってこれを実装するとコードが複雑になる。`google-auth-library` 等の Node.js ライブラリは Workers の Edge Runtime では動作しない（Node APIs 依存のため）ため、JWT 署名・トークン取得を Web Crypto API で実装するか、Workers 互換ライブラリを選定する必要がある。

**3. シークレットの環境別管理と local 開発での扱い**
本番・staging では Cloudflare Secrets を使うが、ローカル開発では `.dev.vars` ファイルに Service Account JSON を直書きすることになる。このファイルが `.gitignore` に含まれていないと credentials が git に混入するリスクがある。`wrangler.toml` の `[vars]` セクションと `.dev.vars` の役割分担、および `.gitignore` への除外設定を runbook に明記する必要がある。

**4. Sheets のアクセス権限付与を Service Account メールアドレスで行う必要がある**
Service Account を使う場合、対象の Google Sheets スプレッドシートに Service Account のメールアドレス（`xxx@project.iam.gserviceaccount.com` 形式）を「閲覧者」または「編集者」として共有設定する必要がある。この手順を忘れると 403 エラーが発生するが、エラーメッセージが「PERMISSION_DENIED」と出るだけで原因が分かりにくい。

## 実行概要

- Service Account JSON key 方式を採択理由付きで選定し、OAuth 2.0 との比較表を設計文書に記録する（サーバー間通信には Service Account が適切、ユーザー操作不要・token refresh 管理が不要）
- Google Cloud Console で Service Account を作成し、Sheets API の権限を付与、JSON key をダウンロードして `GOOGLE_SERVICE_ACCOUNT_JSON` として Cloudflare Secrets に配置する手順を runbook 化する
- packages/integrations 配下に `sheets-auth.ts` モジュールを作成し、Web Crypto API を使った JWT 署名・アクセストークン取得・キャッシュ（TTL 1時間）のロジックを実装する
- 対象 Sheets スプレッドシートへの Service Account メールアドレスの共有設定手順を runbook に記載する
- Sheets API v4 の `spreadsheets.values.get` エンドポイントへの疎通確認スクリプトを作成し、認証が正常に動作することを verified として記録する

## 完了条件

- [ ] Service Account JSON key 方式と OAuth 2.0 の比較評価表が設計文書に存在する
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` が Cloudflare Secrets（staging / production）に配置されている
- [ ] `packages/integrations` 内に Sheets 認証モジュールが実装されている
- [ ] Sheets API v4 からデータ取得できることが動作確認で verified になっている
- [ ] `.dev.vars` の `.gitignore` 除外設定が確認されている
- [ ] Service Account メールアドレスの Sheets 共有手順が runbook に記載されている
- [ ] ローカル開発環境での認証フロー（`.dev.vars` 使用）が文書化されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/completed-tasks/01c-parallel-google-workspace-bootstrap/index.md | Service Account / OAuth client の作成手順・secrets 名の統一 |
| 必須 | doc/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md | `GOOGLE_SERVICE_ACCOUNT_JSON` の配置先定義 |
| 必須 | doc/unassigned-task/UT-01-sheets-d1-sync-design.md | 同期フロー設計（認証が必要な箇所の確認） |
| 必須 | doc/00-serial-architecture-and-scope-baseline/outputs/phase-12/unassigned-task-detection.md | UT-03 の検出コンテキスト（OOS-02 / G-02） |
| 参考 | .claude/skills/aiworkflow-requirements/references/architecture-monorepo.md | packages/integrations の責務境界 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | Cloudflare Secrets 配置方針 |
| 参考 | .claude/skills/aiworkflow-requirements/references/environment-variables.md | local canonical env / .dev.vars 管理 |
