# [#1016] Unified Sidebar Shell Task E: Mobile drawer responsive

# Unified Sidebar Shell Task E: Mobile drawer responsive

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | unified-sidebar-shell-task-e-mobile-drawer-responsive |
| タスク名 | SidebarShell の mobile drawer と responsive 挙動実装 |
| 分類 | implementation |
| 対象機能 | `apps/web/src/components/shell/SidebarMobileTrigger.tsx`, `SidebarDrawer.tsx`, `useSidebarState.ts` |
| 優先度 | High |
| 見積もり規模 | Medium |
| ステータス | unassigned |
| 発見元 | `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/phase12-task-spec-compliance-check.md` |
| 発見日 | 2026-05-29 |

## 背景

親 workflow の実装順では Task A の直後に Task E を入れ、公開 / 会員 / 管理 layout 統合前に mobile/tablet の shell contract を固定する必要がある。

## 目的

`< md` では hamburger trigger から overlay drawer を表示し、`md ~ lg` では sidebar を初期 collapsed、`lg+` では expanded にする responsive contract を実装する。

## 受け入れ条件

- `SidebarMobileTrigger` クリックで drawer が開く
- `SidebarDrawer` が `role="dialog"` / `aria-modal="true"` を持ち、Esc / backdrop / route change で閉じる
- `<768px` で sidebar hidden、hamburger visible
- `768〜1023px` で sidebar 初期 collapsed
- `>=1024px` で localStorage 優先の expanded/collapsed が動作する

## 苦戦箇所【記入必須】

- 対象: `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260528-225049-wt-11/docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md`
- 症状: breakpoint は CSS を正としつつ、md 初期 collapsed 判定だけ JS `matchMedia` が必要になる。SSR で `window` を読まない境界を誤ると hydration mismatch または test failure になる。
- 参照: `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`

## リスクと対策

| リスク | 対策 |
| --- | --- |
| drawer open 時に背景 scroll が残る | `<body data-shell-drawer-open="true">` を付与し、CSS scroll lock を focused test と manual evidence で確認する |
| focus trap が過剰実装になり既存UIと衝突する | 最小限の initial focus / Esc / backdrop close に限定し、外部ライブラリ追加は避ける |
| route change auto-close が UserMenu の route-close と重複する | `useSidebarState` の drawer close と Task B の `<details>` close は別 state として分離する |

## 検証方法

### 単体検証

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarDrawer
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell/__tests__/SidebarMobileTrigger
```

期待: drawer open/close、Esc、backdrop、route change、trigger click が PASS。

### 統合検証

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

期待: exit code 0。375 / 768 / 1280 px の visual check は Task F で自動化する。

## スコープ

### 含む

- mobile trigger
- drawer component
- body scroll lock
- route change close
- md 初期 collapsed behavior

### 含まない

- public/member/admin layout の置換（Task C/D）
- visual baseline snapshot commit（Task F）
- shell nav contract の新規定義（Task A）

## 参照

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-E-mobile-drawer-responsive.md`
- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/outputs/phase-12/implementation-guide.md`


