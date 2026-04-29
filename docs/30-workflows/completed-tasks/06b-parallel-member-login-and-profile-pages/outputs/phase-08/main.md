# Phase 08 outputs: DRY 化

## サマリ

`/login` `/profile` 2 page と middleware 間の重複を Before / After 表で整理。fetcher（`fetchAuthed`）/ URL helper（`loginQuerySchema` / `toLoginRedirect` / `replaceLoginState`）/ 命名（`LoginPanel` / `MagicLinkForm` / `ProfilePage` / `StatusSummary` / `EditCta`）/ path（route-local `_components/`）/ 共通 component（Banner / Toast / EmptyState / error）/ spec 用語の 6 種を統一。

## Before / After（fetcher）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| fetch helper（公開） | `apps/web/lib/fetch/public.ts`（06a 既存） | 流用、本タスクでは導入せず | 重複回避 |
| fetch helper（認証付） | `fetch(...)` を `/profile` 直書き | `apps/web/lib/fetch/authed.ts` の `fetchAuthed<T>(path, init?)` | session cookie 転送統一 |
| Magic Link 送信 | `fetch("/api/auth/magic-link", ...)` を MagicLinkForm 直書き | `apps/web/lib/auth/magic-link-client.ts` の `sendMagicLink(email, redirect)` | 不変条件 #5 経由 |
| OAuth 起動 | Auth.js の signin URL 直書き | `apps/web/lib/auth/oauth-client.ts` の `signInWithGoogle(redirect)` | 統一 |

## Before / After（URL helper）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| login query parser | searchParams を inline で型 narrowing | `apps/web/lib/url/login-query.ts` の `loginQuerySchema` + `parseLoginQuery` | type-safe + zod fallback |
| redirect builder | `` `/login?redirect=${encodeURIComponent(path)}` `` 散在 | `apps/web/lib/url/login-redirect.ts` の `toLoginRedirect(currentPath)` | encode 漏れ防止 |
| state replacer | `history.replaceState(null, "", ...)` 直書き | `apps/web/lib/url/login-state.ts` の `replaceLoginState(state, redirect)` | email を URL から落とす（不変条件 #8 + privacy） |

## Before / After（命名）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| component | `LoginForm` / `LoginPanel` 揺れ | `LoginPanel`（spec 用語） | 06-member-auth 一致 |
| component | `MagicLinkInput` / `EmailLinkForm` | `MagicLinkForm`（spec 用語） | 13-mvp-auth 一致 |
| component | `ProfileView` / `MyPage` | `ProfilePage`（route と一致） | URL contract 一致 |
| component | `EditButton` / `FormEditCta` | `EditCta`（責務名） | spec 07-edit-delete 一致 |
| component | `Status` / `StatusBadge` | `StatusSummary`（複数項目集約） | 役割明示 |
| props | `gateState` / `state` | `state: AuthGateState`（型統一） | shared types 04-types.md |

## Before / After（path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| auth helper | `apps/web/utils/auth.ts` | `apps/web/lib/auth/`（client / server 分離） | layer 名 |
| URL helper | `apps/web/utils/url.ts` | `apps/web/lib/url/`（subject 別 file） | 役割明示 |
| LoginPanel | `apps/web/components/LoginPanel.tsx` | `apps/web/app/login/_components/LoginPanel.client.tsx` | route-local |
| ProfileFields | `apps/web/components/ProfileFields.tsx` | `apps/web/app/profile/_components/ProfileFields.tsx` | route-local |
| StatusSummary | `apps/web/components/StatusSummary.tsx` | `apps/web/app/profile/_components/StatusSummary.tsx` | route-local |
| EditCta | `apps/web/components/EditCta.tsx` | `apps/web/app/profile/_components/EditCta.tsx` | route-local |

## Before / After（共通 component）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| Banner | route ごと別 | `@ubm/ui` の `Banner`（00 task で確定） | 再利用 |
| Toast | inline | `@ubm/ui` の `Toast` | 再利用 |
| EmptyState | profile で独自 | `@ubm/ui` の `EmptyState` | 再利用 |
| ErrorBoundary | 各 page 内 | `apps/web/app/error.tsx` + route 別 `error.tsx` | App Router 標準 |

## spec 用語確認

| 用語 | 採用 | 出典 |
| --- | --- | --- |
| AuthGateState | `input` / `sent` / `unregistered` / `rules_declined` / `deleted` | specs/06-member-auth.md |
| consent キー | `publicConsent` / `rulesConsent`（不変条件 #2） | CLAUDE.md |
| publishState | `public` / `members` / `private` | specs/01-api-schema.md |
| editResponseUrl | Google Form の本人編集 URL（response 単位、null 可） | specs/07-edit-delete.md |
| responderUrl | Google Form の新規回答 URL（CLAUDE.md 固定値） | CLAUDE.md |

## 不変条件チェック

- #1 / #2 / #4 / #5 / #6 / #7 / #8 すべて 6 種の Before / After で担保
