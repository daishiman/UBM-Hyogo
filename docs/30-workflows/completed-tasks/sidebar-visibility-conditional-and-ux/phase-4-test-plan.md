# Phase 4: テスト計画

> 本 Phase は `sidebar-visibility-conditional-and-ux` の **テスト計画（TDD Red 設計）**。
> 実装着手前（Phase 5）に、T1（login の `(auth)` group 移動・bare 化）/ T2（middleware `x-pathname` 注入・admin activePath 解決）/ T3（viewer identity・active/badge 視認性）を検証する unit / component / invariant test の期待挙動を確定する。
> 実コード（route 移動・middleware 修正・shell 分岐強化）は Phase 5 で行う。

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 1 要件（FR-1〜5 / AC-1〜9 / T1〜T3）, Phase 2 設計（topology / x-pathname / shell UX） |
| 出力 | TC-ID 表（TC-T1-xx / TC-T2-xx / TC-T3-xx）, SSR/private テスト方針, targeted run コマンド |
| テスト方式 | vitest（jsdom） + `@testing-library/react`。co-location `*.spec.{ts,tsx}`（不変条件 #8: `.test.*` 禁止） |
| 実行前提 | リポジトリルートから実行（CLAUDE.md）。Node 24 固定（`mise exec --`） |

## 目的

サイドバー表示条件の単一正本化（route group）・SSR active 正確化・viewer/active/badge 視認性の各 AC を、実装前に Red として固定する。テストは以下を狭く検証する:

- **T1**: `/login` を render しても shell（`aside` / `data-testid="public-shell"`）が出ない。`(auth)/layout.tsx` が `SidebarShellServer` を import しない。`(public)/login` が不在で `(auth)/login` が存在する（route topology invariant）。URL `/login` は不変（既存 login query / redirect テストが green を維持）。
- **T2**: middleware が全 request の request header に `x-pathname` を乗せる。`(admin)/layout.tsx` が `/admin` ハードコードを撤廃し `x-pathname` から `activePath` を解決する（fallback `/admin`）。
- **T3**: viewer 時 `SidebarUserMenu` が「ゲスト」表記 + ログイン CTA を強調し member/admin と視覚区別される。active nav item が `aria-current="page"` + 視認スタイル、admin schema badge が視認可能。

## テスト対象と命名規則整合

| 種別 | 配置 | 規則 |
|------|------|------|
| login page（移動後） | `apps/web/app/(auth)/login/__tests__/page.spec.tsx`（既存 `(public)/login/__tests__/page.spec.tsx` を `git mv` で追従） | 既存拡張子・配置を維持 |
| login layout bare 化 | `apps/web/app/(auth)/login/__tests__/login-page.spec.tsx`（新規・shell 非表示観点） | `*.spec.tsx` のみ |
| route topology invariant | `apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`（新規） | static fs/grep 検証 |
| middleware x-pathname | `apps/web/src/__tests__/middleware-x-pathname.spec.ts`（新規） | `*.spec.ts` |
| admin layout activePath | `apps/web/app/(admin)/layout.spec.tsx`（新規 or 既存編集） | co-location |
| viewer identity | `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（編集） | 既存追補 |
| active / badge | `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（編集） | 既存追補 |
| 既存回帰 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` / `SidebarShell.server.spec.tsx` | 無変更で green 維持 |

> 命名規則は Phase 1「既存コードベースの命名規則」表に整合。新規 wrapper ディレクトリ（`__tests__/(auth)-...`）は作らず、対象と同階層へ配置する。

## テストケース一覧

### TC-T1: route topology / login bare 化

| TC-ID | 対象ファイル | external prop / internal state | 前提 | 操作 | 期待結果 | AC |
|-------|-------------|-------------------------------|------|------|----------|-----|
| TC-T1-01 | `(auth)/login/__tests__/login-page.spec.tsx` | — (render 観測) | `getSession`→null（既存 mock 流用）。`next/navigation` の `redirect` を throw stub | `render(await LoginPage({ searchParams: Promise.resolve({}) }))` | `screen.queryByTestId("public-shell")` が **null**、`container.querySelector("aside")` が **null** | AC-1 |
| TC-T1-02 | 同上 | — | 同上 | render 後 DOM 走査 | login カード見出し「会員ログイン」は存在（bare でも page 本体は描画） | AC-1 |
| TC-T1-03 | `(auth)/login/__tests__/login-page.spec.tsx` | — | `(auth)/layout.tsx` を直接 `render(<AuthLayout>{child}</AuthLayout>)` | layout 単体 render | wrapper に `data-shell-mode="bare"` / `data-route-group="auth"` / `data-testid="auth-shell"` が付与され、内部に `aside` / `data-testid="public-shell"` が無い | AC-1/AC-2 |
| TC-T1-04 | `src/__tests__/sidebar-shell-route-topology.spec.ts` | — (fs invariant) | リポジトリ FS を `node:fs` で参照 | `existsSync("apps/web/app/(auth)/login/page.tsx")` | `true` | AC-2 |
| TC-T1-05 | 同上 | — (fs invariant) | 同上 | `existsSync("apps/web/app/(auth)/layout.tsx")` | `true` | AC-2 |
| TC-T1-06 | 同上 | — (fs invariant) | 同上 | `existsSync("apps/web/app/(public)/login")` | `false`（旧パス撤去済み） | AC-2 |
| TC-T1-07 | 同上 | — (grep invariant) | `(auth)/layout.tsx` を `readFileSync` | ファイル内容に `SidebarShellServer` / `SidebarShell.server` / `SidebarMobileTrigger` を含むか検査 | いずれも **含まない**（bare 保証） | AC-2 |
| TC-T1-08 | 同上 | — (grep invariant) | `(auth)/layout.tsx` を `readFileSync` | `data-shell-mode="bare"` を含むか検査 | **含む**（DOM 契約宣言） | AC-1/AC-2 |
| TC-T1-09 | `(auth)/login/__tests__/page.spec.tsx`（移動後） | external (searchParams prop) | 既存 6 ケース（anonymous render / authenticated redirect /profile / safe next / array next / unsafe next fallback / loop 防止） | `git mv` 後そのまま実行 | 既存アサーションが全て green（URL `/login` 契約・redirect 契約不変） | AC-3 |

### TC-T2: SSR active 正確化（middleware x-pathname / admin activePath）

| TC-ID | 対象ファイル | external prop / internal state | 前提 | 操作 | 期待結果 | AC |
|-------|-------------|-------------------------------|------|------|----------|-----|
| TC-T2-01 | `src/__tests__/middleware-x-pathname.spec.ts` | external（NextRequest） | env / `decodeAuthSessionJwt` を mock。unguarded path（例 `/members`）の `NextRequest` を構築 | `await middleware(req)` を呼び、`NextResponse.next` に渡った request headers を観測（`vi.spyOn(NextResponse, "next")` で引数捕捉） | `request.headers.get("x-pathname")` が `"/members"` | AC-4 |
| TC-T2-02 | 同上 | external | guarded path `/profile` + 有効 session claims mock | `await middleware(req)` | next 経路の request headers に `x-pathname="/profile"` が乗る | AC-4 |
| TC-T2-03 | 同上 | external | guarded path `/admin` + isAdmin=false（forbidden redirect） | `await middleware(req)` | redirect レスポンス（`response.headers.get("location")` が `/login?...`）。redirect には x-pathname を **要求しない**（request header 注入が redirect を壊さない） | AC-4 |
| TC-T2-04 | 同上 | external | unguarded path（深いパス `/members/abc?q=1`） | `await middleware(req)` | `x-pathname` は **query を含まない** `/members/abc`（`req.nextUrl.pathname`） | AC-4 |
| TC-T2-05 | 同上 | external | 任意 path | `await middleware(req)` | 既存 `x-nonce` / `Content-Security-Policy` の request header が引き続き乗る（回帰保護） | AC-4 |
| TC-T2-06 | `(admin)/layout.spec.tsx` | external（headers mock） | `next/headers` の `headers()` を stub し `get("x-pathname")→"/admin/members"`。`getSession`→admin。`SidebarShellServer` / `SidebarMobileTrigger` を `vi.mock` でスタブ | `render(await AdminLayout({ children }))` | shell スタブに渡った `activePath` が `"/admin/members"`（`[data-active-path="/admin/members"]`） | AC-5 |
| TC-T2-07 | 同上 | external（headers mock） | `headers().get("x-pathname")→null`（未注入） | `render(await AdminLayout({ children }))` | `activePath` が fallback `"/admin"`（`?? "/admin"`） | AC-5 |
| TC-T2-08 | `src/__tests__/sidebar-shell-route-topology.spec.ts`（grep invariant） | — | `(admin)/layout.tsx` を `readFileSync` | `activePath="/admin"`（ハードコード文字列）を含まないこと | リテラル `activePath="/admin"` が **不在**（fallback の `?? "/admin"` は別表現で許容。検査は `activePath="/admin"` 直接代入の不在に限定） | AC-5 |

### TC-T3: shell UX（viewer identity / active / badge）

| TC-ID | 対象ファイル | external prop / internal state | 前提 | 操作 | 期待結果 | AC |
|-------|-------------|-------------------------------|------|------|----------|-----|
| TC-T3-01 | `SidebarUserMenu.spec.tsx` | external（`role` prop 駆動） | `next/navigation.usePathname`→`/`。`role="viewer"`, `user={null}` | `render(<SidebarUserMenu role="viewer" user={null} collapsed={false} />)` | 「ゲスト」ラベルが描画され、`data-shell-block="login-cta"`（または `[data-action="login"]`）が存在 | AC-6 |
| TC-T3-02 | 同上 | external | role="viewer" | render | viewer のサブラベルに「未ログイン」が描画される（member/admin の role ラベルと文言が異なる） | AC-6 |
| TC-T3-03 | 同上 | external | role="viewer" | render | `[data-testid="sign-out-button"]` が **null**（viewer は signout を持たない・既存契約維持） | AC-6 |
| TC-T3-04 | 同上 | external | role="viewer", collapsed | `render(... collapsed={true})` | login CTA が collapsed で icon + `sr-only` ラベル（CTA 文字列を持つ要素が `sr-only` class を持つ） | AC-6 |
| TC-T3-05 | 同上 | external | role="member"（既存）/ role="admin"（既存） | render | viewer の identity ブロックと member/admin の identity ブロックが視覚区別される（viewer は「ゲスト」固定文言、member/admin は displayName）。既存 member/admin ケースは green 維持（回帰保護） | AC-6 |
| TC-T3-06 | `SidebarNavItem.spec.tsx` | external（`item` / `activePath` prop） | `usePathname`→`/admin/members`。内部 item `href="/admin/members"` | `render(<ul><SidebarNavItem .../></ul>)` | active link が `aria-current="page"` かつ `data-active="true"`（既存アサーション維持 = 回帰保護） | AC-7 |
| TC-T3-07 | 同上 | external | 非 active item（`href="/admin/tags"`、pathname `/admin/members`） | render | `aria-current` が **null**、`data-active="false"` | AC-7 |
| TC-T3-08 | 同上 | external | active item, collapsed | `render(... collapsed={true})` | active を collapsed でも識別可能（active link が `data-active="true"` を保持し、active 用 class が collapsed でも適用される） | AC-7 |
| TC-T3-09 | 同上 | external | badge 付き item（`badge={ count: 3, tone: "warn" }`、collapsed=false） | render | badge 数値 `3` が描画され、tone=warn が `Chip` の warning として可視 | AC-7 |
| TC-T3-10 | 同上 | external | badge 付き item, collapsed | `render(... collapsed={true})` | collapsed 時 badge 数値が `sr-only`（dot 縮約・既存挙動維持） | AC-7 |

> external / internal の方針（VSCPKR-03）: 本タスクの被テスト分岐は全て **external prop（role / item / activePath / searchParams）駆動の純表示**。viewer 表記・active・badge は内部 state ではなく prop で確定するため、`Object.defineProperty` での global 差し替えは不要（`window.api` 系を触る分岐は存在しない）。テストは prop を直接渡して観測する。

## private/SSR テスト方針

- **Server Component（layout / page）の jsdom テスト**: `(auth)/layout.tsx` / `LoginPage` / `AdminLayout` はいずれも server component。`render(await AuthLayout({ children }))` / `render(await LoginPage({ searchParams }))` / `render(await AdminLayout({ children }))` の **`await` 呼び出し → JSX 解決 → render** 形式で評価する（既存 `(public)/login/__tests__/page.spec.tsx` の `render(await LoginPage(...))` に追従）。
- **`headers()` モック方針**: `(admin)/layout.spec.tsx` は `vi.mock("next/headers", () => ({ headers: vi.fn(async () => headerStore) }))` で stub し、`headerStore.get` を per-case で `"/admin/members"` / `null` に切替えて x-pathname あり / fallback の両 branch を踏む（Phase 4 task-c の headers stub 方式を踏襲）。
- **shell スタブ**: admin layout テストは `SidebarShellServer` を `vi.mock` でスタブ化し、受け取った `activePath` を `data-active-path` 属性に転写して観測する。shell 内部（role 判定 / nav / schema-diff-count）は本タスクのテスト対象外（Task A/B の責務）。
- **`window.api` 等のモック禁止事項**: 本タスクには `window.api` 依存分岐が無いため当該モックは不要。仮に global を触る必要が出た場合も `vi.stubGlobal("window", ...)` は禁止し `Object.defineProperty(window, ...)` を使う（不変条件）。
- **middleware テスト**: edge runtime の `NextRequest` / `NextResponse` を直接 import し、`vi.spyOn(NextResponse, "next")` で `next({ request: { headers } })` の引数を捕捉して request header 注入を観測する。env / `decodeAuthSessionJwt` / security-headers は `vi.mock` でスタブし、CSP 計算副作用を切る。
- **境界値テスト文字列**（W0-RV-001）: x-pathname として深いパスや query 付きパスを使う場合は `// length: N`（例: `"/members/abc?q=1" // length: 16`）を付し、`pathname` が query を含まないことの境界を明示する。

## targeted run コマンド

全件 run は避ける（FB-UI-02-2）。worktree 直後は `mise exec -- pnpm install` → `mise exec -- pnpm verify:vitest-runtime` を先に通す（FB-MSO-002 / Issue #747）。

```bash
# T1/T2/T3 をまとめて focused run（移動後パス基準・リポジトリルートから）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)/login" \
  "apps/web/app/(admin)/layout.spec.tsx" \
  "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" \
  "apps/web/src/__tests__/middleware-x-pathname.spec.ts" \
  "apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx" \
  "apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx"

# 個別実行例
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/__tests__/middleware.spec.ts"
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/app/(admin)/layout.spec.tsx"
```

> 移動前（Phase 5 着手前）は login spec の path が `apps/web/app/(public)/login/...`。Phase 5 の `git mv` 後に上記 `(auth)` パスへ統一する。

## TDD Red 期待結果（実装前の fail 想定）

| 新規 / 変更アサーション | 実装前の結果 | Red の理由 |
|---|---|---|
| TC-T1-01/02/03 login bare | fail | login は現在 `(public)/login/` 配下で shell（`(public)/layout.tsx`）に被るため `aside` / `public-shell` が DOM に出る。`(auth)/layout.tsx` 未作成 |
| TC-T1-04/05 新パス存在 | fail | `(auth)/login/page.tsx` / `(auth)/layout.tsx` が未作成（移動前） |
| TC-T1-06 旧パス不在 | fail | `(public)/login/` がまだ存在 |
| TC-T1-07/08 layout grep | fail | `(auth)/layout.tsx` が無いため検査対象不在 |
| TC-T2-01..05 x-pathname | fail | middleware は現在 `x-nonce` / CSP のみ設定し `x-pathname` を注入しない |
| TC-T2-06/07 admin activePath | fail | `(admin)/layout.tsx` は `activePath="/admin"` ハードコードで headers を読まない |
| TC-T2-08 grep | fail | `activePath="/admin"` ハードコードがソースに残存 |
| TC-T3-01/02/04 viewer ゲスト/CTA | fail | 現状 `SidebarUserMenu` は viewer でも displayName fallback「ゲスト」を出すのみで「未ログイン」サブラベル / `login-cta` 強調 / collapsed sr-only CTA が未実装 |
| TC-T3-03/05..10 | 一部 green（回帰） | active `aria-current` / badge / viewer signout 不在は現状実装済み → 回帰保護として green 維持（Phase 6 へ trace） |

> 現状 `SidebarNavItem` は `aria-current="page"` / `data-active` を既に実装済み（T3 の active 部分は主に視認スタイル + collapsed 識別性の確認 = 回帰保護）。Red の主軸は T1（topology）/ T2（x-pathname）/ T3 viewer identity。

## 参照資料

- Phase 1 要件定義（FR-1〜5 / AC-1〜9 / T1〜T3 / targeted test ファイルリスト）
- Phase 2 設計（route topology / `(auth)/layout.tsx` 設計 / 表示条件マトリクス / x-pathname 注入 / viewer・active・badge UX）
- 着手前状態: `apps/web/middleware.ts`, `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(public)/login/page.tsx`, `apps/web/src/components/shell/SidebarUserMenu.tsx` / `SidebarUserAvatar.tsx` / `SidebarNavItem.tsx` / `user-menu-config.ts`
- 既存 spec: `apps/web/app/(public)/login/__tests__/page.spec.tsx`, `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` / `SidebarUserMenu.spec.tsx`
- 09h-shell-and-fixtures.md §1.6（route→shell 表示条件マトリクス）
- 参考テスト構造: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-4-test-plan.md`（headers stub / async layout render 方式）

## 完了条件

- [ ] TC-T1-xx / TC-T2-xx / TC-T3-xx の各ケースが AC-1〜AC-9 へ trace されている
- [ ] 各 TC に「external prop / internal state」区分が明記されている（VSCPKR-03）
- [ ] login bare 化検証（`public-shell` / `aside` 不在）と route topology invariant（`(auth)` 存在 + `(public)/login` 不在 + layout が shell を import しない）が確定している
- [ ] middleware `x-pathname` 注入の観測方針（`NextResponse.next` 引数捕捉）が確定している
- [ ] SSR / async server component の render 方式と `headers()` モック方針が明記されている
- [ ] targeted run コマンド（全件 run 回避）が確定している
- [ ] TDD Red 期待結果（実装前 fail 想定）が示されている
