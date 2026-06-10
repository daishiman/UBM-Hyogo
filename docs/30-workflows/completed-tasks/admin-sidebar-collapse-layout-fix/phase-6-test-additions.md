# Phase 6: テスト追加（回帰 guard / fail path）

## メタ情報

- task_id: `admin-sidebar-collapse-layout-fix`
- 前提: Phase 4（テスト計画 TC-01..17）/ Phase 5（実装 Before→After 確定）
- 本 Phase の責務: Phase 4 の TC を実 spec へ落とし、特に **回帰 guard**（collapsed の `px-3` 残存の再発防止 / expanded regression / active+collapsed 併存）と **既存 spec `SidebarShell.spec.tsx`** の検証内容・カバレッジ範囲を確定する

## 目的

Phase 5 の className 修正が将来の編集で逆戻り（`px-3` 残存・40px 枠剥がれ・`SidebarBrand` collapsed 分岐削除）しないよう、機械検証可能な assertion を既存 3 spec へ追加し、`SidebarShell.spec.tsx` で brand collapsed contract も統合検証する。
すべて jsdom（`@testing-library/react` `render` + `container.querySelector` + className 断片 assertion）で完結し、追加 mock は不要（既存 `vi.mock("next/navigation", ...)` / `vi.mock("next-auth/react", ...)` を踏襲）。

## 1. 回帰 guard / fail path 設計

| guard | 狙い | assertion 方針 |
| --- | --- | --- |
| **collapsed px-3 残存回帰 guard** | Phase 5 で除去した `px-3` が collapsed で再混入したら即 FAIL | collapsed render で `className` が `px-3` を **`not.toContain`**、かつ `px-0` / `w-full` / `justify-center` を `toContain`（TC-01/02/03/04） |
| **40px 枠剥がれ guard** | icon span の collapsed `h-10 w-10` が剥がれたら FAIL | collapsed render で icon span（`[aria-hidden="true"]` 内 `ShellIcon`/`U`）が `h-10 w-10` を `toContain`（nav-item/admin-return・TC-05）。avatar/mark は親の `w-full justify-center` で中央（TC-06/07） |
| **expanded regression guard** | expanded で従来 `gap-3`/`gap-2` + `px-3` が消えたら FAIL | expanded render で各 expanded gap + `px-3` を `toContain`、`justify-center`/`px-0`/`w-full` を `not.toContain`（TC-11/12/13/14） |
| **active + collapsed 併存 guard** | collapsed 中央化で active 左ボーダーが落ちたら FAIL | active 一致 pathname + collapsed render で `data-active="true"` / `aria-current="page"` 維持 + `border-l-2` / `data-[active=true]:border-[var(--ubm-color-accent)]` を `toContain`（TC-09） |
| **sr-only 可視性 guard** | px-0 化で displayName/role の sr-only ラップが壊れたら FAIL | collapsed で `summary .sr-only` 存在（TC-15）、expanded で displayName 可視（TC-16）。brand text span も collapsed=`sr-only`/expanded=可視（TC-17） |

## 2. 既存 spec への追加（更新）

### 2.1 `SidebarNavItem.spec.tsx`（更新）

既存ケース（external/active/sr-only/tooltip/badge dot）は **全件維持**。`SidebarNavItem.spec.tsx:107-128` の collapsed ケースに `justify-center` / `gap-0` の assertion が既にあるため、これを **強化**する形で追加する。

追加ケース:

- TC-01（collapsed px-0 中央化 + px-3 不在）:
  - `collapsed` で `<ul>` 内 render → `a` の `className`:
    - `expect(link?.className).toContain("px-0")`
    - `expect(link?.className).toContain("w-full")`
    - `expect(link?.className).toContain("justify-center")`
    - `expect(link?.className).not.toContain("px-3")`
- TC-05（icon span 40px 枠）:
  - collapsed render → `ShellIcon` を内包する `[aria-hidden="true"]` span を取得し `expect(iconSpan?.className).toContain("h-10")` / `toContain("w-10")`
- TC-09（active + collapsed border 維持）:
  - `usePathname` mock を item.href（`/admin/members`）に一致させ `collapsed` render → `a` の `data-active="true"` / `aria-current="page"` 維持 + `className` に `border-l-2` を `toContain`
- TC-11（expanded regression）:
  - `collapsed={false}` render → `className` に `gap-3` / `px-3` を `toContain`、`justify-center` / `px-0` / `w-full` を `not.toContain`

> icon span 取得は `Array.from(container.querySelectorAll('span[aria-hidden="true"]'))` から `svg` を内包するものを選ぶ（既存 label span 取得パターン `SidebarNavItem.spec.tsx:67-69` を踏襲）。

### 2.2 `SidebarUserMenu.spec.tsx`（更新）

既存ケース（role 別 action / avatar data-role / collapsed sr-only / tooltip / popover 開閉）は **全件維持**。`SidebarUserMenu.spec.tsx:55-61` の collapsed sr-only ケースを基点に追加する。

追加ケース:

- TC-02（collapsed px-0 中央化 + px-3 不在）:
  - `collapsed={true}` render → `summary` の `className`:
    - `toContain("px-0")` / `toContain("w-full")` / `toContain("justify-center")` / `not.toContain("px-3")`
- TC-06（avatar 中央枠・avatar 無変更）:
  - collapsed render → `summary` の `className` に `justify-center` / `w-full` を `toContain`、`[data-shell-block="user-avatar"]` が存在し avatar 内側 span が `h-9 w-9` を保持（36px 無変更の guard）
- TC-12（expanded regression）:
  - `collapsed={false}` render → `summary` の `className` に `gap-2` / `px-3` を `toContain`、`justify-center` / `px-0` を `not.toContain`
- TC-15/16（sr-only 可視性）:
  - TC-15: collapsed で `container.querySelector('summary .sr-only')` 存在（既存 :55-61 を維持）
  - TC-16: `collapsed={false}` で `container.textContent` に displayName（"山田太郎"）を含む

### 2.3 `SidebarShell.spec.tsx`（更新）— AdminPublicReturn collapsed contract

既存ケース（role 別 nav 数 / active / mobile-bar / collapsed 幅 / public-return tooltip）は **全件維持**。`SidebarShell.spec.tsx:102-112`（`renderShell("admin", true)`）/ `:114-123`（public-return tooltip）の collapsed admin パターンを踏襲。

追加ケース:

- TC-04（AdminPublicReturn collapsed px-0 中央化 + px-3 不在）:
  - `renderShell("admin", true)` → `[data-role="public-return"]` の `className`:
    - `toContain("px-0")` / `toContain("w-full")` / `toContain("justify-center")` / `not.toContain("px-3")`
- TC-14（AdminPublicReturn expanded regression）:
  - `renderShell("admin", false)` → `[data-role="public-return"]` の `className` に `gap-3` / `px-3` を `toContain`、`justify-center` / `px-0` を `not.toContain`

> `renderShell` は既存 helper（`SidebarShell.spec.tsx:15-32`）をそのまま使い、第 2 引数 `initialCollapsed` で collapsed/expanded を切り替える。AdminPublicReturn は admin role のみ描画されるため `role="admin"` で render する。

## 3. `SidebarShell.spec.tsx` への brand collapsed contract 集約

`SidebarBrand` 単体 spec は新設せず、既存 `SidebarShell.spec.tsx` の collapsed 初期値ケースで brand / nav / public-return / user-menu を同時に検証する。これにより、実運用と同じ `SidebarShell` 経由の DOM で brand の `px-0 w-full justify-center` と mark 40px 枠を確認でき、追加ファイルなしで回帰 guard を持てる。

追加観点:

- TC-03 / TC-07 / TC-08: collapsed `SidebarShell` 内の `[data-shell-block="brand"]` が `px-0` / `w-full` / `justify-center` を持ち、mark span が `h-10 w-10` を持つ。
- TC-13 / TC-17: expanded 側は既存 focused vitest と local screenshot で確認する。

## 4. AC ↔ TC trace（本 Phase 担保）

| AC | 担保 TC | 検証手段 |
| --- | --- | --- |
| AC-1（px-0 / w-full / justify-center 中央寄せ） | TC-01/02/03/04 | className 断片（jsdom） |
| AC-2（64px 内収容 / 40px 枠） | TC-05/06/07 | icon span `h-10 w-10` / avatar `h-9 w-9` / mark `h-8 w-8` + 親中央枠。実描画は Phase 11 視覚 |
| AC-3（全行同一規約・軸一致） | TC-08（横断） | 3 行が `justify-center`+`px-0`+`w-full` を共通保持。軸一致の視覚は Phase 11 |
| AC-4（active border 維持） | TC-09 | `border-l-2` / `data-active` 維持 |
| AC-5（expanded regression なし） | TC-11/12/13/14 | expanded gap + `px-3` 維持・collapsed クラス不在 |
| AC-6（sr-only 可視性） | TC-15/16/17 | sr-only ラップ存在 / displayName 可視 |

> AC-7（token）は `pnpm verify:tokens`（Phase 7/9）、AC-8（apps/api 非変更）は `git diff --name-only -- apps/api` 空（Phase 9）、AC-9（typecheck/lint/vitest）は Phase 9 で担保（component test の責務外）。

## 5. カバレッジ対象範囲（[Feedback BEFORE-QUIT-002]）

- カバレッジ計測・追加テストの対象は **本サイクルで変更した shell コンポーネントのみ** に限定する:
  `SidebarNavItem.tsx` / `SidebarUserMenu.tsx` / `SidebarBrand.tsx` / `SidebarShell.tsx`（`AdminPublicReturn`）。
- `SidebarNav.tsx`（無変更）・`SidebarUserAvatar.tsx`（無変更）・その他 shell ファイル（`SidebarDrawer` / `SidebarCollapseToggle` / `SidebarTooltip` / `useSidebarState` / `shell-config` 等）は本タスクで触らないため **カバレッジ要件を新たに課さない**（既存テストのまま）。
- リポジトリ全体や `apps/web` 全体のカバレッジ底上げは本タスクのスコープ外（単一関心・1 サイクル完結）。focused run（`apps/web/src/components/shell/__tests__`）で変更 4 ファイルの collapsed/expanded 分岐が緑であることを以て DoD とする。

## 6. 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__
```

> `--root=.` 必須（省略で `No test files`）。worktree 直後は事前に `mise exec -- pnpm install` を 1 回実施。
> OOS-1（collapsed tooltip overflow clip）は baseline・本サイクルのテスト追加対象外（_shared-context.md §7）。
