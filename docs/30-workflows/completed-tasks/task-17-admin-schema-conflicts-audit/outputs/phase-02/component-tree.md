# Phase 2: Component 階層 + state ownership

## /admin/schema

```
AdminSchemaPage (server)
└─ SchemaDiffPanel (client)
   ├─ section "current" (read-only)
   ├─ section "latest" (read-only)
   └─ diff rows (added/removed/changed/unresolved)
      └─ stableKey input + assign Button
```

## /admin/identity-conflicts

```
AdminIdentityConflictsPage (server)
└─ ul > IdentityConflictRow[] (client)
   ├─ idle: merge / 別人マーク Button
   ├─ merge-confirm: 確認 1/2
   ├─ merge-final: 確認 2/2 + reason textarea + merge 実行
   └─ dismiss: reason textarea + 別人として確定
```

## /admin/audit

```
AdminAuditPage (server)
├─ FilterBar (form, GET submit → searchParams update)
├─ AuditLogPanel (client/server mix)
│  ├─ FilterBar (defaultValue uncontrolled)
│  ├─ Timeline (JST 日付グルーピング)
│  └─ cursor pager
└─ loading.tsx (suspense fallback)
```

## State ownership

| state | owner | 引き渡し |
|-------|-------|---------|
| `stableKey` 入力値 | SchemaDiffPanel row state | row 単位独立 |
| conflict action `stage` (idle/merge-confirm/merge-final/dismiss) | IdentityConflictRow internal state | useState |
| conflict `reason` | IdentityConflictRow internal state | useState |
| `isPending` | useTransition | merge/dismiss action |
| filter form values | URL searchParams (source of truth) | uncontrolled defaultValue |
| `cursor` | URL searchParams | next URL 構築 |

## VSCPKR-03: テスト操作対象区分

| component | 操作対象 |
|-----------|--------|
| SchemaDiffPanel | row state は internal、items は prop |
| IdentityConflictRow | reason / stage は internal、item は prop |
| AuditLogPanel | filter は uncontrolled、items / cursor は prop |
