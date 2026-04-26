# Phase 2 出力: canonical-baseline.md
# 採用構成の基準線

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | architecture-and-scope-baseline |
| Phase | 2 / 13 (設計) |
| 作成日 | 2026-04-23 |
| 状態 | completed |
| 入力 | outputs/phase-01/baseline-inventory.md |

---

## 1. 採用アーキテクチャ基準線

以下の構成を **確定値** として採用する。Wave 1 以降の全タスクはこの表を参照し、構成変更が生じる場合は本ファイルを更新してから下流作業を行うこと。

| 層 | 採用コンポーネント | 技術スタック | 備考 |
| --- | --- | --- | --- |
| Web 層 | Cloudflare Pages | Next.js App Router (Edge Runtime) | UI レンダリング, BFF なし |
| API 層 | Cloudflare Workers | Hono フレームワーク | REST エンドポイント, D1 への唯一のアクセス口 |
| DB 層 (canonical) | Cloudflare D1 | SQLite + WAL mode | 唯一の正本データストア |
| 入力源 (non-canonical) | Google Sheets | Google Sheets API v4 | データ入力口, D1 に同期後は参照不要 |
| ホスティング全体 | Cloudflare | Pages + Workers + D1 | 全コンポーネントを無料枠で運用 |

### アーキテクチャ図

```
[ユーザー]
    |
    v
[Cloudflare Pages / apps/web]  ← Next.js App Router
    |
    | (HTTP / fetch)
    v
[Cloudflare Workers / apps/api]  ← Hono
    |
    | (D1 binding)
    v
[Cloudflare D1]  ← canonical DB (SQLite WAL)

[Google Sheets]  ← 外部入力源
    |
    | (Sheets → D1 同期ジョブ / 詳細は 03-serial-data-source-and-storage-contract で決定)
    v
[Cloudflare D1]
```

---

## 2. ブランチ/環境対応表

| ブランチ | 対応環境 | Cloudflare プロジェクト | デプロイトリガー | PRレビュー | force push |
| --- | --- | --- | --- | --- | --- |
| feature/* | ローカル (localhost) | なし (ローカル実行のみ) | 手動 (wrangler dev) | 不要 | 禁止 (dev への PR のみ) |
| dev | staging | Cloudflare staging プロジェクト | dev ブランチへの push | 1名 | 禁止 |
| main | production | Cloudflare production プロジェクト | main ブランチへの push | 2名 | 禁止 |

### ブランチフロー

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

---

## 3. 責務境界定義

各層の責務を1行で定義する。この定義を逸脱する実装は許可しない。

| 層 | 責務 (1行定義) |
| --- | --- |
| Web (apps/web) | ユーザーへの UI レンダリングと UX 制御を担う。DB への直接アクセス禁止。 |
| API (apps/api) | ビジネスロジックの実行と D1 へのデータアクセスを担う。UI レンダリング禁止。 |
| DB (D1) | アプリケーションデータの唯一の正本を保持する。API 経由のみアクセス可。 |
| 入力源 (Sheets) | 外部からのデータ入力口。canonical でない。D1 への同期後は読み取り専用参照に限定。 |
| シークレット管理 | ランタイム秘密情報は Cloudflare Secrets、CI/CD 秘密情報は GitHub Secrets、ローカル秘密情報の正本は 1Password Environments が管理する。 |

---

## 4. シークレット配置マトリクス

| シークレット種別 | Cloudflare Secrets | GitHub Secrets | GitHub Variables | 1Password Environments |
| --- | --- | --- | --- | --- |
| OPENAI_API_KEY | 配置 (本番/staging) | - | - | ローカル秘密情報の正本 |
| ANTHROPIC_API_KEY | 配置 (本番/staging) | - | - | ローカル秘密情報の正本 |
| DATABASE_URL | 配置 (本番/staging) | - | - | ローカル秘密情報の正本 |
| CLOUDFLARE_API_TOKEN | - | 配置 (CI/CD 専用) | - | ローカル秘密情報の正本 |
| CLOUDFLARE_ACCOUNT_ID | - | 配置 (CI/CD 専用) | - | ローカル秘密情報の正本 |
| GOOGLE_SHEETS_SERVICE_ACCOUNT_KEY | 配置 (本番/staging) | - | - | ローカル秘密情報の正本 |
| ドメイン名 (例: ubm-hyogo.pages.dev) | - | - | 配置 (非機密) | - |
| プロジェクト名 | - | - | 配置 (非機密) | - |

**ルール**:
- 平文 `.env` ファイルをリポジトリにコミット禁止
- ローカル開発では 1Password Environments から取得 (op run 等を使用)
- シークレット値の実値はこのドキュメントに記載しない (placeholder で管理)

---

## 5. Downstream 参照パス

Wave 1 の各タスクが参照すべき canonical path を以下に示す。

| 参照先タスク | 参照ファイル | 参照する情報 |
| --- | --- | --- |
| 02-serial-monorepo-runtime-foundation | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md | セクション1 (アーキテクチャ構成), セクション3 (責務境界), セクション4 (シークレット配置) |
| 03-serial-data-source-and-storage-contract | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md | セクション1 (DB層/入力源), セクション3 (入力源責務) |
| 03-serial-data-source-and-storage-contract | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/decision-log.md | DL-03 (Sheets 非採用理由), DL-04 (D1 採用理由) |
| Wave 1 全タスク | doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md | セクション2 (ブランチ/環境対応表) |

---

## 6. ローカル環境ガード

- Workspace-local `.env*`, `.env.local`, `.env.example`, and other dotfiles are operational artifacts only.
- 1Password Environments がローカル秘密情報の正本であり、repo 内の `.env*` / dotfiles は non-canonical として扱う。
- このドキュメントと dotfiles が衝突した場合は、このドキュメントと skill refs を優先する。

## 完了確認

- [x] アーキテクチャ基準線を表形式で確定値として記載
- [x] ブランチ/環境対応表確定
- [x] 責務境界を各層1行で定義
- [x] シークレット配置マトリクス作成
- [x] Downstream 参照パス明記
- [x] Phase 3 への引き継ぎ準備完了

## Phase 3 への引き継ぎ

| 項目 | 内容 |
| --- | --- |
| 引き継ぎ事項 | canonical-baseline.md と decision-log.md の整合性を Phase 3 レビューで確認すること |
| blockers | なし |
| open questions | なし (Sheets 同期詳細は 03 タスクで解決予定) |
