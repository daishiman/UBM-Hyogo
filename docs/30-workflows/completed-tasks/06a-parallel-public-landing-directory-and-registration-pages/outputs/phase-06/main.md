# Phase 6 成果物 — 異常系検証

## 概要

公開 4 ルートに対する異常系（404 / 422 / 5xx / sync 失敗 / 検索 0 件 / 不正 query / 大量 tag / leak 試行）を網羅し、期待挙動を固定する。

## failure cases

| ID | 入力 | 期待 status | 期待 UI | 実装対応 | 不変条件 |
| --- | --- | --- | --- | --- | --- |
| F-01 | `/members/UNKNOWN` | 404 | `not-found.tsx` | `MemberDetailPage` が `notFound()` 呼び出し | - |
| F-02 | `/public/members/:id` 5xx | 500 | `error.tsx`「再試行」 | `fetchPublicOrNotFound` が throw → boundary | #5 |
| F-03 | `/public/members` 5xx | 500 | `error.tsx` | `fetchPublic` throw → boundary | #5 |
| F-04 | `/members?density=invalid` | 200 | density=`comfy` fallback | zod `catch("comfy")` | #8 |
| F-05 | `/members?zone=foo` | 200 | zone=`all` fallback | zod `catch("all")` | - |
| F-06 | `/members?tag=` 50 件 | 200 | 5 件 truncate | `parseSearchParams` の slice(0,5) | - |
| F-07 | `/members?q=<長文>` | 200 | q を 200 文字 truncate | zod transform | - |
| F-08 | `/public/form-preview` 5xx | 200 | warning + responderUrl のみ表示 | `RegisterPage` try/catch + `previewError` | - |
| F-09 | non-public member detail | 404 | API hide → `notFound()` | 04a 信頼 + `FetchPublicNotFoundError` | #5 |
| F-10 | deleted member detail | 404 | 同上 | 同上 | #5 |
| F-11 | `publicConsent != consented` | 404 | 同上 | 同上 | #5 |
| F-12 | `publishState != public` | 404 | 同上 | 同上 | #5 |
| F-13 | 検索結果 0 件 | 200 | EmptyState + 「絞り込みをクリア」(`/members` へ) | `MembersPage` で `items.length === 0` 分岐 | - |
| F-14 | API 接続失敗 (DNS) | 500 | `error.tsx` | global error boundary | #5 |
| F-15 | localStorage に query 退避試行 | lint error | - | ESLint rule（placeholder） | #8 |

## 不適格メンバー leak 検証

- F-09〜F-12 は 04a 側で hide される設計（fail-close）
- apps/web は独自 filter を持たず、`fetchPublicOrNotFound` の 404 を `notFound()` に変換するのみ
- 不変条件 #5: apps/web に追加 filter を入れない（04a の hide を信頼）

## form-preview 障害

- F-08: `/register` は responderUrl への遷移を最優先する
- preview 取得失敗時も `FALLBACK_RESPONDER_URL` を表示し、登録導線を維持
- preview セクション表示は省略し、warning メッセージを `role="alert"` で出す

## 検索 0 件 UX

- F-13: `EmptyState` component が `resetHref="/members"` で「絞り込みをクリア」CTA を提供
- specs/09-ui-ux.md と一致

## サブタスク

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | F-01〜F-03 HTTP 異常 | completed |
| 2 | F-04〜F-07 query 異常 | completed |
| 3 | F-08 form-preview 障害 | completed |
| 4 | F-09〜F-12 leak 防止 | completed |
| 5 | F-13 0 件 UX | completed |
| 6 | F-14 API 接続失敗 | completed |
| 7 | F-15 localStorage 阻止 | designed (ESLint placeholder) |

## 完了条件

- [x] F-01〜F-15 が網羅
- [x] 各 case に期待 status / UI が明記
- [x] leak 防止が 04a 信頼ベースで設計
- [x] error boundary 配置の方針あり (`apps/web/app/error.tsx` 配置)
