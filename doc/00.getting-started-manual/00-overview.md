# UBM兵庫支部会 メンバーサイト - 設計概要

> **目的**: Google Forms で集めたプロフィールを、フォーム変更に追従しながらメンバー専用 Web サイトで共有する
> **コスト**: 初期・運用ともに **JPY 0 前提**
> **本番ターゲット**: Cloudflare Workers + D1
> **パッケージマネージャー**: pnpm

---

## 推奨スタック

2026-04-09 時点での推奨構成:

| 役割 | 技術 | 採用バージョン |
|------|------|----------------|
| フレームワーク | Next.js | `16.2.3` |
| UI基盤 | React / React DOM | `19.2.5` |
| Cloudflare連携 | `@opennextjs/cloudflare` | `1.18.1` |
| ランタイム | Cloudflare Workers | Free plan |
| データベース | Cloudflare D1 | Free plan |
| 認証 | Auth.js (`next-auth`) | `5.0.0-beta.30` (stable latest: `4.24.13`) |
| Google API | googleapis | `171.4.0` |
| スタイル | Tailwind CSS | `4.2.2` |
| PostCSS | `@tailwindcss/postcss` | `4.2.2` |
| Typography | `@tailwindcss/typography` | `0.5.19` |
| UIコンポーネント | shadcn CLI / shadcn/ui | `4.2.0` |
| アイコン | lucide-react | `1.8.0` |
| バリデーション | zod | `4.3.6` |
| フォーム | react-hook-form | `7.72.1` |
| フォーム補助 | @hookform/resolvers | `5.2.2` |
| 通知 | resend | `6.10.0` |
| トースト | sonner | `2.0.7` |
| 検索UI | cmdk | `1.1.1` |
| 文字列ユーティリティ | clsx / tailwind-merge | `2.1.1` / `3.5.0` |

Workers 上で full-stack Next.js を動かす前提に統一する。Cloudflare Pages はこの案件では使わない。

---

## 全体像

```text
Google Forms
  -> Forms API forms.get
  -> Forms API forms.responses.list

Cloudflare Workers (Next.js 16.2.3 via OpenNext)
  -> schema sync
  -> response sync
  -> Auth.js
  -> member UI / admin UI

Cloudflare D1
  -> form_manifests
  -> form_fields
  -> form_field_aliases
  -> member_responses
  -> profile_overrides
  -> member_status
  -> deleted_members
  -> admin_users
  -> magic_tokens
  -> tag_definitions
  -> tag_rules
  -> member_tags
  -> sync_jobs
```

設計の軸は 4 つです。

1. Google Form の構造をコードに固定しない
2. `questionId` が変わっても `stableKey` と schema version で追従する
3. 表示用データと編集差分を分離して、元回答を壊さない
4. 公開状態・削除状態・同期状態は D1 の `member_status` を正本にする

---

## 主な機能

| 機能 | 内容 |
|------|------|
| 一覧・詳細表示 | `publicConsent=consented` かつ `member_status.is_public=true` かつ `member_status.is_deleted=false` のメンバーだけ表示 |
| 動的フォーム追従 | schema sync によりフォーム変更を自動検知 |
| 回答同期 | Forms API の回答を D1 に正規化保存 |
| Googleログイン | フォーム回答済みメールだけ許可 |
| プロフィール編集 | 本人のみ override を保存 |
| 管理者機能 | 表示/非表示、削除/復元、schema 差分確認、タグルール運用 |
| タグ自動化 | 業種タグのルールベース分類と手動補正 |
| 通知 | 認証用マジックリンクと必要時のみの運用通知 |

---

## 画面の責務

| 項目 | 正本 |
|------|------|
| フォーム構造 | Google Forms API `forms.get` |
| フォーム回答 | Google Forms API `forms.responses.list` |
| ユーザー編集差分 | D1 `profile_overrides` |
| 公開/削除状態 | D1 `member_status` |
| 削除履歴 | D1 `deleted_members` |
| 管理者権限 | D1 `admin_users` |
| タグ辞書 | D1 `tag_definitions` / `tag_rules` / `member_tags` |

---

## 画面構成

```text
/                  top / login guide
/login             Google login + magic link
/no-access         no profile / no rule consent / deleted
/members           member list
/members/[id]      member detail
/profile           my profile
/profile/edit      my profile edit
/admin/members     member control
/admin/schema      schema diff / sync status
/admin/tags        tag dictionary / rules
```

---

## アクセス権限

| ページ | 未ログイン | 一般メンバー | 管理者 |
|--------|:---------:|:-----------:|:------:|
| トップ・ログイン | ✅ | ✅ | ✅ |
| メンバー一覧・詳細 | ❌ | ✅ | ✅ |
| 自分のプロフィール | ❌ | ✅ | ✅ |
| 自分のプロフィール編集 | ❌ | ✅（本人のみ） | ✅ |
| 管理者ページ | ❌ | ❌ | ✅ |

管理者が編集できるのは以下に限定する。

1. メンバーの公開/非公開
2. メンバーの削除/復元
3. schema 差分とタグルールの運用

プロフィール本文の直接編集は本人のみ。管理者は本文を直接書き換えず、公開状態・削除状態・同期状態だけを扱う。

---

## フォームの前提

2026-04-09 時点での必須 `stableKey`:

1. `publicConsent` - ホームページ掲載同意
2. `ruleConsent` - 利用規約・勧誘ルール同意

これらは UI 文言が変わっても `stableKey` を維持する。
`questionId` が変わった場合は schema sync で再紐付けし、未解決なら管理画面に警告を出す。

---

## Google Form 変更への対応方針

| 変更内容 | 対応 |
|----------|------|
| 質問文変更 | `questionId` が同じなら自動追従 |
| 質問追加 | `extraFields` として保持し、管理者が `stableKey` を採番 |
| 質問削除 | 旧回答は保持、UI では inactive 扱い |
| 並び替え | `position` 更新のみ |
| 選択肢変更 | 新 version として保存し、選択肢差分を管理画面に表示 |
| `questionId` 変更 | `stableKey` 再解決ルールで吸収、失敗時は pending mapping |

回答データは削除しない。schema が変わっても、過去 version の payload を保持する。

---

## 実装フェーズ

| 順序 | 内容 | 目安 |
|:----:|------|------|
| 1 | Workers + D1 + OpenNext 構築 | 1日 |
| 2 | Forms schema sync + response sync | 1〜2日 |
| 3 | Auth.js + Google login + magic link | 1〜2日 |
| 4 | 一覧・詳細・本人表示 | 2〜3日 |
| 5 | 本人編集 + 管理者削除/再表示 | 2〜3日 |
| 6 | 検索・タグ・UI/UX 仕上げ | 2〜3日 |

---

## ドキュメント一覧

| # | ファイル | 内容 |
|---|---------|------|
| 01 | [01-api-schema.md](./01-api-schema.md) | フォーム質問ID・stableKey・schema同期方針 |
| 02 | [02-auth.md](./02-auth.md) | Google API サービスアカウント認証 |
| 03 | [03-data-fetching.md](./03-data-fetching.md) | schema / response / override の取得とマージ |
| 04 | [04-types.md](./04-types.md) | TypeScript 型定義 |
| 05 | [05-pages.md](./05-pages.md) | ページ構成・画面遷移 |
| 06 | [06-member-auth.md](./06-member-auth.md) | ログイン認証・管理者ロール |
| 07 | [07-edit-delete.md](./07-edit-delete.md) | プロフィール編集・削除設計 |
| 08 | [08-free-database.md](./08-free-database.md) | Cloudflare 無料構成・セットアップ手順 |
| 09 | [09-ui-ux.md](./09-ui-ux.md) | デザイン方針・UIコンポーネント仕様 |
| 10 | [10-notification-auth.md](./10-notification-auth.md) | メール通知・マジックリンクログイン |
| 11 | [11-admin-management.md](./11-admin-management.md) | 管理者権限の追加・管理方法 |
| 12 | [12-search-tags.md](./12-search-tags.md) | 検索・業種タグ・フィルター設計 |
| 13 | [13-mvp-auth.md](./13-mvp-auth.md) | MVP 認証方針 |

### 関連ファイル

| ファイル | 内容 |
|---------|------|
| [../terms-and-rules.md](../terms-and-rules.md) | 利用規約・勧誘ルール |
| [../01-design.md](../01-design.md) | フォーム設計情報 |
| [../02-result.md](../02-result.md) | フォーム作成結果・URL |
