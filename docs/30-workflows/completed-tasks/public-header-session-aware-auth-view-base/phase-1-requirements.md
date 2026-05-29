# Phase 1 — 要件定義

**[実装区分: 実装仕様書]** / **implementation_mode: `new`** / **taskType: UI task (VISUAL)**

## 1. 目的

`PublicHeader` のヘッダースロットをログイン状態（guest / member / admin）に応じて出し分ける基盤を整える。`AuthView` 型・`resolveAuthView()` 純関数・`getAuthView()` 取得ヘルパを後続タスク（B/C/E/G）と共有可能な再利用基盤として確立する。

## 2. 背景・現状

- 現在の `PublicHeader.tsx` は session を参照せず常に「ログイン」CTA のみ表示。
- 公開ルート群（`/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms`）配下からマイページ動線が無く、ログイン済ユーザーが再ログイン経由でしか `/profile` に到達できない。
- `(public)/layout.tsx` は同期 server component で `getAuth()` を呼んでいない。

## 3. スコープ（含む / 含まない）

| 区分 | 内容 |
|------|------|
| 含む | `AuthView` 型 / `resolveAuthView()` / `getAuthView()` / `PublicHeader` async 化 / `(public)/layout.tsx` 配線 / それらの unit test |
| 含まない | `/` `/privacy` `/terms` `/login` などのレイアウト整合（後続 Task B 以降）/ MemberHeader / AdminSidebar / Playwright cross-route spec / staging runtime visual |

## 4. 受入条件（AC）

| # | 条件 |
|---|------|
| AC-01 | `resolveAuthView()` が `null`→guest / 空 memberId→guest / memberId 有→member / memberId+isAdmin→admin の 4 分岐に純関数として閉じる |
| AC-02 | `getAuthView()` が `getAuth().auth()` 例外を握り潰し guest として返す（fail-closed） |
| AC-03 | `PublicHeader` が async server component として render され、`<header data-auth-state="guest\|member\|admin">` を必ず付与 |
| AC-04 | guest: `/login` link を 1 つ表示。member/admin: `/profile` (`data-role="member-cta"`) + `SignOutButton` を表示。admin はさらに `/admin` (`data-role="admin-cta"`) を追加 |
| AC-05 | `(public)/layout.tsx` が async になり `<PublicHeader authView={await getAuthView()} />` を配信 |
| AC-06 | 既存 nav（brand + 3 link）・`aria-current="page"` 挙動が回帰しない |
| AC-07 | unit test 7+ ケース pass。typecheck / lint green |

## 5. 既存コード命名規則（FB-01 / FB-SDK-07-4 対応）

| 区分 | 規則 | 例 |
|------|------|----|
| ファイル | kebab-case | `resolveAuthView.ts`（既存 `safeServerFetch.ts` 等と整合） |
| 型 | PascalCase | `AuthView`, `SessionLike` |
| 関数 | camelCase | `resolveAuthView`, `getAuthView` |
| barrel | `index.ts` で named re-export | 既存 `apps/web/src/lib/env.ts` 周辺と整合 |
| testid / data-role | kebab-case literal | `data-role="auth-cta"`, `data-auth-state="member"` |

## 6. タスク分類

- **UI task (VISUAL)**: PublicHeader の描画 DOM が変わるため、Phase 11 は VISUAL（screenshot 3 状態: guest / member / admin）。
- session 取得失敗系は NON_VISUAL 補助テストで担保。

## 7. carry-over 確認

- 親 workflow（`public-header-logged-in-nav-cleanup`）の Phase 5 spec が Task A 含むが本実装ディレクトリは未生成。本タスクは Task A 単体の Phase 1-13 実装仕様書としての切り出し。
- 衝突する旧ファイル無し（`apps/web/src/lib/auth-view/` 自体が新規）。

## 8. 不変条件参照

- CLAUDE.md invariant #5（D1 アクセス禁止）— 対象外（DB 触らない）
- CLAUDE.md invariant #11（auth 境界 fail-closed）— AC-02 で適用
- invariant: HEX 直書き禁止（CI gate `verify-design-tokens`）

## 9. 出力

- `phase-1-requirements.md`（本ファイル）
