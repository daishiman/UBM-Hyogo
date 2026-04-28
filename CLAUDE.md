# CLAUDE.md — UBM兵庫支部会 メンバーサイト

Claude Code がタスク実行時に最初に参照する基準ファイル。
詳細仕様はすべて `doc/00-getting-started-manual/` 以下を参照すること。

---

## プロジェクト概要

UBM兵庫支部会の会員管理・公開サイト。Google Form の実回答を正本として、
公開ディレクトリ・会員マイページ・管理バックオフィスの3層を構成する。

---

## スタック

| 役割 | 採用技術 |
|------|---------|
| Web UI | Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare` (`apps/web`) |
| API | Cloudflare Workers + Hono (`apps/api`) |
| DB | Cloudflare D1（Workers binding 経由のみアクセス可） |
| フォーム取得 | Google Forms API |
| 認証 | Auth.js + Google OAuth / Magic Link |
| パッケージ管理 | pnpm workspace (monorepo) |

---

## 主要ディレクトリ

| パス | 役割 |
|------|------|
| `doc/00-getting-started-manual/specs/` | システム設計の正本仕様 |
| `doc/00-getting-started-manual/claude-design-prototype/` | UI 画面・導線の参照元 |
| `doc/00-getting-started-manual/gas-prototype/` | UI 叩き台（本番仕様ではない） |
| `doc/00-getting-started-manual/google-form/` | フォーム構造と利用規約 |
| `doc/01-infrastructure-setup/` | インフラ構築タスク仕様書群 |
| `apps/web/` | Cloudflare Workers (Next.js via `@opennextjs/cloudflare`) |
| `apps/api/` | Cloudflare Workers (Hono) |

---

## フォーム固定値

| 項目 | 値 |
|------|-----|
| formId | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` |
| responderUrl | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` |
| sectionCount | `6` |
| questionCount | `31` |

---

## 重要な不変条件

1. 実フォームの schema をコードに固定しすぎない
2. consent キーは `publicConsent` と `rulesConsent` に統一する
3. `responseEmail` はフォーム項目ではなく system field として扱う
4. Google Form schema 外のデータは admin-managed data として分離する
5. D1 への直接アクセスは `apps/api` に閉じる（`apps/web` から直接アクセス禁止）
6. GAS prototype は本番バックエンド仕様に昇格させない
7. MVP では Google Form 再回答を本人更新の正式な経路とする

---

## ブランチ戦略

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

| ブランチ | 環境 | PRレビュー |
|---------|------|-----------|
| `feature/*` | ローカル (localhost) | 不要 |
| `dev` | Cloudflare staging | 1名 |
| `main` | Cloudflare production | 2名 |

---

## 開発環境セットアップ（初回 / Node バージョン変更後）

```bash
# Node 24 + pnpm 10 を mise で管理（.mise.toml に固定済み）
mise install          # Node 24.15.0 + pnpm 10.33.2 をインストール
mise exec -- pnpm install  # 正しい Node バージョンで依存インストール
```

> **毎回 `pnpm install` が必要な理由**: ワークツリーごとに `node_modules` が独立するため。
> `mise install` は一度だけ実行すれば OK（バイナリはキャッシュ済みになる）。

---

## ワークツリー作成（新機能開発の開始）

```bash
# 推奨: スクリプトで一括セットアップ（main同期 + pnpm install まで自動実行）
bash scripts/new-worktree.sh feat/my-feature
```

> **⚠️ 重要: Claude Code は必ずワークツリーディレクトリから起動すること**
>
> メインディレクトリで起動すると、ファイルがメインディレクトリに作られ
> 無関係なPRに混入する原因になる。
>
> ```bash
> # ワークツリー作成後、新しいターミナルタブで実行
> cd .worktrees/<作成されたディレクトリ名>
> claude   # ← ここから起動することで並列開発が正しく分離される
> ```
>
> 並列タスクの数だけターミナルタブを開き、それぞれのワークツリーで claude を起動する。

---

## よく使うコマンド

```bash
# 必ず mise exec 経由で実行（Node 24 が確実に使われる）
mise exec -- pnpm install         # 依存インストール（prepare で lefthook install も自動実行）
mise exec -- pnpm typecheck       # 型チェック
mise exec -- pnpm lint            # リント
mise exec -- pnpm build           # ビルド
mise exec -- pnpm indexes:rebuild # skill indexes を明示再生成（post-merge 廃止後の正規経路）

# または mise shell で Node 24 環境に入ってから通常通り実行
mise shell
pnpm install
pnpm typecheck
pnpm lint
```

> **Git hook の方針**: `lefthook.yml` が hook の正本。`pnpm install` 実行時に `prepare` script
> 経由で `lefthook install` が自動配置する。`.git/hooks/*` の手書きは禁止。
> indexes 再生成は post-merge から廃止しており、必要時は `pnpm indexes:rebuild` を明示実行する。
> 詳細: `doc/00-getting-started-manual/lefthook-operations.md`

---

## Claude Code 設定

- **出力言語**: 日本語（thinking モード含む全出力）
- **権限モード**: `bypassPermissions`
- **設定ファイル**: `.claude/settings.local.json`
- **詳細設定リファレンス**: `doc/00-getting-started-manual/claude-code-config.md`

---

## シークレット管理

| 種別 | 管理場所 |
|------|---------|
| ランタイムシークレット | Cloudflare Secrets |
| CI/CD シークレット | GitHub Secrets |
| 非機密設定値 | GitHub Variables |
| ローカル秘密情報の正本 | 1Password Environments |

**平文 `.env` はリポジトリにコミットしない。**

### ローカル `.env` の運用ルール（AI 学習混入防止）

- ローカル `.env` には **実値を絶対に書かない**（AI コンテキストに混入する事故を防ぐため）
- 値は **1Password に保管**し、`.env` には `op://Vault/Item/Field` 参照のみを記述する
- 実行時に [`scripts/with-env.sh`](scripts/with-env.sh) が `op run --env-file=.env` でラップして動的注入する

#### Cloudflare 系 CLI 実行ルール（Claude Code 必読）

Claude Code および手動オペレーション双方で **以下のラッパーのみを使用**すること。`wrangler` を直接呼ばない。

```bash
# 認証確認
bash scripts/cf.sh whoami

# D1 操作
bash scripts/cf.sh d1 list
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup.sql

# デプロイ
bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env production
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env production

# rollback
bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production
```

`scripts/cf.sh` の役割:
1. `op run --env-file=.env` 経由で `CLOUDFLARE_API_TOKEN` 等を 1Password から動的注入（実値は環境変数として揮発的に渡るのみ・ファイルやログには残らない）
2. グローバル `esbuild` とのバージョン不整合を `ESBUILD_BINARY_PATH` で自動解決
3. `mise exec --` 経由で Node 24 / pnpm 10 を保証

**禁止事項（Claude Code を含む全 AI エージェントに適用）:**
- `.env` の中身を `cat` / `Read` / `grep` 等で表示・読み取らない（実値は op 参照のみだが慣性事故防止）
- API Token 値・OAuth トークン値を出力やドキュメントに転記しない
- `wrangler login` でローカル OAuth トークン (`~/Library/Preferences/.wrangler/config/default.toml`) を保持しない。`.env` の op 参照に一本化する

---

## 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| `doc/00-getting-started-manual/specs/00-overview.md` | システム全体概要 |
| `doc/00-getting-started-manual/specs/01-api-schema.md` | フォーム schema と項目定義 |
| `doc/00-getting-started-manual/specs/02-auth.md` | 認証設計 |
| `doc/00-getting-started-manual/specs/08-free-database.md` | D1 構成と無料構成 |
| `doc/00-getting-started-manual/specs/13-mvp-auth.md` | MVP 認証方針 |
| `doc/00-getting-started-manual/claude-code-config.md` | Claude Code 設定詳細 |
