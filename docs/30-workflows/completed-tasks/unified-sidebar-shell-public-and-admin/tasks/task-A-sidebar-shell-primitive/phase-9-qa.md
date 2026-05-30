---
Phase: 9
task_id: unified-sidebar-shell-public-and-admin--task-A-sidebar-shell-primitive
親: ../../phase-9-qa.md
---

# Phase 9 — QA (task A)

## 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run src/components/shell
```

## 期待結果

| 項目 | 期待 |
|------|------|
| typecheck | エラー 0 |
| lint | エラー 0、warning 0（既存 baseline 維持） |
| `shell-config.spec.ts` | 全ケース GREEN |
| `useSidebarState.spec.tsx` | 全ケース GREEN |
| `SidebarShell.spec.tsx` | 全ケース GREEN |
| 旧 `AdminSidebar` | リポジトリに残存（Task D まで削除しない） |
| HEX 直書き grep | `apps/web/src/components/shell/` 配下 0 件 |

## 不合格時の対応

- typecheck 失敗 → 型注釈漏れ / import 不整合を最小差分で修正
- lint 失敗 → `pnpm lint --fix` 後に残違反のみ手修正
- spec 失敗 → 該当 component の責務境界を Phase 2 設計と突き合わせて修正
