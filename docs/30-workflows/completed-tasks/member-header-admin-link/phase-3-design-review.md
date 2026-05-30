# Phase 3 — Design Review

## 1. 不変条件適合チェック

| # | 不変条件 | 適合状況 |
|---|---------|----------|
| 1 | 既存 API のみ接続 | OK（`getSession()` 上の薄い `getAuthView()` / `AuthView` を追加。D1 直接接続なし） |
| 2 | D1 直接アクセス禁止 | OK（DB 触らず） |
| 3 | HEX 直書き禁止 | OK（既存 className のみ。新規スタイル追加なし） |
| 4 | `data-testid="member-header"` 維持 | OK（明示保持） |
| 5 | fail-closed | OK（authView 未指定 / guest / getSession throw → `data-auth-state="member"` 最小描画） |
| 6 | PII 非露出 | OK（`data-auth-state` は `"member"|"admin"` リテラルのみ） |
| 7 | テストは `*.spec.tsx` のみ | OK（`MemberHeader.spec.tsx`） |
| 8 | プロトタイプ primitives 不変 | OK（既存 className 流用） |

## 2. 既存資産衝突マトリクス

| 既存資産 | 衝突有無 | 対処 |
|---------|----------|------|
| `MemberHeader.tsx`（既存実装） | 編集 | props 追加・admin 分岐 JSX 追加のみ。既存 JSX 構造を保持 |
| `(member)/layout.tsx`（既存実装） | 編集（sync → async） | `await getAuthView()` 追加。children 配信 / data-* 属性は不変 |
| `SignOutButton.tsx` | 不変 | 既存 import を維持 |
| `src/lib/auth-view/*` | 新規 | Task A 依存の最小境界を本 cycle で実装。PublicHeader async 化は親 workflow に残す |
| 既存 spec / e2e | 不変 | regression テスト（AC-E5）で既存 3 要素存在を担保 |

## 3. 親 workflow との整合

- 親 workflow `public-header-logged-in-nav-cleanup` Task A の `AuthView` 型 / `getAuthView()` のうち、本 workflow に必要な最小基盤を先行実装した。
- 親 Task G（横断 e2e）が本タスクの `data-auth-state` / `data-role="admin-cta"` 契約を検証する前提。本 workflow では DOM 契約を変えない。

## 4. 過剰設計の排除

- 「管理リンクの URL を `authView.adminHref` から取る」設計案は採用しない。リテラル `/admin` で固定し、不要な間接化を避ける。
- 「fail-closed フラグを prop で受ける」設計案は採用しない。layout 側で error boundary に委譲する既存設計に従う。
- 「`SignOutButton` を condition でラップ」は不要（既存通り常時表示）。

## 5. レビュー判定

設計は単一責務（admin link の condition 表示）に閉じており、既存契約・既存 SSOT を破壊しない。Phase 4 へ進行可。
