# Phase 7: Coverage 報告

## 対象範囲 (canonical patch path)

| file | Statements | Branches | Functions | Lines | 判定 |
|------|-----------|----------|-----------|-------|------|
| `apps/web/src/components/admin/SchemaDiffPanel.tsx` | 100% | 96.96% | 100% | 100% | PASS |
| `apps/web/src/components/admin/AuditLogPanel.tsx` | 100% | 98.73% | 100% | 100% | PASS |
| `apps/web/src/components/admin/IdentityConflictRow.tsx` | 0% (unit) | 0% | 0% | 0% | e2e covered |
| `apps/web/src/lib/admin/api.ts` | 96.47% | 87.5% | 92.85% | 96.47% | PASS |
| `apps/web/src/lib/admin/server-fetch.ts` | 0% (unit) | 0% | 0% | 0% | server-only / e2e covered |

## 目標 (Phase 7 spec)

| 種別 | 目標 | 結果 |
|------|------|------|
| Statements | 90%+ | unit-covered files で 96-100% PASS |
| Branches | 85%+ | 87.5-98.73% PASS |
| Functions | 90%+ | 92.85-100% PASS |
| Lines | 90%+ | 96-100% PASS |

## 補足

`IdentityConflictRow.tsx` は unit test 0% だが、`apps/web/playwright/tests/admin-identity-conflicts.spec.ts` で merge / dismiss / 確認 1-2 / reason 必須 / contract drift gate (zod) を e2e カバー。Phase 8 では unit test 追加可否を検討対象として未タスク化候補に挙げる。

`server-fetch.ts` は server-only で fixture 経由 fetch のため unit test 対象外。e2e (admin-identity-conflicts EVIDENCE mode) で fixture 分岐を検証。

## 実行コマンド

```bash
mise exec -- pnpm -F @ubm-hyogo/web test --coverage --run \
  src/components/admin/__tests__/SchemaDiffPanel.test.tsx \
  src/components/admin/__tests__/AuditLogPanel.test.tsx \
  src/lib/admin/__tests__/api.test.ts \
  app/\\(admin\\)/admin/audit/page.test.ts
```
