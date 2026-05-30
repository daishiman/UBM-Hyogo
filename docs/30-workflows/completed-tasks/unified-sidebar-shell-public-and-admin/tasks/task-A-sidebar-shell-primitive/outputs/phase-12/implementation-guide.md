---
Phase: 12
status: completed
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../../../outputs/phase-12/implementation-guide.md
正本: ../../../task-A-sidebar-shell-primitive.md
---

# Phase 12 — Implementation Guide (task A)

## Part 1 — 中学生レベルの説明

### サイドバーって何？

Web サイトの左側にずっと出ている、メニューの帯のことです。地図アプリの左サイドにある「お気に入り」「履歴」「設定」が並ぶアレと同じです。スマホでは画面が狭いので、普段は隠しておいて、ハンバーガーアイコン (≡) をタップしたときだけ出てきます。

### 折り畳みって何？

サイドバーは広げると場所を取るので、矢印アイコンをクリックすると **アイコンだけの細い帯** に変身します。これを「collapsed (折り畳み)」と呼びます。広げた状態が「expanded」。テレビのリモコンの蓋を閉じるイメージです。

### 日常例

- LINE の左端の「友だち / トーク / ホーム」タブ：これは collapsed 風
- YouTube 左サイド：広いと履歴まで表示、狭いとアイコンだけ ← まさに今回作るもの

### 今回作るもの

「公開ページ」「会員ページ」「管理ページ」の 3 種類で **同じサイドバー部品** を共通利用できる "土台" を 1 個だけ作ります。それぞれの画面に「ログインボタン」「スマホ用のメニューボタン」を後で差し込めるよう、空っぽの **箱（slot）** だけ用意しておくのがポイントです。

## Part 2 — 技術詳細

### 公開シグネチャ（正本: 親 task-A.md）

```ts
type ShellRole = 'viewer' | 'member' | 'admin'

function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number },
): ShellNavGroup[]

function isNavItemActive(itemHref: string, pathname: string): boolean

function useSidebarState(): {
  mode: 'expanded' | 'collapsed'
  drawerOpen: boolean
  toggleCollapsed: () => void
  setDrawerOpen: (open: boolean) => void
}
```

```tsx
type SidebarShellProps = {
  role: ShellRole
  user: { displayName: string; email: string; initials: string } | null
  navGroups: ShellNavGroup[]
  activePath: string
  mobileTriggerSlot: ReactNode
  children: ReactNode
}
```

### tokens.css 追加 5 件

`--shell-bar-w` / `--shell-bar-w-collapsed` / `--shell-bar-bg` / `--shell-bar-border` / `--shell-active-bg`（`[data-theme='cool']` variant 含む）。

### テスト

| spec | 主なケース |
|------|------------|
| `shell-config.spec.ts` | role × `schemaDiffCount` 全 branch + `isNavItemActive` prefix 判定 |
| `useSidebarState.spec.tsx` | 初期値 / toggle / localStorage hydrate / SSR safe |
| `SidebarShell.spec.tsx` | viewer=3 / member=4 / admin=13 件、`aria-current` / `sr-only` / slot |

### verify コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell
```

## 視覚証跡セクション

| 種別 | パス | 状態 |
|------|------|------|
| screenshot: expanded-viewer | (Gate-B wave で取得) | pending |
| screenshot: collapsed-viewer | (Gate-B wave で取得) | pending |
| screenshot: expanded-admin | (Gate-B wave で取得) | pending |

Phase 11 evidence は `outputs/phase-11/` 配下に出力予定。現時点では plan のみ present、result は pending。
