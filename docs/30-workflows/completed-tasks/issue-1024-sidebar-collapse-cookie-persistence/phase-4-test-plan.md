# Phase 4: テスト計画（TDD Red）

> issue-1024 — sidebar collapse 状態の cookie 永続化

Phase 2 設計（`phase-2-design.md`）を正本として、実装前に書く Red テストケースを定義する。すべて vitest + jsdom 環境（既存 shell 系 spec と同じ）で、`@testing-library/react` の `renderHook` / `act` / `render` を用いる。

## 4.1 テスト対象ファイルとフレームワーク

| テストファイル | 区分 | 対象 |
|----------------|------|------|
| `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（新規） | unit | pure parser / document reader / cookie writer |
| `apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx`（既存更新） | hook | seed 引数・toggle 時 cookie 書込・戻り値 shape・md heuristic |
| `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx`（既存更新） | server component | `cookies()` mock → `initialCollapsed` 伝播 |

focused 実行コマンド:

```bash
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx
```

## 4.2 Red ケース表 — `shell-collapse-cookie.spec.ts`（新規）

| test ID | 対象 | 入力 | 期待 | ファイル |
|---------|------|------|------|---------|
| CK-01 | `readCollapsedFromCookieString` | `"true"` | `true` | shell-collapse-cookie.spec.ts |
| CK-02 | `readCollapsedFromCookieString` | `"false"` | `false` | shell-collapse-cookie.spec.ts |
| CK-03 | `readCollapsedFromCookieString` | `undefined` | `false` | shell-collapse-cookie.spec.ts |
| CK-04 | `readCollapsedFromCookieString` | `"1"` / `"TRUE"` / `""` 等の不正値 | `false`（"true" 厳密一致のみ true） | shell-collapse-cookie.spec.ts |
| CK-05 | `readCollapsedFromDocument` | `document.cookie = "ubm_shell_collapsed=true"` | `true` | shell-collapse-cookie.spec.ts |
| CK-06 | `readCollapsedFromDocument` | `document.cookie = "ubm_shell_collapsed=false"` | `false` | shell-collapse-cookie.spec.ts |
| CK-07 | `readCollapsedFromDocument` | cookie 不在（他 cookie のみ） | `null` | shell-collapse-cookie.spec.ts |
| CK-08 | `readCollapsedFromDocument` | `document.cookie` に複数 cookie（`foo=bar; ubm_shell_collapsed=true; baz=1`） | `true`（該当 entry のみ抽出） | shell-collapse-cookie.spec.ts |
| CK-09 | `writeCollapsedCookie` | `writeCollapsedCookie(true)` | `document.cookie` に `ubm_shell_collapsed=true` を含む | shell-collapse-cookie.spec.ts |
| CK-10 | `writeCollapsedCookie` | `writeCollapsedCookie(false)` | `document.cookie` に `ubm_shell_collapsed=false` を含む | shell-collapse-cookie.spec.ts |
| CK-11 | `SHELL_COLLAPSE_COOKIE` | 定数値 | `"ubm_shell_collapsed"`（`:` を含まない RFC6265 token safe） | shell-collapse-cookie.spec.ts |

> [D-6] jsdom の `document.cookie` は `max-age` / `path` / `samesite` 属性を返却 cookie 文字列へ含めない（getter は `name=value` のみ返す実装差がある）。そのため writer（CK-09/CK-10）の assert は **`name=value` 文字列の含有**に限定する（`expect(document.cookie).toContain("ubm_shell_collapsed=true")`）。属性そのものの検証は実装コードの逐語確認（Phase 5 のコードブロック）に委ね、test では行わない。

### `shell-collapse-cookie.spec.ts` の setup 方針

各 test 前に cookie をクリアする。jsdom では `max-age=0` 書込で expire させるか、`beforeEach` で既知 cookie 名を空書きする。CK-07/CK-08 のため、`document.cookie` への複数書込で fixture を組み立てる。

```ts
beforeEach(() => {
  // jsdom: 既知の cookie を期限切れにしてクリア（個別 name を expire）。
  document.cookie = "ubm_shell_collapsed=; max-age=0; path=/";
  document.cookie = "foo=; max-age=0; path=/";
  document.cookie = "baz=; max-age=0; path=/";
});
```

## 4.3 Red ケース表 — `useSidebarState.spec.tsx`（既存更新）

既存 spec の localStorage アサーション **4 ケース**（L23-28 `toggleCollapsed` で localStorage 反映 / L36-40 localStorage 復元）を cookie 系へ置換する。`vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/") }))` は維持。

| test ID | 対象 | 入力 | 期待 | ファイル |
|---------|------|------|------|---------|
| HS-01 | 初期値（seed 無し） | `useSidebarState()` | `mode === "expanded"` / `drawerOpen === false`（既存維持） | useSidebarState.spec.tsx |
| HS-02 | toggle → cookie 書込（**localStorage assert を置換**） | `useSidebarState()` → `toggleCollapsed()` | `mode === "collapsed"` かつ `document.cookie` に `ubm_shell_collapsed=true` を含む | useSidebarState.spec.tsx |
| HS-03 | drawer setter（既存維持） | `setDrawerOpen(true)` | `drawerOpen === true` | useSidebarState.spec.tsx |
| HS-04 | seed=true → 初期 collapsed（**localStorage 復元 assert を置換**） | `useSidebarState(true)` | `mode === "collapsed"`（mount 直後・effect 補正不要） | useSidebarState.spec.tsx |
| HS-05 | seed=false → 初期 expanded | `useSidebarState(false)` | `mode === "expanded"` | useSidebarState.spec.tsx |
| HS-06 | seed=null → md viewport heuristic（md のみ collapsed） | `matchMedia` を `min-width:768`=true / `min-width:1024`=false に mock、`useSidebarState(null)` | `mode === "collapsed"`（md tablet 帯） | useSidebarState.spec.tsx |
| HS-07 | seed=null → lg では expanded 維持 | `matchMedia` を両 query true に mock、`useSidebarState(null)` | `mode === "expanded"` | useSidebarState.spec.tsx |
| HS-08 | toggle 戻り（collapsed→expanded）で cookie=false | `useSidebarState(true)` → `toggleCollapsed()` | `document.cookie` に `ubm_shell_collapsed=false` を含む | useSidebarState.spec.tsx |
| HS-09 | 戻り値 shape 不変 | `useSidebarState()` の戻り値 | `mode` / `drawerOpen` / `toggleCollapsed`(fn) / `setDrawerOpen`(fn) の 4 key のみ | useSidebarState.spec.tsx |

### localStorage → cookie 置換方針（明示）

- 既存 L11-13 の `window.localStorage.clear()` を `beforeEach` で **cookie クリア**（`document.cookie = "ubm_shell_collapsed=; max-age=0; path=/"`）へ置換する。
- 既存 HS-02 相当の `expect(window.localStorage.getItem("ubm:shell:collapsed")).toBe("true")` を `expect(document.cookie).toContain("ubm_shell_collapsed=true")` へ置換する。
- 既存 HS-04 相当の `window.localStorage.setItem("ubm:shell:collapsed", "true")` による復元検証は **seed 引数 `useSidebarState(true)`** による初期 collapsed 検証へ置換する（cookie 読取りは server seed 経路へ移ったため、hook 自身は localStorage も document.cookie も初期読取りしない）。
- HS-06/HS-07 の `matchMedia` mock は既存 Task E 仕様の踏襲。`window.matchMedia` を `vi.fn` で query 別に返す stub を `beforeEach` で設定し `afterEach` で復元する。

## 4.4 Red ケース表 — `SidebarShell.server.spec.tsx`（既存更新）

既存 4 ケース（TC-04/05/06 + viewer fallback）は維持。`next/headers` の `cookies()` を新規 mock し、seed 伝播 2 ケースを追加する。

| test ID | 対象 | 入力 | 期待 | ファイル |
|---------|------|------|------|---------|
| SV-EXIST | 既存 4 ケース | 現行のまま | 現行どおり pass（cookies() mock 追加後も回帰しない） | SidebarShell.server.spec.tsx |
| SV-01 | cookie collapsed=true → seed 伝播 | `cookies().get` が `{ value: "true" }` を返す mock + admin session | render 結果の `[data-shell-collapsed]` ルートが `"true"`（初回 SSR HTML で collapsed） | SidebarShell.server.spec.tsx |
| SV-02 | cookie 不在 → seed=null（expanded 描画） | `cookies().get` が `undefined` を返す mock | `[data-shell-collapsed]` が `"false"`（seed=null → expanded） | SidebarShell.server.spec.tsx |
| SV-03 | cookie collapsed=false → expanded | `cookies().get` が `{ value: "false" }` を返す mock | `[data-shell-collapsed]` が `"false"` | SidebarShell.server.spec.tsx |

> [D-7] `next/headers` の `cookies()` mock 手順:
>
> ```ts
> vi.mock("next/headers", () => ({
>   cookies: vi.fn(),
> }));
> import { cookies } from "next/headers";
> // 各テストで:
> vi.mocked(cookies).mockResolvedValue({
>   get: vi.fn((name: string) =>
>     name === "ubm_shell_collapsed" ? { name, value: "true" } : undefined,
>   ),
> } as never);
> ```
>
> `cookies()` は Next.js 15+ で `Promise<ReadonlyRequestCookies>` を返すため `mockResolvedValue` を使う。`get()` は `{ name, value }` 形か `undefined` を返す。既存 spec の `beforeEach` で `vi.mocked(cookies).mockReset()` を追加し、デフォルト（cookie 不在）を `get: () => undefined` に設定して回帰を防ぐ。
>
> `[data-shell-collapsed]` の判定は `container.querySelector('[data-shell-root="true"]')?.getAttribute("data-shell-collapsed")` で取得する（`SidebarShell.tsx` のルート div 属性）。

## 4.5 Red 状態の確認

実装前は以下が成立する（fail することで Red を確認）:

- `shell-collapse-cookie.spec.ts`: import 先 `../shell-collapse-cookie` が存在せず module not found で全件 fail。
- `useSidebarState.spec.tsx`: HS-02 の cookie assert / HS-04・HS-05 の seed 引数（現 signature は引数を取らない）で fail。
- `SidebarShell.server.spec.tsx`: SV-01〜03 が `cookies()` 未読取り（現 server entry は cookie を読まない）で fail。

Phase 5 実装後にこれらが全 Green になることを Phase 6 / Phase 9 で確認する。
