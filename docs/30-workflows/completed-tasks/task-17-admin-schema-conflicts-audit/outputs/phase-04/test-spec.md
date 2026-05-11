# Phase 4: テスト spec (TDD Red 元)

> 本 task は contract hardening のため、Red phase は spec 上の論理段階。
> 実 test は既に Green 状態 (canonical files 全実装済) として Phase 5/6 に整理済。

## 対象 test files

| file | ケース数 | 状態 |
|------|---------|------|
| `apps/web/src/lib/admin/__tests__/api.test.ts` | 10+ | Green |
| `apps/web/app/(admin)/admin/audit/page.test.ts` | 2 | Green |
| `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx` | 11+ (added/removed/changed/unresolved + retryable continuation + 409/422/404) | Green |
| `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx` | 8+ (empty/JST/system fallback/masked JSON/grouping) | Green |

## helper / route 期待値表

### `postSchemaAlias()`
- POST `/api/admin/schema/aliases` body=`{ questionId, stableKey, diffId? }`
- 202 retryable continuation: `mode="apply"` + `backfill.status="exhausted"` + `retryable=true` + `code="backfill_cpu_budget_exhausted"` を `isSchemaAliasRetryableContinuation()` が narrow

### audit/page.test.ts (`jstLocalToUtcIso`)
- `2026-05-01T00:00` → `2026-04-30T15:00:00.000Z`
- `2026-05-01T23:59` → `2026-05-01T14:59:00.000Z`
- 不正値 (`2026-05-01`, `undefined`) → undefined

## a11y

`SchemaDiffPanel` / `AuditLogPanel` で `expect(await axe(container)).toHaveNoViolations()` (jest-axe critical 0) を組み込み済。

## ローカル検証

```bash
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

実行結果 (2026-05-10): **all green** (516 passed | 1 skipped)。
