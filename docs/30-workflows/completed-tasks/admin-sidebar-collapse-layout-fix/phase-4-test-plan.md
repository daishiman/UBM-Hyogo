# Phase 4: テスト計画（TDD Red）

> 本 Phase は「admin-sidebar-collapse-layout-fix（collapsed/expanded サイドバーレイアウト是正）」の **テスト計画（Red）**。
> 実装着手前に、collapsed 時の `px-0` / `w-full` / `justify-center` 付与・40px 角アイコン枠中央化・
> active 表現維持・expanded regression なしを検証する component test の期待挙動を確定する。実コード変更は Phase 5 で行う。

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 1（AC-1..AC-9）/ Phase 2（D-1..D-5 className 設計・変更 4 ファイル確定）/ Phase 3（設計レビュー PASS）
- 本 Phase の責務: AC-1..AC-9 それぞれのテスト戦略・対象ファイル・TC 採番・具体コマンド・RED 期待を確定する
- visualEvidence: `VISUAL`（実 screenshot は Phase 11 で pending。本 Phase は jsdom で確認可能な className 契約を機械検証）

## 目的

Phase 5 実装前にテスト仕様を確定し、実装後に全 TC が green へ転じることを Phase 6/9 で追跡できる状態を作る。
collapsed/expanded のレイアウト是正は **className（Tailwind utility）の付与の事実** を DOM で確認できる。
実際の幅 64px 内に収まる描画（はみ出しの有無）・縦中心線の一致は jsdom では layout 計算しないため Phase 11 staging 視覚で担保し、
「`px-3` を剥がし `px-0 w-full justify-center` を付ける」「40px 角枠 `h-10 w-10` を付ける」という**修正の事実**は focused vitest で機械的に検証する。

## 1. テスト戦略の核心 — collapsed は external prop（[VSCPKR-03] 対策）

`collapsed` は各 shell コンポーネントの **external prop**（`SidebarShell` が `useSidebarState` で所有し、`SidebarBrand` / `SidebarNav`→`SidebarNavItem` / `SidebarUserMenu` / `AdminPublicReturn` へ伝播する）であり、各子コンポーネントの **internal state ではない**。

したがってテストは以下を厳守する:

- 各子コンポーネント spec では `collapsed={true}` / `collapsed={false}` を **prop で直接渡して** render し、付与された className / DOM を assert する。internal state を toggle するための user 操作（クリック等）は行わない。
- `SidebarShell` 経由の統合確認は `initialCollapsed={true}` を `renderShell` に渡す既存パターン（`SidebarShell.spec.tsx:102` の `renderShell("admin", true)`）を踏襲する。
- collapse の toggle 操作そのもの（`useSidebarState` の挙動）は本タスクのスコープ外（状態管理は不変）。レイアウト className の検証に閉じる。

## 2. mock パターン（既存 spec 踏襲・[VSCPKR-02] 対策）

既存 shell spec の mock 方法をそのまま踏襲する:

| 対象 | mock 方法 | 既存実例 |
| --- | --- | --- |
| `usePathname` | `vi.mock("next/navigation", () => ({ usePathname: vi.fn(() => "/...") }))` をファイル先頭（import より前）に置く | `SidebarNavItem.spec.tsx:4-6` / `SidebarUserMenu.spec.tsx:6-8` / `SidebarShell.spec.tsx:6-8` |
| `signOut`（user-menu/shell） | `vi.mock("next-auth/react", () => ({ signOut: vi.fn() }))` | `SidebarUserMenu.spec.tsx:5` / `SidebarShell.spec.tsx:5` |
| cleanup | `afterEach(() => cleanup())` | 全 shell spec |

- `window` を mock する必要がある場合は **`Object.defineProperty(window, "...", { ... })` を使う**。`vi.stubGlobal("window", ...)` は **禁止**（[VSCPKR-02]: window 全体差し替えは jsdom 環境を破壊し他テストへ汚染する）。
  - 本タスクのテストは className assertion 中心で `window.api` 等の差し替えは不要の見込み。万一必要になった場合のみ `Object.defineProperty` を用いる。
- `SidebarNavItem` は `<ul>` でラップして render する（既存 `SidebarNavItem.spec.tsx:23-27` パターン。`<li>` を返すため）。

## 3. テスト対象ファイル一覧

| ファイル | 種別 | 対応 AC |
| --- | --- | --- |
| `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx` | 更新（collapsed レイアウト class assertion 追加） | AC-1 / AC-2 / AC-3 / AC-4 / AC-5 |
| `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx` | 更新（collapsed レイアウト class assertion 追加） | AC-1 / AC-2 / AC-3 / AC-5 / AC-6 |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新（AdminPublicReturn collapsed レイアウト contract 追加） | AC-1 / AC-2 / AC-3 / AC-5 |
| `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 更新（brand/nav/public-return/user-menu の collapsed contract を統合検証） | AC-1 / AC-2 / AC-3 / AC-5 / AC-6 |

> 既存テスト（active/external/tooltip/popover/role 別 nav 数 等）は **regression guard** として全件維持する（無削除）。本 Phase はそれらに collapsed レイアウト contract を追加する。

## 4. テストケース一覧（TC-xx）

> className 断片は Phase 5 で確定する逐語値（`px-0` / `w-full` / `justify-center` / `gap-0` / `h-10 w-10` / `px-3` / `gap-3` / `gap-2`）を assert する。
> 各 TC は `toContain` / `not.toContain` でクラス断片の有無を検証し、過剰な完全一致は避ける（utility 順序ドリフトに脆くしない）。

### AC-1 — collapsed 時の `px-0 w-full justify-center`

| TC | 対象コンポーネント | 操作（render prop） | 期待値（className 断片） |
| --- | --- | --- | --- |
| TC-01 | `SidebarNavItem` | `collapsed` で `<ul>` 内 render、`a`（=`[data-shell-block="nav-item"]`） | `className` に `justify-center` / `gap-0` / `px-0` / `w-full` を含み、`px-3` を **含まない** |
| TC-02 | `SidebarUserMenu` | `collapsed={true}` で render、`summary` | `className` に `justify-center` / `gap-0` / `px-0` / `w-full` を含み、`px-3` を **含まない** |
| TC-03 | `SidebarBrand`（新規 spec） | `collapsed={true}` で render、`a`（=`[data-shell-block="brand"]`） | `className` に `justify-center` / `gap-0` / `px-0` / `w-full` を含み、`px-3` を **含まない** |
| TC-04 | `SidebarShell` の `AdminPublicReturn` | `renderShell("admin", true)`、`[data-role="public-return"]` | `className` に `justify-center` / `gap-0` / `px-0` / `w-full` を含み、`px-3` を **含まない** |

### AC-2 / AC-3 — collapsed で icon/avatar/mark 枠が 40px 角中央 + 全行共通 collapsed レイアウト規約

| TC | 対象コンポーネント | 操作 | 期待値 |
| --- | --- | --- | --- |
| TC-05 | `SidebarNavItem` | `collapsed` で render、icon wrapper span（`ShellIcon` を内包する `[aria-hidden="true"]` span） | span の `className` に `h-10 w-10` を含む（40px 角枠）。内側 `svg`（`ShellIcon`）は 18px のまま=icon span 自体のサイズ token は変えない |
| TC-06 | `SidebarUserMenu` | `collapsed={true}` で render、`summary` 直下の avatar 中央化 | `summary` の `className` に `justify-center` / `w-full` を含む（avatar 36px を 40px 枠中央へ）。`SidebarUserAvatar`（`[data-shell-block="user-avatar"]`）は `h-9 w-9`=36px のまま（無変更） |
| TC-07 | `SidebarBrand`（新規 spec） | `collapsed={true}` で render、brand mark span（`U` を内包する `[aria-hidden="true"]` span） | mark span は `h-8 w-8`=32px のまま、Link の `justify-center w-full` で 40px 中央枠へ収まる |
| TC-08 | 共通規約（3 行） | `SidebarNavItem` / `SidebarUserMenu` / `SidebarBrand` を各 `collapsed` で render | 3 行すべてが同一の collapsed レイアウト規約クラス（`justify-center` + `px-0` + `w-full`）を持つことを横断 assert（AC-3 の「全行が同一 collapsed レイアウト規約」） |

### AC-4 — collapsed + active で左ボーダー active 表現維持

| TC | 対象コンポーネント | 操作 | 期待値 |
| --- | --- | --- | --- |
| TC-09 | `SidebarNavItem` | `usePathname` mock を item.href に一致させ `collapsed` で render | `a` の `data-active="true"` / `aria-current="page"` 維持。`className` に `border-l-2` と `data-[active=true]:border-[var(--ubm-color-accent)]` を含む（collapsed 中央化でも active border クラスが残る） |
| TC-10 | `SidebarNavItem` | 同上だが `collapsed={false}` | active border クラスが expanded でも維持される（regression guard） |

### AC-5 — expanded で従来クラス維持（regression なし）

| TC | 対象コンポーネント | 操作 | 期待値 |
| --- | --- | --- | --- |
| TC-11 | `SidebarNavItem` | `collapsed={false}` で render | `className` に `gap-3` / `px-3` を含み、`justify-center` / `px-0` / `w-full` を **含まない** |
| TC-12 | `SidebarUserMenu` | `collapsed={false}` で render | `summary` の `className` に `gap-2` / `px-3` を含み、`justify-center` / `px-0` を **含まない** |
| TC-13 | `SidebarBrand`（新規 spec） | `collapsed={false}` で render | `a` の `className` に `gap-2` / `px-3` を含み、`justify-center` / `px-0` を **含まない** |
| TC-14 | `AdminPublicReturn` | `renderShell("admin", false)` | `[data-role="public-return"]` の `className` に `gap-3` / `px-3` を含み、`justify-center` / `px-0` を **含まない** |

### AC-6 — collapsed で displayName/role が sr-only、expanded で表示

| TC | 対象コンポーネント | 操作 | 期待値 |
| --- | --- | --- | --- |
| TC-15 | `SidebarUserMenu` | `collapsed={true}` で render | `summary` 内に `.sr-only` ラップ（displayName/role を内包）が存在（既存 `SidebarUserMenu.spec.tsx:55-61` を維持・強化）。`px-0` 化後も sr-only の意味的可視性が保たれる |
| TC-16 | `SidebarUserMenu` | `collapsed={false}` で render | displayName テキスト（"山田太郎"）と roleLabel が **可視**（`sr-only` でない `flex min-w-0 flex-col` ラップで表示）。`container.textContent` に displayName を含む |
| TC-17 | `SidebarBrand`（新規 spec） | `collapsed={true}` / `false` 双方で render | collapsed で "UBM兵庫" テキスト span が `sr-only`、expanded で `flex flex-col` 可視（既存実装 L24 挙動を contract 化） |

> AC-7（token 厳守）・AC-8（apps/api 非変更）・AC-9（typecheck/lint/vitest）は Phase 6/7/9 のコマンドで担保し、本 component test では検証しない（責務分離）。OOS-1（collapsed tooltip の overflow clip）は baseline 扱いで本サイクルのテスト対象外。

## 5. 実行コマンド

repo root が vitest root のため、targeted run はパス指定 + `--root=.` を **必須** とする（`--root` 省略で `No test files` になる罠）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
```

> 本リポジトリの vitest 設定はルート `vitest.config.ts` に集約されている。focused 実行は `--config=vitest.config.ts` を用い、
> `include` glob（`apps/**/__tests__/**/*.spec.{ts,tsx}`）で shell spec 群が収集される。
> worktree 直後は事前に `mise exec -- pnpm install` を 1 回実施する。

補助コマンド（Phase 9 で全件確認）:

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm verify:tokens
git diff --name-only -- apps/api   # 空であること（AC-8）
```

## 6. RED フェーズの期待（修正前に FAIL すること）

Phase 5 実装**前**の現行コードに対して新 assertion を走らせると、以下が FAIL することで RED が成立する:

| 現行コードの状態 | FAIL する TC | 理由 |
| --- | --- | --- |
| `SidebarNavItem.tsx:30` が `px-3` を常時保持し collapsed 分岐が `justify-center gap-0` のみ（`px-0 w-full` なし） | TC-01 / TC-08 | collapsed で `px-3` が残り、`px-0` / `w-full` が付かない |
| `SidebarNavItem` の icon span が `h-[18px] w-[18px]` 固定（collapsed でも 40px 枠化しない） | TC-05 | `h-10 w-10` が付かない |
| `SidebarUserMenu.tsx:54` が `px-3` 常時 + collapsed 分岐 `justify-center gap-0` のみ | TC-02 / TC-06 | `px-0` / `w-full` が付かない |
| `SidebarBrand.tsx:16` に **collapsed 分岐そのものが存在しない**（常に `px-3 gap-2`、`justify-center` なし） | TC-03 / TC-07 / TC-08 | collapsed でも `px-3 gap-2` のまま・`justify-center` `px-0` `w-full` が一切付かない（既存 spec の追加 assertion が即 FAIL） |
| `SidebarShell.tsx:32` の `AdminPublicReturn` が `px-3` 常時 + collapsed 分岐 `justify-center gap-0` のみ | TC-04 | `px-0` / `w-full` が付かない |

> expanded 系（TC-11..14）・active 系（TC-09/10 expanded 側）・sr-only 系（TC-15..17）は現行挙動を contract 化するもので、現行コードでも PASS しうる（regression guard）。
> RED の本質は collapsed の `px-0 w-full justify-center` + 40px 枠（TC-01..08）が現行で FAIL することにある。Phase 5 の className 修正でこれらが GREEN へ転じる。
