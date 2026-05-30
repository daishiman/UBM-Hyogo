# Phase 1 — 要件定義

## 1. 背景

`/privacy`, `/terms` は現状 `<main>` 直書きでヘッダ / フッタを mount しておらず、公開系ナビゲーション（ホーム・メンバー・登録・session-aware CTA）が消失している。親ワークフロー `public-header-logged-in-nav-cleanup` で導入される logged-in nav 契約に整合させるため、両画面を公開シェルでラップする。

## 2. ユーザー要求

- `/privacy`, `/terms` でも他公開ページと同じヘッダ / フッタを表示する
- ログイン状態に応じて `data-auth-state` が切替り、適切な CTA（マイページ / ログイン）が表示される
- 法務確認済みの本文と metadata は変更しない

## 3. AC（Acceptance Criteria）

| ID | 入力 | 期待 |
|----|------|------|
| AC-C1 | `/privacy` を guest で GET | `data-testid="public-shell"` + `data-component="public-header"` + `data-component="public-footer"` を含む HTML を返す。`data-auth-state="guest"` |
| AC-C2 | `/privacy` を member で GET | `data-auth-state="member"`、`data-role="member-cta"` (`/profile`) が描画される |
| AC-C3 | `/privacy` を admin で GET | `data-auth-state="admin"`、`data-role="admin-cta"` (`/admin`) が描画される |
| AC-C4 | `/terms` を guest / member / admin で GET | `/privacy` と同等の挙動（`data-page="terms"` のみ差分） |
| AC-C5 | `/privacy`, `/terms` の metadata | `title` / `description` が現状と完全一致 |
| AC-C6 | `/privacy`, `/terms` の本文 | LegalProse 配下の `<h1>` / `<h2>` / `<p>` テキストが現状と完全一致 |
| AC-C7 | `getAuthView()` が throw / reject | guest 扱いで fail-closed レンダー（AC-G4 と同契約） |

## 4. スコープ

### 含む
- `apps/web/app/privacy/page.tsx` を async 化し公開シェルでラップ
- `apps/web/app/terms/page.tsx` を同様にラップ
- `apps/web/app/privacy/__tests__/page.spec.tsx` 新規（or 既存編集）
- `apps/web/app/terms/__tests__/page.spec.tsx` 新規（or 既存編集）

### 含まない
- `(public)` route group への移動（最小差分原則で却下）
- `PublicHeader` / `PublicFooter` 本体の改修（Task A 担当）
- LegalProse 本文の更新（法務確認待ち）
- metadata の変更

## 5. 前提依存

- **Task A 完了**: `getAuthView()` ヘルパおよび `PublicHeader` の async 化が実装済みであること
- 既存 `apps/web/src/components/public/PublicHeader.tsx` / `PublicFooter.tsx` の export が利用可能であること

## 6. 非機能要件

- Cloudflare Workers + `@opennextjs/cloudflare` runtime で Server Component として動作
- React 19 async Server Component 互換
- OKLch token 正本（`var(--ubm-color-...)`）のみ使用、HEX 直書き禁止
- 既存 grep gate（design-tokens, test-suffix）を pass
