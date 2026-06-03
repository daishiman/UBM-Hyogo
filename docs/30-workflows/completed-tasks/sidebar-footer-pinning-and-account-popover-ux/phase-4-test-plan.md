# Phase 4: テスト計画

## メタ情報

| 項目 | 値 |
|------|----|
| task_id | sidebar-footer-pinning-and-account-popover-ux |
| phase | 4 / 13 |
| 名称 | テスト計画（TDD Red 設計） |
| 前提 | Phase 1（要件）/ Phase 2（設計）/ Phase 3（設計レビュー PASS）完了 |
| implementation_mode | new（既存 shell の挙動修正・新規実装前提）|
| TDD フェーズ | RED（実装前にテストを追加し fail を確認）|

## 目的

C1〜C4 の 4 concern に対する **追加 / 更新テストケース**を、ID・対象 spec・操作・期待値・対応 AC まで確定する。Phase 5 実装前に本計画のテストを追加（RED）し、実装済みとして GREEN へ転じることで AC-1〜AC-4 を機械的に保護する。既存テスト（admin nav 14 項目・`data-shell-root`・`PublicFooter` shell 配下 P-5）を回帰させない設計を併記する。

## 実行タスク

### TDD RED 前提

- 本タスクは `implementation_mode: new`（既実装ゼロ）。本 Phase で定義する新規ケースは **Phase 5 実装前は fail（RED）**であることを確認してから実装に着手する。
- 既存ケース（SidebarShell.spec 7 件 / SidebarUserMenu.spec 5 件 / SidebarNavItem.spec 3 件）は本タスク着手時点で **GREEN**。本計画の追加ケースが既存ケースを壊さないこと（回帰ゼロ）を完了条件とする。

### vitest 実行前提（必須・CLAUDE.md / メモリ準拠）

vitest は **リポジトリルートから** targeted 実行する。worktree ローカルの `vitest` 直叩きや全件実行は避ける:

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx \
  apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx
```

> targeted ファイルリストの正本は phase-1-requirements.md Step 4。`PublicFooter.spec.tsx` / `(public)/layout.spec.tsx` は C4 の回帰確認対象として Phase 6 / Phase 9 で併走させる（本 Phase では DOM 契約として `<main>` flex-column を SidebarShell.spec 側で保護する）。

### jsdom 制約と代替検証方針（[VSCPKR-03] Props vs internal state）

| 制約 | 影響 | 代替方針 |
|------|------|---------|
| jsdom は `<details>` の `summary` クリックによる open/close トグルを**自動再現しない**（layout 非実装）| C3 の開閉が click で発火しない | `detailsRef.current.open = true` を直接設定し、`onToggle` を `fireEvent` で発火させて `details.open` guardを true にする。閉じ検証は `fireEvent.pointerDown(document.body)`（外側）/ `fireEvent.keyDown(document, { key: "Escape" })` で行い、`details.open === false` を assert する |
| jsdom は要素の実高さ（`offsetHeight` / viewport 超過）を**計測できない**| C1 の「viewport 超過で footer 固定」を高さで検証できない | **DOM 構造契約**で代替: `data-shell-block="sidebar-footer"` の存在 / nav が `overflow-y-auto`（クラス） / footer が `shrink-0`（クラス）/ footer が `aside` 末尾に位置することを assert |
| `collapsed` は SidebarNavItem / SidebarUserMenu の **external prop**（内部 state でない）| collapsed 切替を UI 操作で起こせない | props を変えた再レンダリング（`collapsed={true}` / `collapsed={false}`）で出し分けを検証する（[VSCPKR-03]）。SidebarShell 経由の collapsed は `useSidebarState` 由来のため、SidebarShell.spec では構造契約（footer 領域存在）に限定し、行レベルの collapsed 出し分けは NavItem/UserMenu の単体 spec で担う |

### テストケース定義

#### C1: sidebar フッター固定（対象: SidebarShell.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC |
|----|------|--------|---------|
| TC-C1-01 | admin shell を render | `[data-shell-block="sidebar-footer"]` が 1 つ存在する | AC-1 |
| TC-C1-02 | admin shell を render | `sidebar-footer` ブロックが `aside[data-shell="sidebar"]` の**子孫**であり、`aside` 内で nav（`[aria-label="サイドバー"]`）より後ろ（末尾側）に位置する | AC-1 |
| TC-C1-03 | admin shell を render | `sidebar-footer` の className に `shrink-0` を含む（固定領域＝伸縮しない）| AC-1 |
| TC-C1-04 | admin shell を render | nav（`SidebarNav` の scroll 領域）の className に `overflow-y-auto` と `flex-1` を含む（内部スクロール委譲）| AC-1 |
| TC-C1-05 | admin shell を render | `sidebar-footer` 内に `data-component="admin-sidebar-public-return"`・`data-shell-block="user-menu"`・collapse トグル（既存テスト ID もしくは `aria-label`）の 3 要素が含まれる | AC-1 |
| TC-C1-06 | member shell を render | `sidebar-footer` は存在するが `data-component="admin-sidebar-public-return"` は**含まれない**（admin 限定の維持）| AC-1, AC-6 |

#### C2: collapse はみ出し（対象: SidebarNavItem.spec.tsx / SidebarUserMenu.spec.tsx / SidebarShell.spec.tsx）

| ID | 対象 spec | 操作 | 期待値 | 対応 AC |
|----|-----------|------|--------|---------|
| TC-C2-01 | SidebarNavItem.spec | `collapsed` で nav item を render | 行要素（`a` / `Link` レンダリング先）の className に `justify-center` を含む | AC-2 |
| TC-C2-02 | SidebarNavItem.spec | `collapsed={false}` で render | className に `justify-center` を**含まない** | AC-2 |
| TC-C2-03 | SidebarNavItem.spec | badge 付き item を `collapsed` で render | `[data-shell-block="nav-badge-dot"]` が 1 つ存在し、数値（`item.badge.count`）が可視テキストとして出ない（`sr-only` で保持されるのは可、TECH-M-01）| AC-2 |
| TC-C2-04 | SidebarNavItem.spec | badge 付き item を `collapsed={false}` で render | `Chip`（数値表示）が描画され、`nav-badge-dot` は存在しない | AC-2 |
| TC-C2-05 | SidebarUserMenu.spec | `collapsed` で render | summary の className に `justify-center` を含む | AC-2 |
| TC-C2-06 | SidebarShell.spec | admin shell を `collapsed`（state toggle 後 or collapsed レンダリング）で render | `data-component="admin-sidebar-public-return"`（AdminPublicReturn）の className に `justify-center` を含む | AC-2 |

> 注: TC-C2-06 の collapsed 取得は SidebarShell 経由（`useSidebarState`）。`useSidebarState` の toggle を呼ぶか、初期 collapsed=true（`initialCollapsed` prop）で render する方針とする。jsdom で toggle イベントが扱いづらい場合は `initialCollapsed={true}` での render を優先する。

#### C3: アカウント popover 外側クリック / Escape（対象: SidebarUserMenu.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC |
|----|------|--------|---------|
| TC-C3-01 | member menu を render → `details.open = true` + `onToggle` 発火 → `fireEvent.pointerDown(document.body)`（popover/summary 外側）| `details.open === false`（外側クリックで閉じる）| AC-3 |
| TC-C3-02 | open 状態 → `fireEvent.keyDown(document, { key: "Escape" })` | `details.open === false`（Escape で閉じる）| AC-3 |
| TC-C3-03 | open 状態 → `fireEvent.keyDown(document, { key: "Escape" })` | フォーカスが `summary` に戻る（`document.activeElement` が summary、または summary に focus が呼ばれた）| AC-3 |
| TC-C3-04 | open 状態 → popover 内部（`[data-shell-block="user-menu-popover"]` の余白）を `fireEvent.pointerDown` | `details.open === true`（内側クリックでは閉じない）| AC-3 |
| TC-C3-05 | open 状態 → `summary` 自身を `fireEvent.pointerDown` | `details.open === true`（summary は外側判定にならず誤閉じしない）| AC-3 |
| TC-C3-06 | open 状態 → pathname を変更（`usePathname` mock を別値へ）して再レンダリング | `details.open === false`（route 変化 close の既存挙動維持）| AC-3, AC-6 |

> C3 の追加エッジ（閉じている時 listener 未登録 等）の fail-path / 回帰 guard は Phase 6 で扱う。本 Phase は AC-3 の正経路（外側クリック / Escape / route close / 内側維持 / summary 誤閉じ防止）を確定する。

#### C4: main footer sticky（対象: SidebarShell.spec.tsx）

| ID | 操作 | 期待値 | 対応 AC |
|----|------|--------|---------|
| TC-C4-01 | member shell を render | `main[data-shell="main"]` の className に `flex` と `flex-col` を含む（縦 flex 化）| AC-4 |
| TC-C4-02 | member shell を render | `main[data-shell="main"]` の className に `flex-1` と `min-w-0` を維持して含む（既存契約の保持）| AC-4, AC-6 |

> footer の `margin-top: auto` は CSS（`legacy-public.css`）の静的宣言であり、jsdom では computed style の sticky 挙動を検証できない。`<main>` の flex-column 契約（TC-C4-01/02）で構造を保証し、視覚的 sticky は Phase 11 手動 / playwright-smoke visual gate に委譲する。

### 既存テスト回帰 guard（壊してはならない契約）

| 既存ケース | 対象 spec | 維持要件 |
|-----------|-----------|---------|
| viewer 3 / member 4 / admin 14 nav item | SidebarShell.spec | footer 領域 2 段化後も `[data-shell-block="nav-item"]` 数が不変 |
| `data-shell-root` / `data-shell-collapsed` / `data-auth-state` | SidebarShell.spec | root 属性を削除しない |
| active path の `aria-current=page` | SidebarShell.spec | nav-item active 契約不変 |
| `nav[aria-label="サイドバー"]` | SidebarShell.spec | nav landmark 不変 |
| role 別 action（login / profile / edit-request / admin-dashboard / signout）| SidebarUserMenu.spec | popover action 構造不変 |
| `collapsed=true` で displayName が `sr-only` | SidebarUserMenu.spec | collapsed sr-only 契約不変（C2 で justify-center 追加するが sr-only は維持）|
| external item の target/rel/active 非該当 | SidebarNavItem.spec | external anchor 契約不変 |
| 内部 item の active 判定 | SidebarNavItem.spec | active 契約不変 |
| collapsed で label が sr-only | SidebarNavItem.spec | sr-only 契約不変 |
| PublicFooter が shell 配下（P-5）| (public)/layout.spec | footer を `<main>` の外へ出さない（C4 は CSS のみで sticky 化）|

## 参照資料

- phase-1-requirements.md（inventory / AC / targeted test list / 命名規則）
- phase-2-design.md（C1-C4 Before/After 構造・`details.open` guard設計・`onToggle`）
- phase-3-design-review.md（jsdom 互換リスク / MINOR TECH-M-01 a11y）
- `apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx`（既存 7 ケース）
- `apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx`（既存 5 ケース）
- `apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx`（既存 3 ケース・**新規でなく更新**）
- `apps/web/src/lib/is-browser.ts`（`browserDocument()`）

## 実行手順

1. 上記 vitest コマンドで対象 spec を実行し、現状（追加前）GREEN を確認する。
2. C1（TC-C1-01〜06）を SidebarShell.spec へ追加 → RED 確認。
3. C2（TC-C2-01〜06）を SidebarNavItem.spec / SidebarUserMenu.spec / SidebarShell.spec へ追加 → RED 確認。
4. C3（TC-C3-01〜06）を SidebarUserMenu.spec へ追加。`details.open` 直接設定 + `onToggle` 発火 + `fireEvent` の代替手順で記述 → RED 確認。
5. C4（TC-C4-01〜02）を SidebarShell.spec へ追加 → RED 確認。
6. 既存ケースが追加後も GREEN を維持していることを確認（回帰 guard）。
7. Phase 5（実装）へ。実装は concern 順（C1→C4→C2→C3）で直列。

## 統合テスト連携

- `(public)/layout.spec.tsx` P-5（PublicFooter が shell 配下）を**壊さない**ことを Phase 6 / Phase 9 の回帰対象として明示。
- AC-1（footer 領域 DOM 存在）/ AC-2（collapsed 構造）/ AC-3（popover 開閉）/ AC-4（main flex-column）を component spec で保護。視覚 sticky / 実高さは playwright-smoke visual gate（既存）へ委譲（E2E 新規追加はスコープ外）。

## 多角的チェック観点（AIが判断）

- **検証充足性**: 4 concern すべてに AC 対応ケースを割当（C1=6 / C2=6 / C3=6 / C4=2）。jsdom で計測不能な軸は DOM 構造契約へ翻訳済み。
- **回帰範囲**: 既存 15 ケースの維持要件を表で固定し、footer 2 段化 / main flex-column 化 / collapsed justify-center 追加が既存契約を侵さないことを保証。
- **責務境界**: 行レベル collapsed 出し分けは NavItem/UserMenu 単体 spec、shell 構造は SidebarShell.spec、開閉ロジックは SidebarUserMenu.spec に分離。

## サブタスク管理

| concern | 対象 spec | ケース ID |
|---------|-----------|----------|
| C1 | SidebarShell.spec | TC-C1-01〜06 |
| C2 | SidebarNavItem.spec / SidebarUserMenu.spec / SidebarShell.spec | TC-C2-01〜06 |
| C3 | SidebarUserMenu.spec | TC-C3-01〜06 |
| C4 | SidebarShell.spec | TC-C4-01〜02 |

## 成果物

- `outputs/phase-4/test-plan.md`（本 Phase を正本とするテスト計画サマリ）
- C1-C4 ケース表（ID / 対象 spec / 操作 / 期待値 / 対応 AC）
- jsdom 代替検証方針 / 既存回帰 guard 一覧

## 完了条件

- [x] 4 concern すべてに AC 対応テストケースを ID 付きで定義した
- [x] vitest をリポジトリルートから targeted 実行する前提を明記した
- [x] jsdom の `<details>` 開閉・高さ計測不能を DOM 構造契約 + `fireEvent` 代替へ翻訳した
- [x] 既存 15 ケースの回帰 guard 要件を一覧化した
- [x] `(public)/layout.spec` P-5 を壊さない方針を明記した
- [ ] （Phase 5 着手前）追加ケースの RED を確認する

## タスク100%実行確認【必須】

- [x] 全実行タスク（RED 計画 / ケース定義 / 回帰 guard）を文書化した
- [x] 必須成果物（テスト計画）を本ファイルに記載した
- [ ] Phase 5 開始前に RED 確認を実施する（実装者タスク）

## 次Phase

[Phase 5: 実装手順](phase-5-implementation.md)
