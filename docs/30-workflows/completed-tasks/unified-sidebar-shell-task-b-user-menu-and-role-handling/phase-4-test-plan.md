# Phase 4: テスト計画

## Unit / Component

| 対象 | ケース |
| --- | --- |
| `user-menu-config.spec.ts` | (a) `buildUserMenuActions('viewer')` が `[{kind:'login', id:'login', label:'ログイン', href:'/login'}]` を厳密一致で返す |
| | (b) `buildUserMenuActions('member')` が link(profile) → link(edit-request) → signout の順で 3 件 |
| | (c) `buildUserMenuActions('admin')` が link(profile) → link(edit-request) → link(admin-dashboard, '/admin') → signout の順で 4 件 |
| | (d) 戻り値順序の deep-equal snapshot |
| `SidebarUserMenu.spec.tsx` | (1) viewer: 「ログイン」のみ表示、`signOut` 関連 DOM が無い |
| | (2) member: profile / edit-request / signout の 3 menuitem、`SignOutButton` が render される |
| | (3) admin: 4 menuitem、avatar に `data-role="admin"` |
| | (4) `collapsed=true` で label が `sr-only`、avatar 描画は維持 |
| | (5) `<summary>` が `role="button"` + `aria-haspopup="menu"` + `aria-label` を持つ |
| | (6) `<details>` 内に `role="menu"` の container が存在し、各 action が `role="menuitem"` |
| | (7) `usePathname()` の戻りが変化したら `details.open` が false になる（mock で検証） |
| | (8) admin role では「管理者」、member role では「会員」が `displayName` 下の小ラベルとして出る。viewer 時は role label を省略 |

## Mock 方針

- `next/navigation` の `usePathname` を `vi.mock` でラップし、re-render で値を切り替える。
- `next/link` は React Testing Library の DOM 上で `<a>` として解決されるため `vi.mock` 不要（既存パターン踏襲）。
- `SignOutButton` は本実 import。`signOut` (`next-auth/react`) を `vi.mock` で no-op 化し、副作用なしで render 検証。

## Playwright

本タスク単体では追加しない（親 Task F `sidebar-shell-smoke.spec.ts` / `sidebar-shell-visual.spec.ts` に統合）。本 task では smoke の前提として focused vitest のみを CI gate とする。

## 完了条件

実装 wave の verify command が `artifacts.json.metadata.verify_commands` と一致し、上記 12 ケース（config 4 + menu 8）が green。
