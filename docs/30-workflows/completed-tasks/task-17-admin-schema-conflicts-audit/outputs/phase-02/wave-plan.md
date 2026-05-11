# Phase 2: Wave 分割

| Wave | 内容 | gate | 状態 |
|------|------|------|------|
| W1 | task-15 W5 通過確認 + endpoint 存在検証 | 不在 endpoint 0 | DONE (8/8 endpoint 存在) |
| W2 | `apps/web/src/lib/admin/{api,server-fetch}.ts` helper + contract test | focused unit test green | DONE (api.test.ts green) |
| W3 | `SchemaDiffPanel` + `/admin/schema/page.tsx` | SSR 200 + diff list | DONE (SchemaDiffPanel.test.tsx green) |
| W4 | `IdentityConflictRow` + `/admin/identity-conflicts/page.tsx` | merge/dismiss 動作 | DONE (existing e2e green) |
| W5 | `AuditLogPanel` + `/admin/audit/page.tsx` | filter URL 反映 + cursor pager | DONE (audit/page.test.ts + AuditLogPanel.test.tsx green) |
| W6 | jest-axe + vitest + 手動 smoke | task-18 引き渡し | partial (Phase 11 NON_VISUAL fallback) |
