[実装区分: 実装仕様書]

# Phase 6 Output: spec / fixture 実装

仕様本体: `../../phase-06.md`

## 実装対象

- `scripts/lint-stable-key-update.spec.ts`（vitest / 14 ケース）
- 10 fixture（phase-04.md 参照）

## coverage gate

- `pnpm exec vitest run scripts/lint-stable-key-update.spec.ts` 14/14 PASS
- `bash scripts/coverage-guard.sh --no-run` は coverage summary absent boundary として Phase 11 に分離記録

## 状態

`completed`
