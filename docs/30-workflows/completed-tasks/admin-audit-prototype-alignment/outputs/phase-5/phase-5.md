# Phase 5: 実装

> workflow: admin-audit-prototype-alignment

## 実装対象

| Task | ファイル |
|------|----------|
| Task A | `apps/web/app/(admin)/admin/audit/page.tsx`, `apps/web/src/components/admin/AuditLogPanel.tsx` |
| Task A tests | `apps/web/src/components/admin/__tests__/AuditLogPanel.component.spec.tsx`, `apps/web/app/(admin)/admin/audit/page.page.spec.ts` |
| Task B | `apps/web/src/lib/admin/safe-server-fetch.ts`, `apps/api/src/routes/admin/audit.contract.spec.ts`, `apps/api/src/index.spec.ts`, 必要時のみ `apps/api/src/index.ts` / `apps/web/wrangler.toml` |

## 実装境界

- API response shape / zod schema / D1 schema は変更しない。
- 現行 UI primitive API を正とし、`polymorphic Button link API` / `polymorphic Button link API` / `Banner legacy warning tone spelling` は使わない。
- secret / deploy / remote runtime 操作は user-gated。

