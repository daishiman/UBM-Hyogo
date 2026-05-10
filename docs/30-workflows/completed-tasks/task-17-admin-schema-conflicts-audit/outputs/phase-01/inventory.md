# Phase 1: 既存ファイル inventory

```
apps/web/app/(admin)/admin/
├── audit/
│   ├── audit-query.ts
│   ├── loading.tsx
│   ├── page.test.ts
│   └── page.tsx
├── identity-conflicts/
│   └── page.tsx
└── schema/
    └── page.tsx

apps/web/src/components/admin/
├── AuditLogPanel.tsx
├── IdentityConflictRow.tsx
├── SchemaDiffPanel.tsx
├── (他 task-15/16 担当 component 群)
└── __tests__/
    ├── AuditLogPanel.test.tsx
    ├── IdentityConflictRow.test.tsx (なし — 既存 e2e で検証)
    └── SchemaDiffPanel.test.tsx

apps/web/src/lib/admin/
├── __tests__/
│   └── api.test.ts
├── api.ts
├── server-fetch.ts
└── types.ts
```

## 確認

- 並列 tree (`apps/web/src/features/admin/`, `apps/web/src/lib/api/admin-*.ts`) は存在せず、stale duplicate なし
- `apps/api` endpoint surface (8 endpoints) は phase-01 spec inventory と一致
