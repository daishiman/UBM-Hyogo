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

## よく使うコマンド

```bash
pnpm install           # 依存インストール
pnpm typecheck         # 型チェック
pnpm lint              # リント
pnpm test              # テスト
pnpm dev               # ローカル開発サーバー起動
```

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
