# Manual Test Result

Status: `implemented_local_evidence_captured / local_pixel_partial_captured / staging_pixel_pending_user_gate`

## evidence 境界（メタを厚く: Feedback 4）

本タスクは **VISUAL**。実コード・direct focused Vitest・typecheck・lint・grep gate は本サイクルで完了した。
local Playwright screenshot capture は、認証不要の `/login` / viewer public shell / mobile drawer で取得済み。
admin 認証・API Worker・D1 を要する staging visual baseline は **user-gated runtime wave** に残す。

これは「running staging 環境依存」による two-tier 後段化であり、スコープ縮小ではない。
canonical ファイル名は本ファイルで確定済み（下表）。

## 主ソース: local deterministic evidence（実測）

実行コマンド:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)" "apps/web/app/(admin)/layout.spec.tsx" \
  "apps/web/src/components/shell" \
  "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" \
  "apps/web/src/__tests__/static-invariants.runtime.spec.ts" \
  "apps/web/__tests__/middleware.spec.ts"
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
```

| spec ファイル | 検証内容 | AC | 状態 |
| --- | --- | --- | --- |
| `apps/web/app/(auth)/login/__tests__/page.spec.tsx` | 移動後 `/login` が `data-testid="public-shell"` / `aside` を持たず bare 描画 | AC-1/2 | PASS |
| `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts` | invariant: `(auth)/layout.tsx` が shell primitive を import しない / `(public)/login` 不在 | AC-2/8 | PASS |
| `apps/web/__tests__/middleware.spec.ts` | `NextResponse.next` 経路の request header に `x-pathname` を注入 | AC-4 | PASS |
| `apps/web/app/(admin)/layout.spec.tsx` | `activePath` を `x-pathname` から解決（`/admin` ハードコード撤廃） | AC-5 | PASS |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | role="viewer" で「ゲスト」「未ログイン」表記 + ログイン CTA を描画 | AC-6 | PASS |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | active 時 `aria-current="page"` + 視認可能スタイル / badge | AC-7 | PASS |
| `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | `buildNavForRole` / `isNavItemActive` 既存回帰 | 回帰 | PASS |

実測結果: direct focused suite `20 files / 98 tests PASS`、typecheck PASS、lint PASS、design-token gate PASS。

## local screenshot evidence（実測）

実行環境: `pnpm --filter @ubm-hyogo/web dev`（`http://localhost:3000`） + Playwright Chromium。

| ファイル | route / 状態 | DOM 検証 | 状態 |
| --- | --- | --- | --- |
| `screenshots/login-bare.png` | `/login` bare | `aside=false`, `public-shell=false`, `auth-shell[data-shell-mode=bare]`, `data-theme=warm`, `h1=会員ログイン` | present |
| `screenshots/sidebar-viewer-guest.png` | `/` desktop viewer sidebar | `aside=true`, `public-shell[data-shell-mode=sidebar]`, user menu text=`Gゲスト未ログインログイン`, login CTA present | present |
| `screenshots/sidebar-viewer-guest-mobile.png` | `/` mobile viewer initial | mobile viewport 390x844 | present |
| `screenshots/sidebar-mobile-drawer.png` | `/` mobile drawer open | mobile trigger clicked, login CTA present, user menu text=`Gゲスト未ログインログイン` | present |

## screenshot canonical 名一覧（実装サイクルで取得・ファイル名固定）

| TC-ID | ロール | route | 状態 | スクリーンショット | 状態 |
| --- | --- | --- | --- | --- | --- |
| TC-01 | 不問 | `/login` | bare（shell 無し）| `screenshots/login-bare.png` | present（local Playwright） |
| TC-02 | viewer | `/` | sidebar expanded | `screenshots/sidebar-viewer-guest.png` | present（local Playwright） |
| TC-03 | viewer | `/` | mobile initial | `screenshots/sidebar-viewer-guest-mobile.png` | present（local Playwright） |
| TC-04 | viewer | `/members/[id]` | member 公開ページ | pending（staging/runtime user-gated） | pending |
| TC-05 | admin | `/admin` | active=ダッシュボード | pending（admin auth user-gated） | pending |
| TC-06 | admin | `/admin/members` | active=members（SSR）| pending（admin auth user-gated） | pending |
| TC-07 | admin | `/admin` | schema badge 表示 | pending（admin auth + API/D1 user-gated） | pending |
| TC-08 | viewer | `/` | mobile drawer open | `screenshots/sidebar-mobile-drawer.png` | present（local Playwright） |

> TC-ID は本テーブル（metadata）にのみ保持し、ファイル名には焼き込まない（FB-LLM-MOD-05-001）。

## runtime boundary

| Boundary | Status |
| --- | --- |
| Phase 1-13 仕様（route topology + middleware + shell UX 設計）| present（本サイクル）|
| apps/web 実コード（`(auth)` 移動 / middleware x-pathname / admin activePath / viewer identity / active 視認性）| completed |
| direct focused vitest（AC-1〜8 検証）| PASS（20 files / 98 tests）|
| typecheck / lint（AC-9）| PASS |
| local pixel screenshots | 4 PNG present（`/login`, viewer desktop, viewer mobile, mobile drawer）|
| staging/admin pixel screenshots | pending（staging 認証 user-gated）|
| staging visual baseline | pending（user-gated）|
| commit / push / PR | pending（user-gated）|
