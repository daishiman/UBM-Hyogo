# UBM兵庫支部会 メンバーサイト - 設計概要

> 目的: Google Form の実回答を正本にしつつ、公開ディレクトリと会員・管理バックオフィスを最小構成で成立させる
> 前提: 実フォームは 31 項目・6 セクション、`formId=119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
> 本番ターゲット: Cloudflare Workers + @opennextjs/cloudflare (apps/web) + Cloudflare Workers (apps/api) + D1

---

## この仕様の立ち位置

- `docs/00-getting-started-manual/claude-design-prototype/` はフロントエンドの画面・導線の参照元
- `docs/00-getting-started-manual/google-form/` はフォーム構造と利用規約の参照元
- `docs/00-getting-started-manual/gas-prototype/` は UI の叩き台であり、本番の認証・API・DB 正本ではない

この spec では、上記 3 つに整合するようにデータ境界と認証境界を整理する。

---

## 全体方針

このシステムは「会員専用サイト」単体ではなく、次の 3 層で構成する。

1. 公開層
   - トップ、メンバー一覧、メンバー詳細、登録導線
   - `publicConsent=consented` かつ `publishState=public` のメンバーのみ表示
2. 会員層
   - ログイン後のマイページ
   - 自分の可視性サマリ、回答更新導線、参加履歴の確認
3. 管理層
   - 管理ダッシュボード、メンバー管理、タグ割当、スキーマ差分レビュー、開催日管理

`/no-access` 専用画面には依存しない。未登録、未同意、削除済みは `/login` と登録導線内の状態表示で吸収する。

---

## 正本と派生データ

| 項目 | 正本 | 説明 |
|------|------|------|
| フォーム構造 | Google Forms API `forms.get` | 31 項目・6 セクションの live schema |
| フォーム回答 | Google Forms API `forms.responses.list` | 回答本文と `responseEmail` |
| `responseEmail` | Google が自動収集する system field | フォーム項目ではない |
| 現在有効な回答 | D1 `member_identities.current_response_id` | 同じ `responseEmail` の最新回答を採用 |
| 公開状態・削除状態 | D1 `member_status` | 管理運用の正本 |
| 開催日 | D1 `meeting_sessions` | Google Form schema 外の admin-managed data |
| 参加履歴 | D1 `member_attendance` | Google Form schema 外の admin-managed data |
| タグ辞書 | D1 `tag_definitions` | 管理・検索用 |
| タグ付与結果 | D1 `member_tags` | ルールまたは管理補正の結果 |
| タグ付与キュー | D1 `tag_assignment_queue` | 手動確認待ちキュー |

本人のプロフィール本文を D1 の上書き差分で持つ前提は採らない。MVP では Google Form 再回答を正式な更新経路にする。

---

## システム全体像

```text
Google Form
  -> forms.get
  -> forms.responses.list
  -> responseEmail (Google auto-collected)

sync worker
  -> schema sync
  -> response normalize
  -> current response selection
  -> consent snapshot update
  -> tag assignment enqueue

Cloudflare D1
  -> form_manifests / form_fields / form_field_aliases
  -> member_responses / member_identities / member_status
  -> deleted_members / admin_users / magic_tokens
  -> meeting_sessions / member_attendance
  -> tag_definitions / member_tags / tag_assignment_queue / sync_jobs

apps/web (Cloudflare Workers via @opennextjs/cloudflare)
  -> public pages
  -> member pages
  -> admin pages
```

---

## 重要な不変条件

1. 実フォームの schema をコードに固定しすぎない
2. consent キーは `publicConsent` と `rulesConsent` に統一する
3. `responseEmail` はフォーム項目ではなく system field として扱う
4. Google Form schema 外のデータは admin-managed data として分離する
5. 本人更新は Google Form 再回答または edit URL 再入力で行う
6. GAS prototype は本番バックエンド仕様に昇格させない

---

## フォームの前提

実フォームの固定条件:

- formId: `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
- responderUrl: `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform`
- section count: 6
- question count: 31
- 回答者メール: Google アカウントから自動収集

31 項目のうちログイン・公開制御で必須なのは以下:

1. `publicConsent`
2. `rulesConsent`

---

## 主要フロー

### 1. 公開閲覧

```text
トップ
  -> メンバー一覧
  -> メンバー詳細
```

公開一覧・詳細は未ログインでも見られる。
ただし表示対象は `publicConsent=consented` かつ `publishState=public` かつ `isDeleted=false` に限定する。

### 2. 新規登録

```text
トップ or ログイン
  -> Google Form 回答
  -> sync
  -> ログイン
  -> マイページ
```

未登録者は `/login` で弾くのではなく、登録 CTA を表示して Google Form へ誘導する。

### 3. 本人更新

```text
マイページ
  -> 情報更新導線
  -> Google Form 再回答 or edit URL
  -> sync
  -> マイページ再表示
```

アプリ内の自由編集フォームは MVP 正式仕様にしない。

### 4. 管理運用

```text
管理ダッシュボード
  -> 公開/非公開
  -> 削除/復元
  -> 開催日追加
  -> 参加履歴付与/解除
  -> タグ割当キュー処理
  -> スキーマ差分確認
```

---

## 公開・会員・管理の境界

| 観点 | 公開 | 会員 | 管理 |
|------|------|------|------|
| 画面閲覧 | 公開ページのみ | 公開 + 自分の会員画面 | 全画面 |
| フィールド visibility | `public` | `public` + `member` | `public` + `member` + `admin` |
| 回答更新 | Google Form 経由のみ | Google Form 経由のみ | Google Form schema 外データのみ直接管理 |
| 管理可能なデータ | なし | なし | 公開状態、削除、開催日、参加履歴、タグ、schema mapping |

---

## スタック

| 役割 | 採用 | 備考 |
|------|------|------|
| Web (UI) | Cloudflare Workers + Next.js App Router via `@opennextjs/cloudflare` | apps/web。設定: `apps/web/wrangler.toml`。DB への直接アクセス禁止 |
| API | Cloudflare Workers + Hono | apps/api。設定: `apps/api/wrangler.toml`。D1 への唯一のアクセス口 |
| DB | Cloudflare D1 | canonical DB。Workers binding 経由のみアクセス可 |
| フォーム取得 | Google Forms API | 入力源 (non-canonical)。D1 へ同期後は参照不要 |
| 会員認証 | Auth.js + Google OAuth / Magic Link | apps/web 側で処理 |
| パッケージ管理 | pnpm workspace (monorepo) | apps/web, apps/api, packages/* を管理 |

### デプロイ設定ファイル

| ファイル | 対象 | 本番名 | staging 名 |
|---------|------|--------|------------|
| `apps/web/wrangler.toml` | Cloudflare Workers (@opennextjs/cloudflare) | `ubm-hyogo-web` | `ubm-hyogo-web-staging` |
| `apps/api/wrangler.toml` | Cloudflare Workers | `ubm-hyogo-api` | `ubm-hyogo-api-staging` |

GAS prototype は採用スタックではなく、画面確認用のプロトタイプとしてのみ扱う。

---

## リポジトリ構造

```
UBM-Hyogo/                          # pnpm monorepo root
├── apps/
│   ├── web/                        # Cloudflare Workers + Next.js App Router via @opennextjs/cloudflare
│   └── api/                        # Cloudflare Workers + Hono
├── packages/
│   ├── shared/                     # 共通型定義・ユーティリティ
│   └── integrations/               # 外部サービス統合（Google API等）
├── docs/                           # タスク仕様書・設計ドキュメント
│   ├── 00-getting-started-manual/  # プロジェクト起動・仕様のエントリポイント（本ファイル）
│   ├── 01-infrastructure-setup/    # Wave 3〜5: 進行中のインフラタスク群
│   ├── completed-tasks/            # 完了タスク（Wave 0〜2）
│   └── unassigned-task/            # 未割り当て・検討中タスク
├── .github/
│   ├── CODEOWNERS                  # コードオーナー設定
│   └── pull_request_template.md    # PR テンプレート
└── .claude/
    └── settings.json               # Claude Code 権限設定
```

---

## ブランチ戦略

| ブランチ | 対応環境 | PR承認 | CI チェック | force push |
|----------|----------|--------|------------|------------|
| `feature/*` | ローカル (localhost) | 不要 | なし | 禁止 |
| `dev` | staging (Cloudflare staging) | 現行: 不要（個人開発） / 草案: 1名 | 必須 | 禁止 |
| `main` | production (Cloudflare production) | 現行: 不要（個人開発） / 草案: 2名 | 必須 | 禁止 |

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

---

## GitHub Governance

### Branch Protection 設定値

| ブランチ | Required reviews | Status checks | Force push |
|---------|-----------------|---------------|------------|
| `main` | 現行: 0名 / 草案: 2名 + CODEOWNERS + last push approval | 現行: `ci`, `Validate Build` / 草案: 8 target contexts | 禁止 |
| `dev` | 現行: 0名 / 草案: 1名 | 現行: `ci`, `Validate Build` / 草案: 8 target contexts | 禁止 |

- `main` / `dev` への直接 push 禁止。必ず PR 経由でマージする。
- current applied は PR 承認不要。2026-04-28 の GitHub governance 草案では `dev` 1名 / `main` 2名へ強化するが、`spec_created` のため未適用。
- 現行 Status checks（`ci` / `Validate Build`）は既存 workflow に対応。草案の 8 target contexts は後続 CI 実装タスクで実在 job 名へ同期後に有効化する。
- 草案の正本: `.claude/skills/aiworkflow-requirements/references/deployment-branch-strategy.md`
- 設定手順: `docs/01a-parallel-github-and-branch-governance/outputs/phase-05/repository-settings-runbook.md`

### CODEOWNERS（`.github/CODEOWNERS`）

```
*                   @daishiman   # global fallback（全ファイル）
docs/30-workflows/** @daishiman  # workflow / task 仕様書
.claude/skills/**/references/** @daishiman  # 正本仕様書
.github/            @daishiman   # governance ファイル自体
```

### PR テンプレート（`.github/pull_request_template.md`）

PR 作成時に自動適用される。以下をすべて記入・チェックしてからレビューを依頼する。

| 項目 | 内容 |
|------|------|
| True Issue | このPRが解決する本質的な課題のIssue番号 |
| Dependency | 依存する先行タスクのIssue番号 |
| 4条件チェック | **価値性** / **実現性** / **整合性** / **運用性** の4つ全てチェック必須 |
| テスト確認 | CI GREEN / ローカル動作確認 / secret 非混入確認 |

---

## シークレット管理

| シークレット種別 | 管理場所 | 代表的なキー |
|----------------|----------|-------------|
| ランタイムシークレット | Cloudflare Secrets | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `AUTH_SECRET`, `RESEND_API_KEY` 等 |
| CI/CD シークレット | GitHub Secrets | `CLOUDFLARE_API_TOKEN` |
| 非機密設定値 | GitHub Variables | `CLOUDFLARE_ACCOUNT_ID`, ドメイン名、プロジェクト名 |
| ローカル秘密情報の正本 | 1Password Environments | 全シークレット（平文 `.env` はリポジトリにコミットしない） |

詳細: `docs/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` セクション4

---

## Claude Code 設定（`.claude/settings.json`）

| 設定 | 値 | 説明 |
|------|-----|------|
| `defaultMode` | `bypassPermissions` | 許可リスト内のツールは確認なしで自動実行 |
| 出力言語 | 日本語 | 応答・思考プロセス含めすべて日本語 |

**許可ツール（主要）**: `node` / `pnpm` / `git` / `gh` / `find` / `grep` / `sed` / `awk` / `playwright` 等

**禁止操作**（許可リストに関わらず常に禁止）:

| 禁止内容 | 理由 |
|---------|------|
| `.env` ファイル読み取り | シークレット漏洩防止 |
| `rm -rf /` / `rm -rf ~` | 破壊的削除 |
| `curl \| bash` / `wget \| bash` | コードインジェクション |
| SSH キー・AWS 認証情報読み取り | 認証情報保護 |

ツール追加・変更は `update-config` スキルで `.claude/settings.json` を編集する。

---

## 実装フェーズ

| 順序 | 内容 |
|------|------|
| 1 | schema sync と response sync の確立 |
| 2 | `member_identities` と `member_status` を軸にした認証判定 |
| 3 | 公開一覧・詳細と会員マイページの分離 |
| 4 | Google Form 再回答ベースの更新導線 |
| 5 | 開催日・参加履歴・タグ割当キューの管理機能 |

---

## フェーズ2（実装フェーズ）開始条件

以下がすべて完了してからフェーズ2を開始すること：

| # | チェック項目 | 確認方法 | 担当 |
|---|------------|---------|------|
| 1 | Cloudflare D1 作成済み（prod / staging） | `wrangler d1 list` で両 DB が表示される | インフラ |
| 2 | `apps/api/wrangler.toml` の `database_id` に実値を記入 | `wrangler deploy --dry-run` エラーなし | インフラ |
| 3 | monorepo 初期化（`package.json` / `pnpm-workspace.yaml` 作成） | `pnpm install` が通る | BE / FE |
| 4 | CI/CD が typecheck / lint / build を実行する | PR 作成 → GitHub Actions で全ステップ pass | BE |
| 5 | GitHub Actions 値登録（Secret: `CLOUDFLARE_API_TOKEN`, Variable: `CLOUDFLARE_ACCOUNT_ID`） | GitHub Settings で確認 | インフラ |

詳細手順: `docs/completed-tasks/01b-parallel-cloudflare-base-bootstrap/outputs/phase-05/cloudflare-bootstrap-runbook.md`

---

## タスク実行フロー

タスクは Phase 1〜13 の仕様書に分解して `docs/` 配下に配置する。

### ディレクトリ構造

```
docs/{task-id}/
├── index.md              # タスク概要・フェーズ一覧・受け入れ基準
├── artifacts.json        # 成果物台帳（completed / pending の状態管理）
├── phase-01.md           # 要件定義
├── phase-02.md           # 設計
│     ...
├── phase-12.md           # ドキュメント更新・close-out
├── phase-13.md           # PR 作成（ユーザー承認必須）
└── outputs/
    └── phase-{N}/        # 各フェーズの実行成果物
```

### 実行ルール

| ルール | 内容 |
|-------|------|
| Phase 13 は AI 自律実行禁止 | ユーザーが「PR を作成してください」と明示的に指示してから実行 |
| コミット・push 禁止 | ユーザー指示があるまでコミット・push しない |
| same-wave sync | 仕様書変更時は resource-map / LOGS / lessons-learned を同一 wave で更新 |
| 未割り当てタスク登録 | スコープ外で発見した課題は `docs/unassigned-task/` に登録し、優先度・推奨Wave・依存関係を記載する |

### タスク仕様書スキル

タスク仕様書の作成・更新には `task-specification-creator` スキルを使用する。

---
## 参照ドキュメント

| ファイル | 内容 |
|---------|------|
| [01-api-schema.md](./01-api-schema.md) | 31 項目 schema と admin-managed data の境界 |
| [02-auth.md](./02-auth.md) | Google API 認証とログイン判定の前提 |
| [03-data-fetching.md](./03-data-fetching.md) | schema / response / current response の同期設計 |
| [04-types.md](./04-types.md) | 型定義 |
| [06-member-auth.md](./06-member-auth.md) | 会員認証・権限制御 |
| [07-edit-delete.md](./07-edit-delete.md) | 本人更新・公開状態・削除設計 |
| [08-free-database.md](./08-free-database.md) | D1 構成と無料構成 |
| [10-notification-auth.md](./10-notification-auth.md) | ログイン導線と通知補助 |
| [13-mvp-auth.md](./13-mvp-auth.md) | MVP 認証方針 |
