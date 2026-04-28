# Implementation Guide

## Part 1: Concept

Why this is needed first: member data comes from forms, consent settings, public visibility rules, tags, and response history. If every API endpoint reads those tables in its own way, the same person can look public in one screen and hidden in another.

Think of this repository layer like a school office. A teacher should not search every classroom, locker, and attendance sheet directly each time they need a student record. The office keeps the official records, checks who is allowed to see what, and hands over the right summary.

This task builds that office for member data. Public visitors only receive public fields for consented, non-deleted members. Members can see their own member-visible fields. Admin views receive admin fields, but admin notes stay separate and are passed in explicitly.

No screenshot is attached because this task does not change a product UI route. Phase 11 evidence is non-visual and lives in `outputs/phase-11/manual-smoke-log.md` and `outputs/phase-11/manual-evidence.md`.

## Part 2: Developer Contract

### Core Types

```typescript
export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

export interface DbCtx {
  readonly db: D1Db;
}
```

### Main APIs

```typescript
ctx(env: { DB: D1Db }): DbCtx
findMemberById(c: DbCtx, id: MemberId): Promise<MemberIdentityRow | null>
listMembersByIds(c: DbCtx, ids: MemberId[]): Promise<MemberIdentityRow[]>
getStatus(c: DbCtx, id: MemberId): Promise<MemberStatusRow | null>
listStatusesByMemberIds(c: DbCtx, ids: MemberId[]): Promise<MemberStatusRow[]>
findCurrentResponse(c: DbCtx, mid: MemberId): Promise<MemberResponseRow | null>
listResponsesByIds(c: DbCtx, ids: ResponseId[]): Promise<MemberResponseRow[]>
buildPublicMemberProfile(c: DbCtx, mid: MemberId): Promise<PublicMemberProfile | null>
buildMemberProfile(c: DbCtx, mid: MemberId): Promise<MemberProfile | null>
buildAdminMemberDetailView(c: DbCtx, mid: MemberId, adminNotes: AdminAudit[]): Promise<AdminMemberDetailView | null>
buildPublicMemberListItems(c: DbCtx, mids: MemberId[]): Promise<PublicMemberListItem[]>
```

### Basic Usage

```typescript
import { ctx } from "./repository/_shared/db";
import { asMemberId } from "./repository/_shared/brand";
import { buildPublicMemberProfile } from "./repository/_shared/builder";

app.get("/public/members/:id", async (c) => {
  const db = ctx(c.env);
  const profile = await buildPublicMemberProfile(db, asMemberId(c.req.param("id")));
  if (!profile) return c.json({ error: "not found" }, 404);
  return c.json(profile);
});
```

### List Usage

`buildPublicMemberListItems()` now uses batch reads for identities, statuses, and responses. It filters deleted, non-consented, and non-public members before building list rows.

```typescript
const members = await buildPublicMemberListItems(db, [
  asMemberId("m_001"),
  asMemberId("m_002"),
]);
```

### Error Handling And Edge Cases

| Case | Behavior |
| --- | --- |
| Unknown member id | Returns `null` for profile APIs |
| Missing status | Public/member profile returns `null`; list excludes the member |
| `is_deleted = 1` | Public/member profile returns `null`; admin detail can still resolve |
| `public_consent != "consented"` | Public profile and public list exclude the member |
| `publish_state != "public"` | Public profile and public list exclude the member |
| Invalid `answers_json` | Summary falls back to empty/default values |
| Missing field visibility | Defaults to `member`, not public |
| Admin notes | Caller must pass them to `buildAdminMemberDetailView`; public/member models never contain them |

### Parameters And Constants

| Item | Value / Rule |
| --- | --- |
| D1 binding | `env.DB` |
| Repository root | `apps/api/src/repository/` |
| Public visibility | `public` only |
| Member visibility | `public` + `member` |
| Admin visibility | `public` + `member` + `admin` |
| Default field visibility | `member` |
| Public list query budget | Fixed batch query count for identity/status/response assembly |
| UI screenshot evidence | N/A for this non-visual task |

### Verification Commands

```bash
pnpm vitest run apps/api/src/repository/__tests__ packages/shared/src/types packages/shared/src/zod packages/shared/src/utils
pnpm vitest run apps/api/src/repository/__tests__/builder.test.ts apps/api/src/repository/__tests__/status.test.ts apps/api/src/repository/__tests__/responses.test.ts
pnpm typecheck
```

Root `pnpm test` can require local secret authorization through `scripts/with-env.sh`; in this worktree it was blocked by authorization timeout.
