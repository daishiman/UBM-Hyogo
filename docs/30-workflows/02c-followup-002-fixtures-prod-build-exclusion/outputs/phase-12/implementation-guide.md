# Implementation Guide

## Part 1: 初学者向け

学校で使う練習問題のプリントを、本番の配布物に混ぜないための作業です。

開発では、動きを確かめるための練習用データやテスト用ファイルを置くことがあります。これは授業中の下書きや練習プリントのようなものです。本番で使う配布物にそれが混ざると、見せる必要のない情報が入ったり、配布物が重くなったりします。

このタスクでは、練習用ファイルを「練習でだけ使う箱」に入れ、本番用の箱には入らないようにします。さらに、本番用のコードがうっかり練習用ファイルを読もうとしたら、機械が止めるようにします。

| 言葉 | やさしい言い換え |
| --- | --- |
| fixture | 練習用の見本データ |
| test | 動きを確かめる練習 |
| build | 本番で配る形にまとめること |
| production | 実際に使う本番 |
| import | 別のファイルを読みに行くこと |

## Part 2: Technical Guide

### Target invariant

`apps/api/src/**/__fixtures__/**` and `apps/api/src/**/__tests__/**` are test-only. They must not be compiled into production artifacts or imported by production source.

### Planned implementation shape

```ts
type FixtureBuildBoundaryEvidence = {
  buildArtifactContainsFixtures: false;
  buildArtifactContainsTests: false;
  vitestFixtureLoaderStillWorks: true;
  productionImportGuardEnabled: true;
};
```

### Required implementation checks

- Resolve current `apps/api` build scripts before editing.
- Prefer a build-only TypeScript config or equivalent build-specific exclude.
- Keep Vitest include/exclude explicit.
- Add a dependency-cruiser rule scoped to production source.
- Save build/test/static evidence under `outputs/phase-11/`.

### Edge cases

| Edge case | Required handling |
| --- | --- |
| Wrangler ignores `tsconfig.build.json` | prove final artifact absence by grep/listing |
| Vitest setup disappears from include | fix test config, not production config |
| production code needs factory data | create production-safe factory outside test-only folders |
| bundle size does not shrink | do not fail solely on size; zero path inclusion is the required signal |
