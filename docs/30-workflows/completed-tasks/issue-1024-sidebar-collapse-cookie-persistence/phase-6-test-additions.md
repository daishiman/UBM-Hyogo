# Phase 6: テスト追加（fail path / 回帰 guard）

> issue-1024 — sidebar collapse 状態の cookie 永続化

Phase 4（Red 計画）を Green にした後に積み増す、異常系・回帰防止の観点を定義する。Phase 2 設計の不変条件（I-1〜I-7）を guard 化する。

## 6.1 fail path / 異常系ケース

| test ID | 観点 | 入力 / 条件 | 期待 | ファイル |
|---------|------|------------|------|---------|
| FP-01 | cookie 不正値（"true" 厳密一致以外は false） | `parseShellCollapsedCookie("yes")` / `"1"` / `"True"` / `" true"` | すべて `false` | shell-collapse-cookie.spec.ts |
| FP-02 | 空文字 value | `parseShellCollapsedCookie("")` | `false` | shell-collapse-cookie.spec.ts |
| FP-03 | document に該当 cookie 名の prefix 部分一致 trap | `document.cookie = "ubm_shell_collapsed_x=true; ubm_shell_collapsed=false"` | `readCollapsedFromDocument()` は `false`（`startsWith("ubm_shell_collapsed=")` で `=` まで含めて一致） | shell-collapse-cookie.spec.ts |
| FP-04 | SSR で document 不在 → reader null | `browserDocument()` が `undefined` を返す環境（`isBrowser()` false 相当を mock） | `readCollapsedFromDocument()` が `null` | shell-collapse-cookie.spec.ts |
| FP-05 | SSR で document 不在 → writer noop | 同上で `writeShellCollapsedCookie(true)` | throw せず（noop 完了）、副作用なし | shell-collapse-cookie.spec.ts |
| FP-06 | hook: matchMedia 不在環境（seed=null） | `window.matchMedia` を `undefined` に、`useSidebarState(null)` | `mode === "expanded"`（heuristic skip・throw しない） | useSidebarState.spec.tsx |
| FP-07 | hook: seed=null かつ cookie も無し（初回訪問・lg） | matchMedia 両 false（mobile）相当 | `mode === "expanded"`（md 帯以外は collapsed にしない） | useSidebarState.spec.tsx |

> FP-04/FP-05 の `browserDocument()` undefined 化は、`vi.mock("@/lib/is-browser", ...)` で `browserDocument` を `vi.fn(() => undefined)` に差し替えるか、`isBrowser` を false に固定する mock を用いる。jsdom 既定では document が存在するため、明示 mock が必要。

## 6.2 回帰 guard（不変条件の固定）

| test ID | 守る不変条件 | 検証内容 | ファイル |
|---------|-------------|---------|---------|
| RG-01 | I-1 戻り値 shape 不変 | `useSidebarState()` の戻り値が `mode` / `drawerOpen` / `toggleCollapsed` / `setDrawerOpen` の 4 key のみ（過不足なし） | useSidebarState.spec.tsx |
| RG-02 | I-1 後方互換（引数省略可） | `useSidebarState()`（引数なし呼び出し）が従来どおり動作（既定 seed=null） | useSidebarState.spec.tsx |
| RG-03 | Task E md heuristic 維持 | seed=null + md 帯（768≤w<1024）で初期 collapsed（HS-06 の恒久 guard） | useSidebarState.spec.tsx |
| RG-04 | I-7 hydration mismatch 非発生 | seed=true の mount 直後 `mode === "collapsed"` で、effect 後も値が変化しない（client 再読取りで上書きしない） | useSidebarState.spec.tsx |
| RG-05 | server seed 既存挙動の非回帰 | `SidebarShell.server.spec.tsx` の既存 4 ケース（TC-04/05/06 + viewer fallback）が cookies() mock 追加後も pass | SidebarShell.server.spec.tsx |
| RG-06 | I-3 endpoint/D1 不変 | server entry が cookie 以外の新規 fetch を追加していない（既存 `safeServerFetch("/admin/schema/diff")` のみ。grep で確認） | 手動 grep（6.4） |

### RG-04 の検証方針（hydration mismatch 非発生）

`renderHook(() => useSidebarState(true))` で初期レンダ直後に `mode === "collapsed"` を assert し、その後 `act` で effect を flush しても `mode` が `"collapsed"` のまま変化しないことを確認する。これにより「SSR で確定した seed を client mount が上書きしない（再読取りしない）」契約を固定する。逆に seed=false でも mount 後 `"expanded"` のまま（md heuristic は seed≠null では発火しない）を確認する。

## 6.3 補助コマンド

```bash
# 本タスク 3 spec を個別 focused 実行
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx

# shell ディレクトリ配下の spec を一括実行（回帰確認）
pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/

# 型 / lint
pnpm typecheck
pnpm lint
```

## 6.4 既存 shell 系 spec の回帰確認リスト

本タスクは `useSidebarState` / `SidebarShell` / `SidebarShell.server` を編集するため、これらを直接 / 間接に通る既存 spec が回帰しないことを確認する:

| spec | 回帰観点 |
|------|---------|
| `__tests__/useSidebarState.spec.tsx` | seed 引数化後も drawer / toggle / 初期値が従来どおり（更新済み） |
| `__tests__/SidebarShell.spec.tsx` | `initialCollapsed` 追加（optional）後も既存 render が pass（prop 省略時 `null` 既定で挙動不変） |
| `__tests__/SidebarShell.server.spec.tsx` | `cookies()` mock 追加後も既存 4 ケース pass（更新済み） |
| `__tests__/SidebarDrawer.spec.tsx` | drawer open/close 挙動（hook 経由）が無影響 |
| `__tests__/SidebarMobileTrigger.spec.tsx` | trigger → setDrawerOpen 経路が無影響 |
| `__tests__/shell-config.spec.ts` / `user-menu-config.spec.ts` / `SidebarUserMenu.spec.tsx` | cookie 変更と無関係（純粋回帰確認） |

> `SidebarShell.spec.tsx` は `initialCollapsed` を渡さない既存呼び出しのままで pass する想定（optional + 既定 null）。必要に応じて seed=true を渡したときに `[data-shell-collapsed="true"]` になる 1 ケースを追記してもよいが、本タスクの最小スコープでは server spec（SV-01）で seed 伝播を担保済みのため必須ではない。

## 6.5 完了判定（本 Phase）

- 6.1 fail path 全件 Green。
- 6.2 回帰 guard 全件 Green。
- 6.4 の既存 shell spec が全 pass（回帰ゼロ）。
- `pnpm typecheck` / `pnpm lint` green、`grep` による localStorage 撤廃確認（Phase 5.8）0 件。
