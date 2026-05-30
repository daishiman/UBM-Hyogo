# Phase 1: 要件定義

**[実装区分: 実装仕様書]**

## メタ情報

- task_id: `admin-sidebar-public-return-link`
- taskType: `implementation`
- visualEvidence: `VISUAL_ON_EXECUTION`
- workflow_state: `implemented_local_evidence_captured`
- implementation_mode: `existing-component-alignment`

## 背景

`AdminSidebar` には現状「Public」グループ先頭に `{ href: "/", label: "ホーム", icon: ICON_HOME }` が存在する（`apps/web/src/components/layout/AdminSidebar.tsx:52`）。
管理画面から公開サイトへ戻る導線としては機能しているが:

- ラベルが「ホーム」では「管理画面のホーム = `/admin`」と混同する
- 配置が sidebar 上部にあり、視覚的に admin nav と並列であるため、文脈が伝わりにくい
- regression test の anchor が無く、リネーム / 削除されても検知できない

## 観測（事前 grep）

```
$ rg -n '"/", label: "ホーム"' apps/web/src/components/layout/AdminSidebar.tsx
52:      { href: "/", label: "ホーム", icon: ICON_HOME },
```

→ 既存ヒットあり。差分判定（task-f の §2）に従い「既存 nav item の意味整理（ラベル変更 + 配置移動 + `data-role` 付与）」として実装する。

## 要件

| ID | 条件 |
| --- | --- |
| AC-1 | `AdminSidebar` が描画する DOM 内に `<a data-role="public-return" href="/">` が **ちょうど 1 つ** 存在する |
| AC-2 | 当該 anchor の `aria-label === "公開サイトに戻る"` かつ表示テキストが「公開サイトに戻る」を含む |
| AC-3 | 当該 anchor は sidebar 最下段（既存 footer / `SignOutButton` 直上）に配置される |
| AC-4 | 既存 admin nav（ダッシュボード / 出席分析 / 会員管理 / タグキュー / スキーマ / 開催日 / 依頼キュー / Identity重複 / 監査ログ）が**全て regression なく**描画される |
| AC-5 | 既存「会員ディレクトリ」「登録」「マイページ」が引き続き描画される（または、移動先で同等到達可能と spec 上で trace される） |
| AC-6 | `SignOutButton` (`data-testid="sign-out-button"`) が引き続き描画され、props (`userDisplayName` / `userEmail`) が反映される |
| AC-7 | `AdminSidebar` の public API (`AdminSidebarProps`) を **変更しない** |
| AC-8 | HEX 直書き 0 件、`var(--ubm-color-*)` トークンのみ使用 |
| AC-9 | `*.spec.tsx` 命名規約遵守、`*.test.*` 追加禁止 |
| AC-10 | typecheck / lint / focused vitest が green |

## 参照資料

| 種別 | Path | 用途 |
| --- | --- | --- |
| 親 task spec | `docs/30-workflows/public-header-logged-in-nav-cleanup/tasks/task-f-admin-sidebar-public-return.md` | 元タスク仕様 |
| 親 workflow index | `docs/30-workflows/public-header-logged-in-nav-cleanup/index.md` | スコープ・不変条件 |
| current component | `apps/web/src/components/layout/AdminSidebar.tsx` | 編集対象正本 |
| nav item primitive | `apps/web/src/components/layout/AdminSidebarNavItem.tsx` | 変更不要の境界確認（案 B 採用） |
| current spec | `apps/web/src/components/layout/__tests__/AdminSidebar.spec.tsx` | regression spec の母体 |
| design tokens | `apps/web/src/styles/tokens.css` | OKLch 正本 |
| プロトタイプ | `docs/00-getting-started-manual/claude-design-prototype/` | UI 整合の正本 |
| system spec | `.claude/skills/aiworkflow-requirements/references/ui-ux-navigation.md` | navigation 正本 |

## 完了条件

- AC-1〜AC-10 が Phase 2 以降の設計・実装・テストに 1:1 で trace される
- `artifacts.json` に `taskType`, `visualEvidence`, `implementation_files`, `phases[]` が記録されている
- 元の `task-f-admin-sidebar-public-return.md` から差分判定（既存ヒットあり）の正当性が引用されている
