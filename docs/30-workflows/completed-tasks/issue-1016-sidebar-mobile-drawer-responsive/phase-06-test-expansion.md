# Phase 6 — テスト拡充

Phase 4 のハッピーパスに対し、fail path / cleanup / 境界 / SSR 安全性 の回帰 guard を追加する。対象は本タスクで変更したファイルの分岐に限定する（無関係領域は拡張しない）。

## 拡充対象と追加ケース

### A. `SidebarDrawer.spec.tsx` — cleanup / listener / fail path

| # | ケース | 操作 | 期待 | 根拠 |
|---|--------|------|------|------|
| E-DR-1 | unmount 時 body 属性除去 | open=true で render → `unmount()` | `document.body` に `data-shell-drawer-open` が残らない（effect cleanup 動作） | AC-6 / leak guard |
| E-DR-2 | unmount 時 keydown listener 除去 | open=true で render → `unmount()` → Esc dispatch | `onClose` が呼ばれない（listener が解除済） | AC-4 / leak guard |
| E-DR-3 | open=false で listener 非登録 | open=false で render → Esc dispatch | `onClose` が呼ばれない（`open` false 時 effect 早期 return） | AC-4 |
| E-DR-4 | open=false で body 属性付与しない | open=false で render | `document.body` に `data-shell-drawer-open` が無い | AC-6 |
| E-DR-5 | open: false→true→false の連続遷移 | `rerender` で 3 段 | 最終で body 属性除去 / Esc で onClose 呼ばれない | AC-6 / 多重 toggle guard |
| E-DR-6 | focusable 不在でも throw しない | open=true、children に focusable 無し | render が例外を投げず dialog は表示（`?.focus()` の optional chain） | AC-7 / robustness |

> `afterEach` で `document.body.removeAttribute("data-shell-drawer-open")` を実行し、テスト間リークを排除する（E-DR-* が前ケースの残骸を拾わないため）。

### B. `useSidebarState.spec.tsx` — 境界 / route 連続 / 破損値 / SSR

| # | ケース | 前提（mock） | 操作 | 期待 | 根拠 |
|---|--------|--------------|------|------|------|
| E-SS-1 | 境界 767px（md 未満 = sm） | matchMedia: `(min-width:768px)` false / `(min-width:1024px)` false、localStorage 空 | `renderHook` | `mode === "expanded"`（sm は collapsed にしない） | AC-8 境界 |
| E-SS-2 | 境界 768px（md 下端） | `768` true / `1024` false、localStorage 空 | `renderHook` | `mode === "collapsed"` | AC-8 境界 |
| E-SS-3 | 境界 1023px（md 上端） | `768` true / `1024` false、localStorage 空 | `renderHook` | `mode === "collapsed"` | AC-8 境界 |
| E-SS-4 | 境界 1024px（lg 下端） | `768` true / `1024` true、localStorage 空 | `renderHook` | `mode === "expanded"` | AC-8 境界 |
| E-SS-5 | route 連続変化で都度 close | `setDrawerOpen(true)` → `/a` → `setDrawerOpen(true)` → `/b` | 各 `rerender` 後 | 各 route 変化後に `drawerOpen === false` | AC-5 連続 |
| E-SS-6 | localStorage 破損値 → matchMedia へ fallback しない | `localStorage[KEY]="garbage"` + matchMedia md | `renderHook` | `mode === "expanded"`（`raw !== null` だが parse 失敗時は false 返却。md 判定に落とさない既存 catch を維持） | AC-8 / 破損値 |
| E-SS-7 | matchMedia throw 耐性 | `matchMedia` が throw する mock + localStorage 空 | `renderHook` | `mode === "expanded"`（`try/catch` で false） | robustness |

> E-SS-6 の挙動確認: 現 `readInitialCollapsed` の設計では「localStorage に値が存在（`raw !== null`）するが parse 不能」のとき `catch` で `false` を返し matchMedia へは進まない。Phase 5 実装でこの分岐順序（localStorage 存在判定 → parse → 失敗で false / 未存在のみ matchMedia）を保持していることを E-SS-6 で固定する。

### C. SSR 安全性（isBrowser=false 時 matchMedia 非参照）

jsdom テストは常に `window` 有のため `isBrowser()` は true になる。SSR（`isBrowser()===false`）経路の回帰は以下方針で担保する:

| # | ケース | 方針 | 期待 | 根拠 |
|---|--------|------|------|------|
| E-SS-8 | SSR 初期値は expanded | `readInitialCollapsed` のロジック上、初期 `useState(false)` → mount 後 `useEffect` で確定（Phase 2 hydration 節）。テストでは「初回 render commit 時点の `mode` が `expanded`」を `renderHook` の `result.current`（effect 後）で直接は取れないため、**静的契約として**: SSR で matchMedia を呼ばない＝`isBrowser()` ガードが matchMedia 呼び出しより前にある点を、`useSidebarState.ts` の該当行を対象にした静的 grep（`isBrowser()` ガードが `window.matchMedia` より前段）で確認する補助チェックを Phase 11 manual に回す | matchMedia は `isBrowser()===true` 経路でのみ評価 | INV-5 / SSR |

> jsdom で `window` を消すのは FB-VSCPKR-02（`vi.stubGlobal("window", ...)` 禁止）に抵触するため、SSR 経路は unit ではなく静的契約 + Phase 11 の SSR レンダリング（hydration mismatch 無し）で担保する。matchMedia mock を一切設定しない状態で既存テストが落ちないこと（= matchMedia 未参照経路が存在）も補助的に確認する。

### D. `SidebarMobileTrigger.spec.tsx` — fail path

| # | ケース | 操作 | 期待 | 根拠 |
|---|--------|------|------|------|
| E-MT-1 | 二重 click で setDrawerOpen 2 回 | button を 2 回 `click()` | `setDrawerOpen` が `true` で 2 回呼ばれる（冪等・常に true） | AC-1 robustness |

## 拡充後のローカル実行

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/components/shell/__tests__/SidebarMobileTrigger.spec.tsx \
  src/components/shell/__tests__/SidebarDrawer.spec.tsx \
  src/components/shell/__tests__/useSidebarState.spec.tsx \
  src/components/shell/__tests__/SidebarShell.spec.tsx
```

## 完了条件

- [ ] drawer の unmount cleanup（body 属性 / keydown listener 除去）を追加
- [ ] open=false で listener 非登録 / body 属性付与なしを追加
- [ ] route 連続変化の auto-close を追加
- [ ] localStorage 破損値の fallback 挙動を固定
- [ ] md/lg 境界（767/768/1023/1024）の matchMedia 分岐を網羅
- [ ] matchMedia throw 耐性を追加
- [ ] SSR 安全性（isBrowser=false 時 matchMedia 非参照）の回帰方針を記載（`vi.stubGlobal("window")` を使わない）
