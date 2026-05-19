# Phase 7: 静的解析

## typecheck

```bash
mise exec -- pnpm typecheck 2>&1 \
  | tee outputs/phase-11/evidence/typecheck.log
```

期待: 0 error。`ReactElement` 戻り値型が `tsconfig.json` の strict 設定下で通ること。

## lint

```bash
mise exec -- pnpm lint 2>&1 \
  | tee outputs/phase-11/evidence/lint.log
```

期待: 0 error / 0 warning。`apps/web/app/profile/loading.tsx` および `loading.spec.tsx` に対する ESLint rule 違反なし。

## test 命名規約

新規 test は `*.spec.tsx` で命名すること（CLAUDE.md 不変条件 #8）。`*.test.tsx` は lefthook `block-test-suffix` が reject する。

```bash
grep -rn "\.test\.tsx\?$" apps/web/app/profile/ || echo "OK: no .test files"
```

## 完了条件

- [ ] typecheck PASS（exit 0）
- [ ] lint PASS（exit 0）
- [ ] `.test.tsx` 命名違反 0 件
