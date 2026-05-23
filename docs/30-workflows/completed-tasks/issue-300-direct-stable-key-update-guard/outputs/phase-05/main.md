[実装区分: 実装仕様書]

# Phase 5 Output: guard script 実装 / dead code 削除

仕様本体: `../../phase-05.md`

## 実装対象

- new: `scripts/lint-stable-key-update.mjs`
- modify(delete): `apps/api/src/repository/schemaQuestions.ts` lines 153-172（`updateStableKey()`）

## 関数

- `stripComments` / `isException` / `listFiles` / `findViolations` / `main`

## ローカル検証

```bash
mise exec -- node scripts/lint-stable-key-update.mjs
mise exec -- node scripts/lint-stable-key-update.mjs --strict
mise exec -- pnpm typecheck
mise exec -- pnpm build
```

## 状態

`completed`
