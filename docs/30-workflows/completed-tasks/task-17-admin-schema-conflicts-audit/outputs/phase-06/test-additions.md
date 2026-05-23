# Phase 6: テスト拡充結果

## 状態

既存 test files に Phase 6 で求められるエッジケースは **網羅済**。本 phase での追加 test 不要。

## 既存 test カバー範囲確認

### `apps/web/src/lib/admin/__tests__/api.test.ts`
- 409 / 422 / 404 / 202 retryable continuation 各分岐 covered
- backfill `affectedCount` 0 / 1 / 9999 境界値 OK
- `postSchemaAlias` 404 → `ASSIGN_NOT_AVAILABLE` 相当の status 0/404 narrow OK

### IdentityConflictRow (e2e: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts`)
- merge body `{ targetMemberId, reason }` の zod parse による drift gate (G1)
- dismiss body `{ reason }`
- reason 空文字で merge/dismiss 実行 disabled (`reason.trim().length === 0`)

### `apps/web/src/components/admin/__tests__/AuditLogPanel.test.tsx`
- empty / JST 表示 / `actorEmail=null` system fallback / masked JSON disclosure
- 同日複数 entry 集約 / `targetId` slice(0,8)
- date 範囲指定 UTC ISO 反映

### `apps/web/app/(admin)/admin/audit/page.test.ts` (`audit-query.ts`)
- JST → UTC ISO 変換境界

### `apps/web/src/components/admin/__tests__/SchemaDiffPanel.test.tsx`
- 4 type (added/removed/changed/unresolved) 全分岐
- 連打 guard / busy 中 disabled / 失敗後 reset / ESC modal close

### a11y 回帰
- jest-axe critical violations 0
- focus trap (Modal primitive)

## 検証

```bash
mise exec -- pnpm -F @ubm-hyogo/web test --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```

実行結果 (2026-05-10): all green。
