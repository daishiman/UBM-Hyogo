# Phase 3: クラス名衝突検査

## 検査コマンド

```bash
rg --files apps/web/app apps/web/src/components apps/web/src/lib | rg "schema|identity-conflicts|audit|SchemaDiff|IdentityConflict|AuditLog"
```

## 結果 (2026-05-10)

| canonical owner | 同一 package 内既存 | 方針 |
|--------------|-----------------|-----|
| `SchemaDiffPanel` | apps/web/src/components/admin/SchemaDiffPanel.tsx + __tests__ | patch existing |
| `IdentityConflictRow` | apps/web/src/components/admin/IdentityConflictRow.tsx | patch existing |
| `AuditLogPanel` | apps/web/src/components/admin/AuditLogPanel.tsx + __tests__ | patch existing |
| `apps/web/src/lib/admin/api.ts` | 単一 | additive export only |
| `apps/web/src/lib/admin/server-fetch.ts` | 単一 | reuse |

stale duplicate tree (`src/features/admin`, `src/lib/api/admin-*`) は **存在せず**。
