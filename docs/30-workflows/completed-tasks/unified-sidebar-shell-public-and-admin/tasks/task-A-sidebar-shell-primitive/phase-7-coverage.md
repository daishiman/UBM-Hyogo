---
Phase: 7
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-7-coverage.md
---

# Phase 7 — カバレッジ (task A)

## 目標

| 対象 | line / branch / function | 根拠 |
|------|--------------------------|------|
| `shell-config.ts` | 100% / 100% / 100% | 純関数のみ。全 role × badge branch 網羅可能 |
| `useSidebarState.ts` | 100% / 100% / 100% | hook 初期/toggle/SSR/hydration 4 ケースで網羅 |
| `SidebarShell.tsx` 及び primitives | ≥ 90% line / ≥ 90% branch | viewer/member/admin × expanded/collapsed × active/inactive で網羅 |
| `icons.tsx` | ≥ 80% | 全 id render 1 ケースで十分 |

## 測定コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell --coverage
```

## 例外

- `SidebarShell.server.tsx` は session mocking の負担に対し収益が低いため、unit 対象外。Playwright smoke（親 wave）で実 path をカバー
