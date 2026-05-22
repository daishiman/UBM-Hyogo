# Phase 05 — `vitest.config.ts` patch スケルトン（採用時のみ）

Status: SKELETON_READY (適用判断は Phase 11 後)
Date: 2026-05-09

> 本 Phase は「triage 採用」確定時にのみ実装する。Phase 11 で baseline 3 回 PASS が得られた no-code verification close-out 時は **適用しない**（skip 記録を残すのみ）。

## 採用軸 B: `--maxWorkers=1 --minWorkers=1`

最小侵襲は `apps/api/package.json` 側に CLI flag を追加する案。`vitest.config.ts` には触れない。

```jsonc
// apps/api/package.json (excerpt, conditional)
{
  "scripts": {
    "test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --maxWorkers=1 --minWorkers=1 apps/api"
  }
}
```

## 採用軸 A: `pool=forks`

`apps/api` 単独の test:coverage script のみに `--pool=forks` を足す案を優先。global config 改変（`vitest.config.ts`）は他アプリへの副作用懸念のため採用しない。

```jsonc
// apps/api/package.json (excerpt, conditional)
{
  "scripts": {
    "test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --pool=forks apps/api"
  }
}
```

global 採用が必要と判断された場合のみ `vitest.config.ts` に追加:

```ts
// vitest.config.ts (excerpt, conditional, fallback case only)
export default defineConfig({
  // ...existing plugins/resolve/optimizeDeps...
  test: {
    // ...existing fields...
    pool: "forks",
    poolOptions: {
      forks: { singleFork: false },
    },
  },
});
```

## 採用軸 C: `--no-file-parallelism`

```jsonc
// apps/api/package.json (excerpt, conditional)
{
  "scripts": {
    "test:coverage": "vitest run --passWithNoTests --root=../.. --config=vitest.config.ts --coverage --coverage.reportsDirectory=apps/api/coverage --coverage.include=\"apps/api/src/**/*.{ts,tsx}\" --no-file-parallelism apps/api"
  }
}
```

## 採用軸 D: `--shard=1/2 + 2/2`

CI gate に shard を直接入れる場合は別 Issue。本仕様書では package.json は変更せず、`scripts/api-coverage-rerun.sh matrix --axis=D` 経由で実行する形に留める。

## 既存 test object 保持規則

- `vitest.config.ts` を編集する場合は `plugins` / `resolve` / `optimizeDeps` / `test.environment` / `test.testTimeout` / `test.hookTimeout` / `test.include` / `test.coverage` を **必ず保持**する。
- 追加するのは `test.pool` / `test.poolOptions` / `test.maxWorkers` / `test.minWorkers` / `test.fileParallelism` のいずれか。
- `defineConfig({ test: UserConfig['test'] })` の型互換は破壊しない。新規 export は無し。

## 影響評価

- `apps/api/package.json` のみの変更は他 workspace（`apps/web` / `packages/*`）に副作用なし。
- `vitest.config.ts` の global 編集は `apps/web` / `packages/*` にも波及するため、最終手段として保留。

## 検証コマンド（patch 適用後）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test:coverage
```

## 適用判断

Phase 11 の `triage-summary.md` 採用軸欄を踏まえ、Phase 12 implementation-guide.md に「適用 / 非適用 / skip 理由」を確定記録する。
