# Phase 11: manual-evidence

## ローカル検証ログ
```
$ mise exec -- pnpm --filter @ubm-hyogo/api typecheck
> tsc -p tsconfig.json --noEmit
（出力なし = 緑）

$ mise exec -- pnpm vitest run apps/api/src/repository
Test Files  7 passed (7)
     Tests  42 passed (42)
```

## UI スクリーンショット
本タスクは repository 層実装のため UI 成果物なし。
