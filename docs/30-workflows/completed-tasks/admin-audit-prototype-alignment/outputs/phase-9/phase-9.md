# Phase 9: QA

> workflow: admin-audit-prototype-alignment

## QA コマンド

```bash
mise exec -- pnpm --filter web test -- src/components/admin/__tests__/AuditLogPanel.component.spec.tsx
mise exec -- pnpm --filter web test -- src/lib/admin/__tests__/safe-server-fetch.spec.ts
mise exec -- pnpm --filter web test -- app/\(admin\)/admin/audit/page.page.spec.ts
mise exec -- pnpm --filter api test -- src/routes/admin/audit.contract.spec.ts
mise exec -- pnpm verify:tokens
```

`pnpm typecheck` / `pnpm lint` / `scripts/verify-pr-ready.sh` は実装完了 wave で実行する。

