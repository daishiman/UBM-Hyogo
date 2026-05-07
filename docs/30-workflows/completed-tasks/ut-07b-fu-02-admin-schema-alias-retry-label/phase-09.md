# Phase 9: 品質保証

`[実装区分: 実装仕様書]`

## 1. 検証コマンド

```bash
# typecheck
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# unit + component test
mise exec -- pnpm --filter @ubm-hyogo/web test

# 個別実行（fast feedback）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.test.ts
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx
```

> filter 名が `@ubm-hyogo/web` でない場合は `apps/web/package.json#name` の実値に置換。

## 2. API contract 不変検証

```bash
git diff main...HEAD --name-only | grep -E '^apps/api/'
# 期待: 出力なし（apps/api 配下に変更がないこと）
```

```bash
git diff main...HEAD apps/api/src/routes/admin/schema.ts apps/api/src/workflows/schemaAliasAssign.ts
# 期待: 空 diff
```

## 3. 不変条件チェック

```bash
# 不変条件 #5: web から D1 直接アクセス禁止
rg "from\s+['\"].*@cloudflare/workers-types|D1Database" apps/web/src/lib/admin/api.ts apps/web/src/components/admin/SchemaDiffPanel.tsx
# 期待: 出力なし

# 不変条件 #11: profile mutation を web に追加していないこと
git diff main...HEAD apps/web/src/lib/admin/api.ts | grep -E '^\+' | grep -iE 'profile|bio|self.update'
# 期待: 出力なし
```

## 4. 表示文言 / role 確認

```bash
rg "Back-fill 再試行可能|続きから処理" apps/web/src
# 期待: SchemaDiffPanel.tsx と test に存在し、それ以外には出ない（DRY）

rg "isSchemaAliasRetryableContinuation" apps/web/src
# 期待: api.ts (定義) / SchemaDiffPanel.tsx (利用) / api.test.ts (利用) / SchemaDiffPanel.test.tsx (mock 検証) の 4 箇所
```

## 5. 完了条件（QA gate）

- [ ] `typecheck` PASS
- [ ] `lint` PASS（warning 増加 0）
- [x] focused Vitest PASS（30 tests: `api.test.ts` 19 + `SchemaDiffPanel.test.tsx` 11）
- [ ] `apps/api/` の差分ゼロ
- [ ] 不変条件 #5 / #11 / #14 違反なし
- [ ] retryable label の重複定義なし
