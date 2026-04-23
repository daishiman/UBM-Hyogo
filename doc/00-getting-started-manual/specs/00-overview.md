# UBM兵庫支部会 メンバーサイト - 設計概要

> 目的: Google Form の実回答を正本にしつつ、公開ディレクトリと会員・管理バックオフィスを最小構成で成立させる
> 前提: 実フォームは 31 項目・6 セクション、`formId=119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg`
> 本番ターゲット: Cloudflare Pages (apps/web) + Cloudflare Workers (apps/api) + D1

---

## この仕様の立ち位置

- `doc/00-getting-started-manual/claude-design-prototype/` はフロントエンドの画面・導線の参照元
- `doc/00-getting-started-manual/google-form/` はフォーム構造と利用規約の参照元
- `doc/00-getting-started-manual/gas-prototype/` は UI の叩き台であり、本番の認証・API・DB 正本ではない

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

apps/web (Cloudflare Pages)
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
| Web (UI) | Cloudflare Pages + Next.js App Router | apps/web。DB への直接アクセス禁止 |
| API | Cloudflare Workers + Hono | apps/api。D1 への唯一のアクセス口 |
| DB | Cloudflare D1 | canonical DB。Workers binding 経由のみアクセス可 |
| フォーム取得 | Google Forms API | 入力源 (non-canonical)。D1 へ同期後は参照不要 |
| 会員認証 | Auth.js + Google OAuth / Magic Link | apps/web 側で処理 |
| パッケージ管理 | pnpm workspace (monorepo) | apps/web, apps/api, packages/* を管理 |

GAS prototype は採用スタックではなく、画面確認用のプロトタイプとしてのみ扱う。

---

## ブランチ戦略

| ブランチ | 対応環境 | PRレビュー | force push |
|----------|----------|------------|------------|
| `feature/*` | ローカル (localhost) | 不要 | 禁止 |
| `dev` | staging (Cloudflare staging) | 1名 | 禁止 |
| `main` | production (Cloudflare production) | 2名 | 禁止 |

```
feature/* --PR--> dev --PR--> main
  (local)       (staging)   (production)
```

---

## シークレット管理

| シークレット種別 | 管理場所 | 代表的なキー |
|----------------|----------|-------------|
| ランタイムシークレット | Cloudflare Secrets | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `AUTH_SECRET`, `RESEND_API_KEY` 等 |
| CI/CD シークレット | GitHub Secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| 非機密設定値 | GitHub Variables | ドメイン名、プロジェクト名 |
| ローカル秘密情報の正本 | 1Password Environments | 全シークレット（平文 `.env` はリポジトリにコミットしない） |

詳細: `doc/00-serial-architecture-and-scope-baseline/outputs/phase-02/canonical-baseline.md` セクション4

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
