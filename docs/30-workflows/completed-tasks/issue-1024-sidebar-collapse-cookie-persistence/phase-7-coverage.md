# Phase 7: カバレッジ計測

> issue-1024 — sidebar collapse 状態の cookie 永続化

## 7.1 カバレッジ対象の限定方針（[Feedback BEFORE-QUIT-002]）

カバレッジは **本タスクで変更するファイルのみ** を対象とする。リポジトリ全体カバレッジや
未変更 shell ファイルのカバレッジ向上は本タスクの責務外（scope creep を避ける）。

| ファイル | 変更種別 | カバレッジ計測対象か |
|----------|----------|---------------------|
| `apps/web/src/components/shell/shell-collapse-cookie.ts` | 新規 | ✅ 対象（line/branch 100% 目標） |
| `apps/web/src/components/shell/useSidebarState.ts` | 編集 | ✅ 対象（seed 分岐 + toggle 分岐 branch 実測） |
| `apps/web/src/components/shell/SidebarShell.tsx` | 編集（prop optional 追加） | △ 既存 spec の通過確認のみ（新規分岐なし） |
| `apps/web/src/components/shell/SidebarShell.server.tsx` | 編集（cookie 読取り追加） | △ 既存 server spec の通過確認のみ |

### 対象外（明示）

以下は本タスクで変更しないため、カバレッジ向上・新規テストの責務を負わない:

- `SidebarShellContext.tsx` / `SidebarNav*.tsx` / `SidebarBrand.tsx` / `SidebarCollapseToggle.tsx`
  / `SidebarDrawer.tsx` / `SidebarMobileTrigger.tsx` / `SidebarUserAvatar.tsx` / `SidebarUserMenu.tsx`
- `shell-config.ts` / `user-menu-config.ts` / `icons.tsx`

## 7.2 `shell-collapse-cookie.ts` — 全 export 関数 line/branch 100% 目標

新規 pure module は副作用関数を含むが、`browserDocument()` を介すため jsdom 環境で完全に到達可能。
全 export の全分岐を網羅する:

| export | 分岐 | カバーするケース | 期待 |
|--------|------|------------------|------|
| `SHELL_COLLAPSE_COOKIE_NAME`（定数） | — | 値が `"ubm_shell_collapsed"` であること | 定数 assert |
| `parseShellCollapsedCookie` | `value === "true"` 真 | `"true"` を渡す | `true` |
| `parseShellCollapsedCookie` | `value === "true"` 偽（`"false"`） | `"false"` を渡す | `false` |
| `parseShellCollapsedCookie` | `value === "true"` 偽（`undefined`） | `undefined` を渡す | `false` |
| `parseShellCollapsedCookie` | `value === "true"` 偽（不正値） | `"1"` 等を渡す | `false` |
| `readCollapsedFromDocument` | `doc === undefined`（SSR） | `browserDocument()` が undefined を返す環境 | `null` |
| `readCollapsedFromDocument` | cookie 一致なし | `document.cookie` に当該 cookie 不在 | `null` |
| `readCollapsedFromDocument` | cookie 一致あり `=true` | `ubm_shell_collapsed=true` をセット | `true` |
| `readCollapsedFromDocument` | cookie 一致あり `=false` | `ubm_shell_collapsed=false` をセット | `false` |
| `writeShellCollapsedCookie` | `doc === undefined`（SSR） | SSR 環境で呼ぶ | noop（throw しない） |
| `writeShellCollapsedCookie` | `collapsed === true` | `true` を渡す | `document.cookie` に `ubm_shell_collapsed=true` が含まれる |
| `writeShellCollapsedCookie` | `collapsed === false` | `false` を渡す | `document.cookie` に `ubm_shell_collapsed=false` が含まれる |

> 目標: `shell-collapse-cookie.ts` の **statements / lines / functions / branches 全て 100%**。
> 副作用関数の SSR 早期 return 分岐（`if (!doc) return`）も網羅するため、`browserDocument()` を
> mock して undefined を返すケースを Phase 6 のテストに含める。

## 7.3 `useSidebarState.ts` — seed 分岐 + toggle 分岐の branch 実測

localStorage 系を撤廃した後の分岐は以下。branch カバレッジを実測して証跡に残す:

| 分岐箇所 | 条件 | テストケース |
|----------|------|--------------|
| `useState` 初期値 | `initialCollapsed === true` | seed=`true` → 初期 `mode === "collapsed"` |
| `useState` 初期値 | `initialCollapsed !== true`（`false`） | seed=`false` → 初期 `mode === "expanded"` |
| `useState` 初期値 | `initialCollapsed !== true`（`null` 既定） | seed 省略 → 初期 `mode === "expanded"` |
| mount effect 早期 return | `initialCollapsed !== null` | seed=`true`/`false` → viewport 判定をスキップ（`matchMedia` 不参照） |
| mount effect viewport | `initialCollapsed === null` かつ md viewport | seed=`null` + md matchMedia → `mode === "collapsed"` |
| mount effect viewport | `initialCollapsed === null` かつ lg viewport | seed=`null` + lg matchMedia → `mode === "expanded"` 維持 |
| `toggleCollapsed` | `prev === "collapsed"` → expanded | collapsed から toggle → `writeShellCollapsedCookie(false)` 呼出 |
| `toggleCollapsed` | `prev === "expanded"` → collapsed | expanded から toggle → `writeShellCollapsedCookie(true)` 呼出 |

### branch 実測の証跡方針

- 実装後、`pnpm --filter @ubm-hyogo/web test --run apps/web/src/components/shell` を coverage 付きで
  実行し（`--coverage` を付与可能なら）、上記 2 ファイルの branch% を Phase 10 / outputs の coverage
  証跡へ転記する。
- coverage 設定がファイル単位指定を許さない場合でも、上記分岐をカバーする spec ケースが
  存在することを「テストケース ↔ 分岐」対応表（本 7.2 / 7.3）で担保する。
- toggle 時の `writeShellCollapsedCookie` 呼出は spy（`vi.spyOn` / module mock）で引数 `true`/`false` を
  両方アサートし、cookie 書込分岐の両側を踏む。

## 7.4 カバレッジ判定基準（Phase 9 / Phase 10 へ引き継ぐ）

- `shell-collapse-cookie.ts`: line/branch/function = 100%（pure + 副作用全分岐網羅）。
- `useSidebarState.ts`: 上記 8 分岐を全て踏む spec が存在し、緑であること。
- 未変更ファイルのカバレッジ低下を本タスクで誘発しないこと（編集は後方互換のため既存 spec が
  そのまま通る前提・[Feedback BEFORE-QUIT-002] の対象限定に従う）。
