---
Phase: 6
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-6-test-additions.md
---

# Phase 6 — テスト追加 (task A)

## 追加ケース

| ファイル | ケース | 目的 |
|---------|------|------|
| `shell-config.spec.ts` | `buildNavForRole('admin', { schemaDiffCount: 0 })` snapshot | nav 形状の regression 検知 |
| `shell-config.spec.ts` | `buildNavForRole('admin', { schemaDiffCount: 12 })` snapshot | badge count branch の安定確認 |
| `useSidebarState.spec.tsx` | SSR `renderToString` で throw しないこと | server bundle 安全性 |
| `SidebarShell.spec.tsx` | collapse toggle click → `aria-expanded` 反転 | a11y 状態遷移 |
| `SidebarShell.spec.tsx` | `mobileTriggerSlot` null 渡しで描画破綻なし | optional slot 安全性 |

## 不変条件再確認

- 追加テストは新規 D1 access や API call を要求しない
- すべて pure / DOM / hook test 範囲
