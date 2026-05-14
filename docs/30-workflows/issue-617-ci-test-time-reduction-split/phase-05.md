# Phase 5: vitest config 分割実装

## 変更対象

- `vitest.config.ts`（root, 編集）
- `vitest.d1.config.ts`（root, 新規）

## 実装

### `vitest.config.ts` 差分方針

- `test.include` は現状維持
- `test.exclude` に Phase 4 で分類された D1 group の test path glob を追加（unit 既定では D1 を除外）
- `test.coverage.reportsDirectory` は呼び出し側 npm script の `--coverage.reportsDirectory` でオーバライドする現行運用を維持
- `test.pool` は未指定（既定 `threads`）。unit は並列維持

### `vitest.d1.config.ts` 新規

`vitest.d1.config.ts` は `mergeConfig` を使わず、base config と同じ plugin / resolve /
optimizeDeps を明示再構成する。理由: Vitest の array 系 (`include` / `exclude`) を
merge すると D1 専用 include が root include と concat され、D1-only config にならないため。

base から再利用するのは coverage 設定だけとし、`reportsDirectory` を
`apps/api/coverage/d1` に上書きする。

## 検証

```bash
mise exec -- pnpm exec vitest run --config=vitest.config.ts --passWithNoTests
mise exec -- pnpm exec vitest run --config=vitest.d1.config.ts --passWithNoTests
```

期待: 両 config が exit 0、含まれる test ファイル一覧が排他になっている。

## 完了条件

- `vitest.config.ts` から D1 依存 test が exclude されている
- `vitest.d1.config.ts` が base coverage 設定だけを再利用し、include / pool / coverage.reportsDirectory が正しい
- 両 config の include が disjoint（重複なし）
