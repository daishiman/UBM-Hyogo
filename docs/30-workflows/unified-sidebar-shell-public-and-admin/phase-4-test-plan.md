# Phase 4: テスト計画

## Unit / Component

| 対象 | 期待 |
| --- | --- |
| `shell-config.spec.ts` | 3 role の nav group / item 数 / schemaDiff badge |
| `useSidebarState.spec.tsx` | localStorage 永続化、SSR safe、drawer route close |
| `SidebarShell.spec.tsx` | active state、collapsed label、slot rendering |
| `SidebarUserMenu.spec.tsx` | 3 role action、SignOutButton reuse |
| layout specs | public/member/admin の session 別 shell projection |

## Playwright

`sidebar-shell-smoke.spec.ts` で role 3 種と viewport 3 種の smoke を実行する。`sidebar-shell-visual.spec.ts` は Linux runner baseline を正とし、macOS 生成 PNG は commit しない。

## 完了条件

実装 wave の verify command が `artifacts.json.metadata.verify_commands` と一致する。
