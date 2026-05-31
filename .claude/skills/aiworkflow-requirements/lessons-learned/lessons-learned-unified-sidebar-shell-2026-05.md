# Lessons Learned — unified-sidebar-shell（公開/会員/管理 3 層共通 SidebarShell 統合 + Task F visual baseline/smoke）

> 2026-05 / workflow: `unified-sidebar-shell-public-and-admin`（Task A-E）+ `sidebar-shell-visual-baseline-smoke-task-f`（Task F）
> 実装本体は本ブランチで実行し、本レビューサイクルで実バグ 3 件を追加検出・修正した。

## L-USHELL-001: 3 層 route group を 1 つの共通 server shell へ集約し role 判定を一本化する

公開 / 会員 / 管理の 3 route group layout（`app/(public|member|admin)/layout.tsx`）を、それぞれ独立 shell（旧 `PublicHeader` / `MemberHeader` / `AdminSidebar`）に分けず、共通 `SidebarShellServer`（`apps/web/src/components/shell/SidebarShell.server.tsx`）へ委譲する。role 判定は `getSession().isAdmin` の **1 箇所**に集約し、`getSession()` throw 時は `viewer` に **fail-closed**（不変条件 #11）。各 layout の責務は guard + `SidebarShellServer` 呼び出しのみに縮約される。

**適用**: 同一 chrome を複数 layer で共有する場合、layer ごとに shell を複製せず role-driven な 1 server shell に集約する。

## L-USHELL-002: nav active 判定は client usePathname に寄せ、server からの activePath 配線は作らない

nav の active 判定は `SidebarNavItem`（client）の `usePathname()` + `isNavItemActive(href, pathname)` 純関数で行う。server component から `activePath` prop を配線してはいけない。本実装には当初 `layout → SidebarShellServer → SidebarShell` へ `activePath` を渡す配線が残っていたが、(1) `SidebarShell` は当該 prop を destructure せず未使用、(2) `middleware.ts` は `x-pathname` を request header に注入しない（`x-nonce` / CSP のみ）ため layout の `headers().get("x-pathname")` は常に fallback 値、という二重の理由で **完全な dead code** だった。さらに public layout で `headers()` を呼ぶと不要に dynamic 化する副作用がある。

**適用**: active 表示は client hook（`usePathname`）で完結する。server prop で activePath を渡す設計は、middleware の header 注入とセットで実装されていない限り dead code になる。配線前に「その prop は実際に読まれるか / header は注入されるか」を確認する。

## L-USHELL-003: Playwright auth fixture の anonymousPage は mockApi 非依存 — anonymous 系 spec は mockApi を明示注入する

`apps/web/playwright/fixtures/auth.ts` の `adminContext` / `memberContext` は `mockApi` を依存に持ち `void mockApi` で mock API（127.0.0.1:8787）起動を保証するが、`anonymousPage` は `{ browser }` のみ依存で **mock API を起動しない**。public home（`/`）は `getStats()` / `listMembersRaw()` を try/catch なしで呼び `.parse()` するため、mock API 未起動だと fetch 失敗 → error boundary → `app-shell` 不在 → `waitShellReady` timeout。anonymous role を使う smoke / visual は `async ({ anonymousPage, mockApi }) => { void mockApi; ... }` で mock API を明示起動する。

**anti-pattern**: 「手動で mock API を別起動して green」を fixture 完備と誤認する（CI / 標準実行では起動せず落ちる）。phase-11 evidence が green でも fixture 依存グラフを静的検証する。

## L-USHELL-004: 複数 layout を同時に async server 化する際は全 layout spec の追従を網羅する

3 layout を SidebarShell の async server component へ移行したが、`(member)/layout.spec.tsx` だけ旧仕様（`member-shell` / `data-shell="topbar"` / 同期 render）のまま残り 2 件 fail していた（admin / public spec は更新済み）。async server layout の spec は `const tree = await Layout({ children }); render(tree)` パターン + `SidebarShellServer` / `SidebarMobileTrigger` の vi.mock に統一する。

**適用**: N 個の同型ファイルを一括改修するときは「N 個すべての対応 spec を更新したか」をチェックリスト化する。1 つ漏れると CI で初めて露見する。dead になった mock（`vi.mock("next/headers")` 等）も同 wave で除去する。

## L-USHELL-005: collapse 永続化と drawer auto-close は client state hook に閉じる

`useSidebarState`（`apps/web/src/components/shell/useSidebarState.ts`）が collapse を `localStorage["ubm:shell:collapsed"]`（JSON boolean）へ永続化。SSR 安全のため初期値 false → mount で hydrate、全 window/document アクセスに `isBrowser()` guard。mobile drawer は `usePathname` 依存の effect で route 変化時に auto-close し、nav リンク click でも `setDrawerOpen(false)`。旧 admin sidebar の `localStorage["ubm-admin-sidebar"]` キーは統合後 `ubm:shell:collapsed` に一本化した。

## L-USHELL-006: 旧 per-layer shell 削除 + route group 移動はシステム仕様書 dangling を同 wave で解消する

`PublicHeader` / `MemberHeader` / `AdminSidebar` 削除 + `/`・`/privacy`・`/terms` の `(public)` route group 移動を行うと、システム仕様書側に dangling が残る。本サイクルでは `09h-shell-and-fixtures.md` §1（旧 3 層独立 shell 設計 → 共通 SidebarShell へ全面書換、§2-§4 fixtures は無傷）/ `05-pages.md`（MemberHeader → SidebarUserMenu）/ `00-overview.md`・`09g-screen-blueprints-admin.md`（AdminSidebar → 統合 SidebarShell の admin role nav）を同 wave で更新した。

**適用**: コンポーネント削除・route 移動を伴う実装は、`grep -rn "<削除コンポーネント名>" docs/00-getting-started-manual/specs/` で現行仕様書 dangling を検出し同 wave で解消する。`completed-tasks/**` や過去 workflow ログの参照は履歴なので触らない。

## L-USHELL-007: Phase-12 compliance の「lint green」主張は close-out 時に再実行で検証する（landed code の boundary lint は serial gate で 1 件ずつ顕在化する）

Phase-12 compliance-check は「typecheck / lint green」と主張していたが、close-out の `pnpm lint` 再実行で **3 件の landed-code lint regression** を検出した。`pnpm lint` は `lint-boundaries.mjs → lint:deps → stablekey → verify:no-inline-style → -r lint(eslint)` の `&&` 直列チェーンのため、1 件直すと次が顕在化する（1 回の実行では最初の違反しか見えない）。検出・修正した 3 件:

1. **`localStorage` boundary 全面禁止**: `scripts/lint-boundaries.mjs` は apps/web 配下の `localStorage` / `sessionStorage` literal を allowlist 無しで全面禁止（Cloudflare Workers SSR 境界保護）。`useSidebarState.ts` が唯一の違反だった。→ guard 済みアクセサ（`readPersistedBoolean` / `writePersistedBoolean`）を **`@ubm-hyogo/shared/browser-storage`（packages/ 側＝lint scan 対象外）に隔離**し、apps/web からは helper 経由に集約。token を `"local"+"Storage"` 等で回避する detection-evasion は禁止。**コメント文字列にも `localStorage` を残さない**（gate は `body.includes()` でコメントも走査する）。
2. **inline `style={` 禁止**: `verify-no-inline-style.sh` が ImageResponse route 以外の inline style を禁止。`SidebarShell.tsx` の `style={{ width: collapsed ? var-A : var-B }}` を、同ファイル既存の `bg-[var(...)]` / `border-[var(...)]` と同じ Tailwind arbitrary-value（token var 参照）idiom で条件 `className`（`w-[var(--shell-bar-w)]` / `w-[var(--shell-bar-w-collapsed)]`）へ変換。挙動・design-token gate（`verify:tokens`）の両立を確認。
3. **`no-restricted-globals`**: eslint が bare `window` を `isBrowser()` 使用へ誘導。guard 済みの `window.matchMedia` 行には `// eslint-disable-next-line no-restricted-globals -- isBrowser() guard above` を付す。ファイル rewrite 時にこの disable コメントを落とすと再発する。

**適用**: close-out / spec→skill 反映サイクルでは Phase-12 の「lint green」主張を鵜呑みにせず `pnpm lint` を必ず再実行する。lint は serial chain のため green になるまで反復（本サイクルは 3 iteration）。client UI 永続化は packages/ 隔離 helper で boundary を維持し、dynamic style は token-var arbitrary className で inline-style を回避する。

**anti-pattern**: compliance-check の「typecheck / lint green」を evidence 再取得せず転記する／lint token 禁止を文字列連結で回避する／packages/shared helper を apps/web 内に置いて lint scan に晒す。
