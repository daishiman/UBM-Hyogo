# UT-23: 1Password Environments + mise 連携手順 README 文書化

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | UT-23 |
| タスク名 | 1Password Environments + mise 連携手順 README 文書化 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1 |
| 状態 | open |
| 作成日 | 2026-04-27 |
| 既存タスク組み込み | なし |
| 組み込み先 | - |
| 検出元 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-12/unassigned-task-detection.md (U-04) |

## 目的

04-serial-cicd-secrets-and-environment-sync で確定した「ローカル秘密情報の正本は 1Password Environments」という方針に基づき、開発者が 1Password から環境変数を取得して `mise exec` / `mise shell` 経由でローカル開発環境を構築する手順を `apps/web/README.md` および `apps/api/README.md` に文書化する。

新規参加の開発者が README を読むだけでローカル開発環境を立ち上げられる状態を実現し、「.env をリポジトリにコミットしない」という不変条件を守りながらもオンボーディングコストを最小化する。

## スコープ

### 含む

- `apps/web/README.md` の新規作成または更新（ローカル開発環境構築手順を含む）
- `apps/api/README.md` の新規作成または更新（ローカル開発環境構築手順を含む）
- 1Password CLI (`op`) を使った環境変数取得手順の文書化
- `mise exec` / `mise shell` 経由での pnpm 実行手順の記載
- 必要な 1Password Vault / Item 名の明記（値は記載しない）
- ローカル開発に必要な環境変数一覧（変数名のみ、値は 1Password 参照）
- `op run --env-file` または `op inject` を使った .env 生成手順（オプション）
- mise + 1Password 連携のトラブルシューティング FAQ

### 含まない

- 1Password Vault への初回シークレット登録作業（運用・管理者タスク）
- Cloudflare Secrets / GitHub Secrets への登録作業（04-serial のスコープ）
- 本番・staging 環境の環境変数設定（CI/CD 側の関心事）
- apps/web / apps/api のアプリケーションロジック実装
- `.env` ファイルをリポジトリにコミットすること（CLAUDE.md の不変条件により禁止）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04-serial-cicd-secrets-and-environment-sync | ローカル秘密情報の正本が 1Password Environments と確定 |
| 上流 | 02-serial-monorepo-runtime-foundation | mise + pnpm の開発環境構成が確定済み |
| 上流 | 01b-parallel-cloudflare-base-bootstrap | 必要な Cloudflare 関連の変数名が確定 |
| 参考 | CLAUDE.md | `mise exec`/`mise shell` の使用方針と .env コミット禁止ルール |

## 着手タイミング

> **着手前提**: 04-serial がマージ済みで、必要な環境変数の一覧（変数名）が確定していること。

| 条件 | 理由 |
| --- | --- |
| 04-serial マージ済み | secrets-placement-matrix.md に変数名の一覧が記録されている |
| 02-serial 完了 | mise + pnpm の構成が本番仕様として固定されている |
| 開発者が 1Password アカウントを保有 | 手順の実動作を確認するために必要 |

## 苦戦箇所・知見

**1Password CLI バージョンと `op run` の挙動差**
`op` コマンドの v1 と v2 では構文が大きく異なる。v2 以降（現在の標準）では `op run --env-file=.env.1p -- <command>` 形式を使うが、v1 は `op run <command>` 形式。README には v2 前提と明記し、`op --version` での確認手順も記載すること。

**mise との組み合わせ手順の複雑さ**
`op run -- mise exec -- pnpm dev` のようにネストした形式になるため、初見の開発者には混乱しやすい。「なぜネストするか」の説明（mise が正しい Node バージョンを保証し、op が環境変数を注入する）をコメントとして添えること。

**`.env.1p` ファイルのコミット注意**
`op run --env-file` に渡すテンプレートファイル（例: `.env.1p` や `.env.template`）には変数名と 1Password 参照パスのみを記載し、実際の値は含まない。このテンプレートはリポジトリにコミット可能だが、README でその違いを明確に説明しないと誤解を招く。

**変数名の網羅性の維持**
アプリが必要とする環境変数は実装が進むにつれて増える。README に書いた変数名一覧と実際の変数名がドリフトしやすい。初回は 04-serial の secrets-placement-matrix.md を正本として参照し、「この README は secrets-placement-matrix.md から派生」と明示しておくこと。

**1Password Service Account vs 個人アカウント**
CI/CD では Service Account を使うが、ローカル開発では個人の 1Password アカウントを使う。README ではローカル開発（個人アカウント）の手順のみを記載し、CI 側の Service Account 設定は 04-serial ドキュメントへリンクすること。

## 実行概要

1. 04-serial の `outputs/phase-02/secrets-placement-matrix.md` から「ローカル開発に必要な環境変数名」を抽出する
2. 1Password の Vault / Item 名の命名規則を確認し、README で参照するパスを決定する
3. `apps/web/README.md` を作成し、以下のセクションを記述する：
   - 前提条件（mise / op CLI のインストール）
   - 1Password からの環境変数取得手順
   - `op run -- mise exec -- pnpm dev` によるローカル起動手順
   - トラブルシューティング FAQ
4. `apps/api/README.md` を作成し、同様の手順を記述する（API 固有の変数名を反映）
5. monorepo ルートの `README.md`（または `CONTRIBUTING.md`）に上記 README へのリンクを追加する

## 完了条件

- [ ] `apps/web/README.md` が存在し、1Password + mise を使ったローカル起動手順を含む
- [ ] `apps/api/README.md` が存在し、1Password + mise を使ったローカル起動手順を含む
- [ ] README に記載した変数名が 04-serial の secrets-placement-matrix.md と一致する
- [ ] `.env` をリポジトリにコミットしないことが README に明記されている
- [ ] `op run` の v2 構文で動作確認済みの手順が記載されている
- [ ] `mise exec` / `mise shell` 両方の実行方法が記載されている
- [ ] 新規開発者がゼロから手順を追って動作確認できることをレビュアーが確認済み
- [ ] monorepo ルートの README または CONTRIBUTING.md から当該 README へのリンクが存在する

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/outputs/phase-02/secrets-placement-matrix.md | ローカル開発に必要な変数名の正本 |
| 必須 | CLAUDE.md | mise exec / mise shell の使用方針・.env コミット禁止ルール |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | D1 / Cloudflare 設定値の背景 |
| 参考 | https://developer.1password.com/docs/cli/reference/commands/run/ | op run コマンドリファレンス |
| 参考 | https://mise.jdx.dev/ | mise 公式ドキュメント |
