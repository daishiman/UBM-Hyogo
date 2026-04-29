# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

`/login` `/profile` 2 page と middleware 間の重複を Before / After 表で整理。fetcher / URL helper / Banner / EditCta / StatusSummary / error.tsx を共通化し、命名と path を spec 用語に揃える。06a / 06c 既存 helper との重複も検査する。

## 実行タスク

1. 共通 fetcher（`fetchAuthed`）の確定
2. URL helper（`loginQuerySchema`, redirect builder）
3. AuthGateState ↔ Banner マッピング共通化
4. profile 用 view-only 表示 component 命名統一
5. spec 用語との一致確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/page-tree.md | 構造 |
| 必須 | outputs/phase-02/data-fetching.md | fetch 設計 |
| 必須 | outputs/phase-07/ac-matrix.md | DRY 候補の優先度 |
| 参考 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives |
| 参考 | doc/00-getting-started-manual/specs/06-member-auth.md | AuthGateState 用語 |

## 実行手順

### ステップ 1: Before / After（fetcher）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| fetch helper（公開） | `apps/web/lib/fetch/public.ts`（06a 既存） | 流用、本タスクでは導入せず | 重複回避 |
| fetch helper（認証付） | `fetch(...)` を `/profile` 直書き | `apps/web/lib/fetch/authed.ts` の `fetchAuthed<T>(path, init?)` | session cookie 転送統一 |
| Magic Link 送信 | `fetch("/api/auth/magic-link", ...)` を MagicLinkForm 直書き | `apps/web/lib/auth/magic-link-client.ts` の `sendMagicLink(email, redirect)` | 不変条件 #5 経由 |
| OAuth 起動 | Auth.js の signin URL 直書き | `apps/web/lib/auth/oauth-client.ts` の `signInWithGoogle(redirect)` | 統一 |

### ステップ 2: Before / After（URL helper）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| login query parser | searchParams を inline で型 narrowing | `apps/web/lib/url/login-query.ts` の `loginQuerySchema` + `parseLoginQuery` | type-safe + zod fallback |
| redirect builder | `\`/login?redirect=${encodeURIComponent(path)}\`` 散在 | `apps/web/lib/url/login-redirect.ts` の `toLoginRedirect(currentPath)` | encode 漏れ防止 |
| state replacer | `history.replaceState(null, "", ...)` 直書き | `apps/web/lib/url/login-state.ts` の `replaceLoginState(state, redirect)` | email を URL から落とす（不変条件 #8 + privacy） |

### ステップ 3: Before / After（命名）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| component | `LoginForm` / `LoginPanel` 揺れ | `LoginPanel`（spec 用語） | 06-member-auth 一致 |
| component | `MagicLinkInput` / `EmailLinkForm` | `MagicLinkForm`（spec 用語） | 13-mvp-auth 一致 |
| component | `ProfileView` / `MyPage` | `ProfilePage`（route と一致） | URL contract 一致 |
| component | `EditButton` / `FormEditCta` | `EditCta`（責務名） | spec 07-edit-delete 一致 |
| component | `Status` / `StatusBadge` | `StatusSummary`（複数項目集約） | 役割明示 |
| props | `gateState` / `state` | `state: AuthGateState`（型統一） | shared types 04-types.md |

### ステップ 4: Before / After（path）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| auth helper | `apps/web/utils/auth.ts` | `apps/web/lib/auth/`（client / server 分離） | layer 名 |
| URL helper | `apps/web/utils/url.ts` | `apps/web/lib/url/`（subject 別 file） | 役割明示 |
| LoginPanel | `apps/web/components/LoginPanel.tsx` | `apps/web/app/login/_components/LoginPanel.client.tsx` | route-local |
| ProfileFields | `apps/web/components/ProfileFields.tsx` | `apps/web/app/profile/_components/ProfileFields.tsx` | route-local |
| StatusSummary | `apps/web/components/StatusSummary.tsx` | `apps/web/app/profile/_components/StatusSummary.tsx` | route-local |
| EditCta | `apps/web/components/EditCta.tsx` | `apps/web/app/profile/_components/EditCta.tsx` | route-local |

### ステップ 5: Before / After（共通 component）

| 種別 | Before | After | 理由 |
| --- | --- | --- | --- |
| Banner | route ごと別 | `@ubm/ui` の `Banner`（00 task で確定） | 再利用 |
| Toast | inline | `@ubm/ui` の `Toast` | 再利用 |
| EmptyState | profile で独自 | `@ubm/ui` の `EmptyState` | 再利用 |
| ErrorBoundary | 各 page 内 | `apps/web/app/error.tsx` + route 別 `error.tsx` | App Router 標準 |

### ステップ 6: spec 用語確認

| 用語 | 採用 | 出典 |
| --- | --- | --- |
| AuthGateState | `input` / `sent` / `unregistered` / `rules_declined` / `deleted` | specs/06-member-auth.md |
| consent キー | `publicConsent` / `rulesConsent`（不変条件 #2） | CLAUDE.md |
| publishState | `public` / `members` / `private` | specs/01-api-schema.md |
| editResponseUrl | Google Form の本人編集 URL（response 単位、null 可） | specs/07-edit-delete.md |
| responderUrl | Google Form の新規回答 URL（CLAUDE.md 固定値） | CLAUDE.md |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の擬似コード命名を更新（`LoginPanel`, `MagicLinkForm`, `ProfilePage`, `StatusSummary`, `EditCta`） |
| Phase 9 | typecheck / lint で命名統一を確認 |
| Phase 12 | system-spec-update-summary に命名規則を記録 |

## 多角的チェック観点

- 不変条件 #1: stableKey 経由参照を `ProfileFields` の props 設計で固定
- 不変条件 #2: ステップ 6 で `publicConsent` / `rulesConsent` 表記を確定
- 不変条件 #4: `EditCta` は唯一の編集導線、本文編集 form は導入候補に出ない
- 不変条件 #5: `fetchAuthed` / `sendMagicLink` / `signInWithGoogle` がすべて apps/api または `/api/auth/*` 経由
- 不変条件 #6: 共通 helper 内に `window.UBM` 参照なし
- 不変条件 #7: `fetchAuthed` の Generic に `MeView` / `MemberProfile` を渡し、responseId と memberId を型で分離
- 不変条件 #8: URL helper の入口は `loginQuerySchema.safeParse`、localStorage 経路なし

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | fetcher Before / After | 8 | pending | 4 件 |
| 2 | URL helper Before / After | 8 | pending | 3 件 |
| 3 | 命名 Before / After | 8 | pending | 6 件 |
| 4 | path Before / After | 8 | pending | 6 件 |
| 5 | 共通 component | 8 | pending | Banner / Toast / EmptyState / error |
| 6 | spec 用語確認 | 8 | pending | 5 用語 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before / After + 共通化 + spec 用語一致 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] 4 種以上の Before / After が表化
- [ ] spec 用語と一致を確認
- [ ] 共通 component の path 確定
- [ ] 06a 既存 helper との重複ゼロ

## タスク100%実行確認【必須】

- 全 6 サブタスクが completed
- outputs/phase-08/main.md 配置
- 不変条件 #1, #2, #4, #5, #6, #7, #8 への対応が明記
- 次 Phase へ統一名称を typecheck / lint の入力に渡す

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ事項: 統一名称 `LoginPanel` / `MagicLinkForm` / `ProfilePage` / `StatusSummary` / `EditCta` を ESLint rule の検査対象に
- ブロック条件: 命名揺れまたは 06a helper との重複が残るなら進まない
