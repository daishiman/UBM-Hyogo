# UT-23: 1Password Environments + mise 連携手順 README 文書化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-23 |
| タスク名 | 1Password Environments + mise 連携手順 README 文書化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | 未着手 |
| 作成日 | 2026-04-26 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md (U-04) |

## 目的

04-serial-cicd-secrets-and-environment-sync で確定した「ローカル秘密情報の正本は 1Password Environments」という方針に基づき、開発者が 1Password から環境変数を取得して `mise exec` / `mise shell` 経由でローカル開発環境を構築する手順を `apps/web/README.md` および `apps/api/README.md` に文書化する。

## スコープ

### 含む
- `apps/web/README.md` の作成または更新（1Password + mise セットアップ手順）
- `apps/api/README.md` の作成または更新（1Password + mise セットアップ手順）
- 1Password CLI (`op`) のインストール・サインイン手順
- `op run --env-file` または `op inject` を使った環境変数取得の具体例
- `mise exec -- pnpm install` / `mise exec -- pnpm dev` 等の実行コマンド例
- ローカル `.env` は「正本ではない」ことの明記（リポジトリにコミット不可）
- 04-serial `outputs/phase-05/secrets-placement-matrix.md` との整合性確認

### 含まない
- CI/CD 側のシークレット管理（04-serial で完了済み）
- 1Password Vault の新規作成・権限設定（インフラ管理者タスク）
- mise.toml の変更（既に設定済み）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | secrets-placement-matrix.md が source-of-truth |
| 上流 | 02-serial-monorepo-runtime-foundation | mise 設定が完了済みであること |
| 下流 | 開発者オンボーディング | README がないと新規参加者が環境構築できない |

## 着手タイミング

| 条件 | 理由 |
| --- | --- |
| 04-serial マージ済み | secrets-placement-matrix.md が正本として参照可能 |
| 1Password Vault にプロジェクト用シークレットが登録済み | 手順の実動作確認のため |

## 苦戦箇所・知見

**04-serial 実装時の発見点**
- 1Password Environments (`op run`) と `mise exec` の組み合わせ方が非自明：`op run --env-file=.env.1password -- mise exec -- pnpm dev` のように二重ラッパーになる可能性がある
- `.env.1password` ファイルに `op://vault/item/field` 形式の参照を書き、`op run` がそれを解決する設計が最もシンプル
- `mise shell` 後に `op run` を使う場合と、`mise exec -- op run` を使う場合で環境変数の注入順序が変わるため、どちらが正式手順かを明確にする必要がある
- `CLOUDFLARE_API_TOKEN` 等の CI 専用シークレットはローカル開発者が保持すべきでないものと、`GOOGLE_CLIENT_SECRET` 等のローカル開発にも必要なものを分類して文書化する

## 実行概要

1. 04-serial `outputs/phase-05/secrets-placement-matrix.md` でローカル開発に必要なシークレット一覧を確認
2. 1Password CLI のインストール・セットアップ手順を確認
3. `op run` / `op inject` / `.env.1password` の使用方法を検証
4. `apps/web/README.md` と `apps/api/README.md` を作成し、手順を記述
5. 新規開発者ロールで手順を追いトレースして動作確認

## 完了条件

- [ ] `apps/web/README.md` に 1Password + mise ローカルセットアップ手順が記述済み
- [ ] `apps/api/README.md` に 1Password + mise ローカルセットアップ手順が記述済み
- [ ] ローカル `.env` はリポジトリにコミット不可である旨が明記済み
- [ ] 04-serial `secrets-placement-matrix.md` と手順内容が整合している
- [ ] 新規開発者視点でのトレース確認が完了している

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/04-serial-cicd-secrets-and-environment-sync/outputs/phase-05/secrets-placement-matrix.md | ローカル必要シークレット一覧 |
| 必須 | CLAUDE.md（シークレット管理セクション） | 方針の正本 |
| 参考 | https://developer.1password.com/docs/cli/secret-references | 1Password CLI 公式 |
| 参考 | https://mise.jdx.dev/ | mise 公式ドキュメント |
