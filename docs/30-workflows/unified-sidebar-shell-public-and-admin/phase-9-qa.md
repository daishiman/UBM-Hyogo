# Phase 9: QA

## Local gates

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm/web test --run src/components/shell
mise exec -- pnpm --filter @ubm/web exec playwright test sidebar-shell-smoke
```

## Visual gates

Linux runner で `sidebar-shell-visual.spec.ts` の 7 screenshots を生成・比較する。macOS local baseline は参考に限定し、commit 対象にしない。

## 完了条件

local gates と visual plan が Phase 11 inventory に反映される。
