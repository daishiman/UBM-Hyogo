# Phase 3 — Design Review（横断版）

## 1. 不変条件チェックマトリクス

| 不変条件 | A | B | C | D | E | F | G |
|---------|---|---|---|---|---|---|---|
| 既存 API のみ (`getAuth().auth()` / `getSession()`) | OK | OK | OK | OK | OK | OK | OK（read のみ） |
| D1 直接アクセス禁止 | OK | OK | OK | OK | OK | OK | OK |
| OKLch トークン | OK | OK | OK | OK | OK | OK | N/A |
| Server/Client 境界 | OK | OK | OK | OK | OK | OK | N/A |
| fail-closed | OK (`getAuthView` try/catch) | 同上 | 同上 | OK (`getSession` null → 通常表示) | OK | OK | N/A |
| PII 非露出 (`data-auth-state` のみ) | OK | OK | OK | OK | OK | OK | OK |
| 命名 `*.spec.{ts,tsx}` | OK | OK | OK | OK | OK | OK | OK |
| プロトタイプ非改訂 | OK | OK | OK | OK | OK | OK | OK |

## 2. 既存資産衝突マトリクス

| ファイル | 影響 Task | 種別 |
|---------|----------|------|
| `apps/web/src/components/public/PublicHeader.tsx` | A | 全面書き換え（async + AuthView 受領） |
| `apps/web/app/(public)/layout.tsx` | A | async 化 + `<PublicHeader authView />` |
| `apps/web/app/page.tsx` | B | `await getAuthView()` 追加 + `<PublicHeader authView />` |
| `apps/web/app/privacy/page.tsx` | C | `<PublicHeader authView />` + `<PublicFooter />` を直接 mount + async 化 |
| `apps/web/app/terms/page.tsx` | C | 同上 |
| `apps/web/app/login/page.tsx` | D | 先頭で `await getSession()` → `redirect` |
| `apps/web/src/lib/url/safe-next.ts` | D | 新規（純関数） |
| `apps/web/src/components/layout/MemberHeader.tsx` | E | `authView` prop 受領 + admin リンク |
| `apps/web/app/(member)/layout.tsx` | E | async 化 + `<MemberHeader authView />` |
| `apps/web/src/components/layout/AdminSidebar.tsx` | F | 「公開サイトに戻る」リンク追加 |
| `apps/web/src/lib/auth-view/*` | A (基盤) | 新規 3 ファイル |
| `apps/web/playwright/tests/auth-slot-coverage.spec.ts` | G | 新規 e2e |

## 3. リスクと緩和

| # | リスク | 緩和 |
|---|--------|------|
| R1 | async server component を Vitest で render する際の API 変化 | `authView` を prop 注入することで session 取得経路を完全に切り離し、戻り値 JSX.Element を `await Component(props)` で取得して同期 `render` に渡す |
| R2 | `(public)/layout.tsx` の async 化が `(public)` 配下既存ページの SSR を壊す | layout を `async` にしても children はそのまま JSX で受け取れる。Next.js App Router 標準動作 |
| R3 | `/login` で `searchParams.next` を素通しすると open redirect | `safeNext()` 純関数で `/` 始まり・`//` で始まらない・`:` を含まないパスのみ通す。fallback `/profile` |
| R4 | `MemberHeader` を `authView?` optional にすると admin リンクが描画されないケースがある | `(member)/layout.tsx` で常に `await getAuthView()` を渡す。未注入時は admin リンク非表示（既存挙動と同等） |
| R5 | session 取得が複数 layout で重複呼出 | layout 単位で 1 回。root `/`・`/privacy`・`/terms` は page で 1 回。`React.cache` は導入しない |
| R6 | Playwright fixture (admin storageState) が未整備 | 既存 `apps/web/playwright/fixtures/auth.ts` を確認し、未整備なら Task G 内で `playwright/.auth/{member,admin}.json` を生成する手順を明記 |
| R7 | `data-auth-state` を既存 visual baseline が拾って snapshot diff を出す | data-* 属性は visual baseline の対象外（既存 `playwright.config.ts` の規約）。念のため Task G で初回 baseline 更新を許容 |
| R8 | AdminSidebar への「公開サイトに戻る」追加が既存 a11y test を壊す | 既存 `AdminSidebar.spec.tsx` を更新し、新リンクの存在 / role を assert |

## 4. レビュー結論

採用設計（共通 `AuthView` + 純関数 + layout/page で 1 回 fetch）で 7 タスクすべて適用可。`tasks/task-{a..g}-*.md` に確定実装手順を記述する。

## 5. タスク間依存関係

```
Task A (PublicHeader async + AuthView 基盤)
  ├── Task B (Root /)
  ├── Task C (/privacy /terms)
  ├── Task D (/login redirect)        ※ AuthView 不要、getSession のみ
  ├── Task E (MemberHeader admin link)
  ├── Task F (AdminSidebar public return)
  └── Task G (e2e)  ← A-F すべての DOM 契約確定後
```

- A は B/C/E/G の前提
- D/F は A に並行可能
- G は最後
