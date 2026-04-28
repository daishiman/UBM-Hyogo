# Phase 2 — module-map: 公開 interface 一覧

## `_shared/brand.ts`（02a/02b と共有、02c が正本）

```ts
declare const MemberIdBrand: unique symbol;
declare const ResponseIdBrand: unique symbol;
declare const StableKeyBrand: unique symbol;
declare const AdminEmailBrand: unique symbol;
declare const MagicTokenBrand: unique symbol;

export type MemberId = string & { readonly [MemberIdBrand]: true };
export type ResponseId = string & { readonly [ResponseIdBrand]: true };
export type StableKey = string & { readonly [StableKeyBrand]: true };
export type AdminEmail = string & { readonly [AdminEmailBrand]: true };
export type MagicTokenValue = string & { readonly [MagicTokenBrand]: true };

export const memberId = (s: string): MemberId => s as MemberId;
export const responseId = (s: string): ResponseId => s as ResponseId;
export const stableKey = (s: string): StableKey => s as StableKey;
export const adminEmail = (s: string): AdminEmail => s as AdminEmail;
export const magicTokenValue = (s: string): MagicTokenValue => s as MagicTokenValue;
```

## `_shared/db.ts`

```ts
import type { D1Database } from "@cloudflare/workers-types";
export interface DbCtx {
  readonly db: D1Database;
}
export const ctx = (env: { DB: D1Database }): DbCtx => ({ db: env.DB });
```

## `adminUsers.ts`

```ts
export type AdminRole = "owner" | "manager" | "viewer";

export interface AdminUserRow {
  email: AdminEmail;
  role: AdminRole;
  createdAt: string;
  lastSeenAt: string | null;
}

export const findByEmail: (c: DbCtx, e: AdminEmail) => Promise<AdminUserRow | null>;
export const listAll: (c: DbCtx) => Promise<AdminUserRow[]>;
export const touchLastSeen: (c: DbCtx, e: AdminEmail, at: string) => Promise<void>;
// upsert は seed / wrangler 投入のみ。本タスクでは write API を提供しない
```

## `adminNotes.ts`（builder 経路に存在しない）

```ts
export interface AdminMemberNoteRow {
  noteId: string;
  memberId: MemberId;
  body: string;
  createdBy: AdminEmail;
  createdAt: string;
  updatedAt: string;
}

export interface NewAdminMemberNote {
  memberId: MemberId;
  body: string;
  createdBy: AdminEmail;
}

export const listByMemberId: (c: DbCtx, mid: MemberId) => Promise<AdminMemberNoteRow[]>;
export const create: (c: DbCtx, input: NewAdminMemberNote) => Promise<AdminMemberNoteRow>;
export const update: (c: DbCtx, id: string, body: string, by: AdminEmail) => Promise<AdminMemberNoteRow>;
export const remove: (c: DbCtx, id: string, by: AdminEmail) => Promise<void>;
// 不変条件 #12: builder 経路（02a の _shared/builder.ts）には絶対に呼ばれない
// 04c admin route のみが呼ぶ
```

## `auditLog.ts`（append-only）

```ts
export interface AuditLogEntry {
  id: string;
  actor: AdminEmail;
  action: string;            // 'member.publish_state_changed' / 'member.deleted' / 'tag.queue.resolved' 等
  targetType: "member" | "tag_queue" | "schema_diff" | "meeting" | "system";
  targetId: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface NewAuditLogEntry {
  actor: AdminEmail;
  action: string;
  targetType: AuditLogEntry["targetType"];
  targetId: string | null;
  metadata: Record<string, unknown>;
  occurredAt?: string;       // 省略時 now()
}

export const append: (c: DbCtx, e: NewAuditLogEntry) => Promise<AuditLogEntry>;
export const listRecent: (c: DbCtx, limit: number) => Promise<AuditLogEntry[]>;
export const listByActor: (c: DbCtx, actor: AdminEmail, limit: number) => Promise<AuditLogEntry[]>;
export const listByTarget: (c: DbCtx, targetType: AuditLogEntry["targetType"], targetId: string, limit: number) => Promise<AuditLogEntry[]>;
// UPDATE / DELETE API は提供しない（append-only を構造で守る）
```

## `syncJobs.ts`（状態遷移）

```ts
export type SyncJobKind = "forms_schema" | "forms_response";
export type SyncJobStatus = "running" | "succeeded" | "failed";

export const ALLOWED_TRANSITIONS: Record<SyncJobStatus, readonly SyncJobStatus[]> = {
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
} as const;

export class IllegalStateTransition extends Error {
  constructor(public readonly from: SyncJobStatus, public readonly to: SyncJobStatus) {
    super(`sync_jobs: ${from} -> ${to} is not allowed`);
  }
}

export interface SyncJobRow {
  id: string;
  kind: SyncJobKind;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string | null;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
}

export const start: (c: DbCtx, kind: SyncJobKind) => Promise<SyncJobRow>;
export const succeed: (c: DbCtx, id: string, result: Record<string, unknown>) => Promise<SyncJobRow>;
export const fail: (c: DbCtx, id: string, msg: string) => Promise<SyncJobRow>;
export const findLatest: (c: DbCtx, kind: SyncJobKind) => Promise<SyncJobRow | null>;
export const listRecent: (c: DbCtx, limit: number) => Promise<SyncJobRow[]>;
```

## `magicTokens.ts`（single-use）

```ts
export interface MagicTokenRow {
  token: MagicTokenValue;
  email: string;             // member email or admin email
  purpose: "login" | "admin_login";
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface IssueMagicTokenInput {
  email: string;
  purpose: "login" | "admin_login";
  ttlSec: number;            // expires_at = now + ttlSec
}

export type ConsumeResult =
  | { ok: true; row: MagicTokenRow }
  | { ok: false; reason: "expired" | "already_used" | "not_found" };

export const issue: (c: DbCtx, input: IssueMagicTokenInput) => Promise<MagicTokenRow>;
export const verify: (c: DbCtx, t: MagicTokenValue) => Promise<MagicTokenRow | null>; // expired or used → null
export const consume: (c: DbCtx, t: MagicTokenValue, at: string) => Promise<ConsumeResult>;
// consume は usedAt 設定 + 楽観 lock で single-use を強制
```

## `__tests__/_setup.ts`（02a / 02b / 02c 共通利用）

```ts
import type { DbCtx } from "../_shared/db.ts";

export interface InMemoryD1 {
  ctx: DbCtx;
  loadFixtures: (paths: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

export const setupD1: () => Promise<InMemoryD1>;
// miniflare の D1 を作り、01a の全 migration を適用後に返す
```

## handoff: 下流 task の利用パターン

| 下流 | import | 使い方 |
| --- | --- | --- |
| 03a / 03b | `syncJobs` | `const job = await syncJobs.start(c, "forms_schema"); ...; await syncJobs.succeed(c, job.id, result);` |
| 04c | `adminUsers, adminNotes, auditLog` | admin route handler 内で利用 |
| 05a | `adminUsers` | `const u = await adminUsers.findByEmail(c, email); if (!u) throw 403;` |
| 05b | `magicTokens` | `const r = await magicTokens.consume(c, token, now); if (!r.ok) ...` |
| 07c | `auditLog, adminNotes` | admin workflow 各ステップ後に append |
| 08a | 全 repo + `_setup` | contract test |
| 02a / 02b | `_shared/{db,brand}, __tests__/_setup` | 自 domain repository 実装と test |
