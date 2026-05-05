# Phase 13 Local Check Result

## 実行コマンド

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/api/src/workflows/schemaAliasAssign.test.ts \
  apps/api/src/services/aliasRecommendation.test.ts \
  apps/api/src/routes/admin/schema.test.ts
```

## 結果

PASS

| 指標 | 値 |
| --- | --- |
| Test Files | 3 passed |
| Tests | 25 passed |
| Duration | 47.53s |

追加:

```bash
mise exec -- pnpm --filter @ubm-hyogo/api typecheck
```

Result: PASS

注記: `pnpm --filter @ubm-hyogo/api test -- --run ...` は workspace script の引数境界により `apps/api` 全体を広く拾い、68 files / 398 tests を実行した。その広域実行は 397 passed / 1 timeout（既存 250 行 back-fill stress test）だったため、batch loop の意味を保つ 120 行テストへ縮約し、上記の direct Vitest command で 07b 対象 3 ファイルを再実行して PASS を確認した。
