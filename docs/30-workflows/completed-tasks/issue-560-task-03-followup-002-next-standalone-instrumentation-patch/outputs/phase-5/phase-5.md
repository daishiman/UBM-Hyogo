# Phase 5 Output — RED 実装

RED は「既存 script が新 AC を満たさない」ことを意味する。script 不在前提は採用しない。

実装結果:
- `scripts/__tests__/patch-next-standalone-instrumentation.test.mjs` を新規追加（node --test runner）
- TC-01〜TC-07 を 9 ケース化（TC-06 は a/b/c の 3 サブケース）
- fixture は `os.tmpdir()` 配下に `apps/web` 構造を組み立てて `process.cwd()` を切替
- 改修前の patch script では cwd guard / `--verify-only` / token 検証 / malformed trace JSON の structured failure が無く RED となる設計
