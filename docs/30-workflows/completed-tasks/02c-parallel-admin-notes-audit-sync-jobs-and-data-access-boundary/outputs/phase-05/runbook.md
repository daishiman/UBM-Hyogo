# Phase 5 — runbook: 10 ステップ実装手順

> このランブックは Phase 6 以降の実装エージェントが利用する。本ランブックには **placeholder のコード** が書かれているが、Phase 5 ではファイルを **作成しない**。実装は Phase 6 以降で行う。

## Step 0: 前提確認

```bash
# 01a の D1 migration が存在
test -f apps/api/db/migrations/0001_init.sql || exit 1

# 01b の zod / branded type が存在
test -f packages/shared/src/view-models/admin.ts || exit 1

# 02a / 02b の Phase 1-2 が完了し、`_shared/` の正本が 02c という合意が取れていること
# （02a Phase 1 main.md / 02b Phase 1 main.md に記述されている前提）
```

## Step 1: ディレクトリ作成 / 既存併合

```bash
# `_shared/` は 02a/02b と共通、02c が「正本」として完成
mkdir -p apps/api/src/repository/_shared
mkdir -p apps/api/src/repository/__fixtures__
mkdir -p apps/api/src/repository/__tests__
```

## Step 2: branded type / db ctx 配置（02a/02b 共通）

### `apps/api/src/repository/_shared/brand.ts`（正本）

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

### `apps/api/src/repository/_shared/db.ts`（正本）

```ts
import type { D1Database } from "@cloudflare/workers-types";
export interface DbCtx { readonly db: D1Database; }
export const ctx = (env: { DB: D1Database }): DbCtx => ({ db: env.DB });
```

## Step 3: adminUsers / adminNotes 配置

### `apps/api/src/repository/adminUsers.ts`

```ts
import type { DbCtx } from "./_shared/db";
import type { AdminEmail } from "./_shared/brand";

export type AdminRole = "owner" | "manager" | "viewer";

export interface AdminUserRow {
  email: AdminEmail;
  role: AdminRole;
  createdAt: string;
  lastSeenAt: string | null;
}

export const findByEmail = async (c: DbCtx, e: AdminEmail): Promise<AdminUserRow | null> => {
  return await c.db.prepare(
    "SELECT email, role, created_at AS createdAt, last_seen_at AS lastSeenAt FROM admin_users WHERE email = ?1 LIMIT 1"
  ).bind(e).first<AdminUserRow>();
};

export const listAll = async (c: DbCtx): Promise<AdminUserRow[]> => {
  const r = await c.db.prepare(
    "SELECT email, role, created_at AS createdAt, last_seen_at AS lastSeenAt FROM admin_users ORDER BY created_at ASC"
  ).all<AdminUserRow>();
  return r.results;
};

export const touchLastSeen = async (c: DbCtx, e: AdminEmail, at: string): Promise<void> => {
  await c.db.prepare("UPDATE admin_users SET last_seen_at = ?1 WHERE email = ?2").bind(at, e).run();
};
```

### `apps/api/src/repository/adminNotes.ts`

```ts
import type { DbCtx } from "./_shared/db";
import type { MemberId, AdminEmail } from "./_shared/brand";

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

export const listByMemberId = async (c: DbCtx, mid: MemberId): Promise<AdminMemberNoteRow[]> => {
  const r = await c.db.prepare(
    "SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM admin_member_notes WHERE member_id = ?1 ORDER BY created_at DESC"
  ).bind(mid).all<AdminMemberNoteRow>();
  return r.results;
};

export const create = async (c: DbCtx, input: NewAdminMemberNote): Promise<AdminMemberNoteRow> => {
  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.db.prepare(
    "INSERT INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?5)"
  ).bind(noteId, input.memberId, input.body, input.createdBy, now).run();
  return { noteId, memberId: input.memberId, body: input.body, createdBy: input.createdBy, createdAt: now, updatedAt: now };
};

export const update = async (c: DbCtx, noteId: string, body: string, by: AdminEmail): Promise<AdminMemberNoteRow> => {
  const now = new Date().toISOString();
  await c.db.prepare(
    "UPDATE admin_member_notes SET body = ?1, updated_at = ?2, updated_by = ?3 WHERE note_id = ?4"
  ).bind(body, now, by, noteId).run();
  return (await c.db.prepare(
    "SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM admin_member_notes WHERE note_id = ?1"
  ).bind(noteId).first<AdminMemberNoteRow>())!;
};

export const remove = async (c: DbCtx, noteId: string, _by: AdminEmail): Promise<void> => {
  await c.db.prepare("DELETE FROM admin_member_notes WHERE note_id = ?1").bind(noteId).run();
};

// 重要: builder 経路（02a の _shared/builder.ts）には絶対に呼ばれない（不変条件 #12）
// 04c admin route のみが呼ぶ
```

## Step 4: auditLog（append-only）配置

### `apps/api/src/repository/auditLog.ts`

```ts
import type { DbCtx } from "./_shared/db";
import type { AdminEmail } from "./_shared/brand";

export interface AuditLogEntry {
  id: string;
  actor: AdminEmail;
  action: string;
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
  occurredAt?: string;
}

interface RawAuditRow {
  id: string;
  actor: AdminEmail;
  action: string;
  targetType: AuditLogEntry["targetType"];
  targetId: string | null;
  metadata: string;        // JSON
  occurredAt: string;
}

const parseMetadata = (r: RawAuditRow): AuditLogEntry => ({
  ...r,
  metadata: r.metadata ? JSON.parse(r.metadata) : {},
});

export const append = async (c: DbCtx, e: NewAuditLogEntry): Promise<AuditLogEntry> => {
  const id = crypto.randomUUID();
  const occurredAt = e.occurredAt ?? new Date().toISOString();
  await c.db.prepare(
    "INSERT INTO audit_log (id, actor, action, target_type, target_id, metadata, occurred_at) VALUES (?1,?2,?3,?4,?5,?6,?7)"
  ).bind(id, e.actor, e.action, e.targetType, e.targetId, JSON.stringify(e.metadata), occurredAt).run();
  return { id, occurredAt, actor: e.actor, action: e.action, targetType: e.targetType, targetId: e.targetId, metadata: e.metadata };
};

export const listRecent = async (c: DbCtx, limit: number): Promise<AuditLogEntry[]> => {
  const r = await c.db.prepare(
    "SELECT id, actor, action, target_type AS targetType, target_id AS targetId, metadata, occurred_at AS occurredAt FROM audit_log ORDER BY occurred_at DESC LIMIT ?1"
  ).bind(limit).all<RawAuditRow>();
  return r.results.map(parseMetadata);
};

export const listByActor = async (c: DbCtx, actor: AdminEmail, limit: number): Promise<AuditLogEntry[]> => {
  const r = await c.db.prepare(
    "SELECT id, actor, action, target_type AS targetType, target_id AS targetId, metadata, occurred_at AS occurredAt FROM audit_log WHERE actor = ?1 ORDER BY occurred_at DESC LIMIT ?2"
  ).bind(actor, limit).all<RawAuditRow>();
  return r.results.map(parseMetadata);
};

export const listByTarget = async (c: DbCtx, targetType: AuditLogEntry["targetType"], targetId: string, limit: number): Promise<AuditLogEntry[]> => {
  const r = await c.db.prepare(
    "SELECT id, actor, action, target_type AS targetType, target_id AS targetId, metadata, occurred_at AS occurredAt FROM audit_log WHERE target_type = ?1 AND target_id = ?2 ORDER BY occurred_at DESC LIMIT ?3"
  ).bind(targetType, targetId, limit).all<RawAuditRow>();
  return r.results.map(parseMetadata);
};

// UPDATE / DELETE API は提供しない（append-only を構造で守る）
```

## Step 5: syncJobs（状態遷移）配置

### `apps/api/src/repository/syncJobs.ts`

```ts
import type { DbCtx } from "./_shared/db";

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

const loadJob = async (c: DbCtx, id: string): Promise<SyncJobRow> => {
  const r = await c.db.prepare(
    "SELECT id, kind, status, started_at AS startedAt, finished_at AS finishedAt, result, error_message AS errorMessage FROM sync_jobs WHERE id = ?1"
  ).bind(id).first<SyncJobRow & { result: string | null }>();
  if (!r) throw new Error(`sync_job ${id} not found`);
  return { ...r, result: r.result ? JSON.parse(r.result as unknown as string) : null };
};

const assertTransition = async (c: DbCtx, id: string, to: SyncJobStatus) => {
  const current = (await c.db.prepare("SELECT status FROM sync_jobs WHERE id = ?1").bind(id).first<{ status: SyncJobStatus }>())?.status;
  if (!current) throw new Error(`sync_job ${id} not found`);
  if (!ALLOWED_TRANSITIONS[current].includes(to)) throw new IllegalStateTransition(current, to);
};

export const start = async (c: DbCtx, kind: SyncJobKind): Promise<SyncJobRow> => {
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await c.db.prepare(
    "INSERT INTO sync_jobs (id, kind, status, started_at) VALUES (?1, ?2, 'running', ?3)"
  ).bind(id, kind, startedAt).run();
  return { id, kind, status: "running", startedAt, finishedAt: null, result: null, errorMessage: null };
};

export const succeed = async (c: DbCtx, id: string, result: Record<string, unknown>): Promise<SyncJobRow> => {
  await assertTransition(c, id, "succeeded");
  const finishedAt = new Date().toISOString();
  await c.db.prepare(
    "UPDATE sync_jobs SET status='succeeded', finished_at=?1, result=?2 WHERE id=?3"
  ).bind(finishedAt, JSON.stringify(result), id).run();
  return loadJob(c, id);
};

export const fail = async (c: DbCtx, id: string, msg: string): Promise<SyncJobRow> => {
  await assertTransition(c, id, "failed");
  const finishedAt = new Date().toISOString();
  await c.db.prepare(
    "UPDATE sync_jobs SET status='failed', finished_at=?1, error_message=?2 WHERE id=?3"
  ).bind(finishedAt, msg, id).run();
  return loadJob(c, id);
};

export const findLatest = async (c: DbCtx, kind: SyncJobKind): Promise<SyncJobRow | null> => {
  const r = await c.db.prepare(
    "SELECT id, kind, status, started_at AS startedAt, finished_at AS finishedAt, result, error_message AS errorMessage FROM sync_jobs WHERE kind = ?1 ORDER BY started_at DESC LIMIT 1"
  ).bind(kind).first<SyncJobRow & { result: string | null }>();
  if (!r) return null;
  return { ...r, result: r.result ? JSON.parse(r.result as unknown as string) : null };
};

export const listRecent = async (c: DbCtx, limit: number): Promise<SyncJobRow[]> => {
  const r = await c.db.prepare(
    "SELECT id, kind, status, started_at AS startedAt, finished_at AS finishedAt, result, error_message AS errorMessage FROM sync_jobs ORDER BY started_at DESC LIMIT ?1"
  ).bind(limit).all<SyncJobRow & { result: string | null }>();
  return r.results.map(row => ({ ...row, result: row.result ? JSON.parse(row.result as unknown as string) : null }));
};
```

## Step 6: magicTokens（single-use）配置

### `apps/api/src/repository/magicTokens.ts`

```ts
import type { DbCtx } from "./_shared/db";
import { magicTokenValue, type MagicTokenValue } from "./_shared/brand";

export interface MagicTokenRow {
  token: MagicTokenValue;
  email: string;
  purpose: "login" | "admin_login";
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface IssueMagicTokenInput {
  email: string;
  purpose: "login" | "admin_login";
  ttlSec: number;
}

export type ConsumeResult =
  | { ok: true; row: MagicTokenRow }
  | { ok: false; reason: "expired" | "already_used" | "not_found" };

const generateRandom = (n: number): string => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
};

export const issue = async (c: DbCtx, input: IssueMagicTokenInput): Promise<MagicTokenRow> => {
  const token = magicTokenValue(generateRandom(32));
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + input.ttlSec * 1000).toISOString();
  await c.db.prepare(
    "INSERT INTO magic_tokens (token, email, purpose, expires_at, used_at, created_at) VALUES (?1,?2,?3,?4,NULL,?5)"
  ).bind(token, input.email, input.purpose, expiresAt, createdAt).run();
  return { token, email: input.email, purpose: input.purpose, expiresAt, usedAt: null, createdAt };
};

export const verify = async (c: DbCtx, t: MagicTokenValue): Promise<MagicTokenRow | null> => {
  const row = await c.db.prepare(
    "SELECT token, email, purpose, expires_at AS expiresAt, used_at AS usedAt, created_at AS createdAt FROM magic_tokens WHERE token = ?1 LIMIT 1"
  ).bind(t).first<MagicTokenRow>();
  if (!row) return null;
  if (row.usedAt) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row;
};

export const consume = async (c: DbCtx, t: MagicTokenValue, at: string): Promise<ConsumeResult> => {
  const row = await c.db.prepare(
    "SELECT token, email, purpose, expires_at AS expiresAt, used_at AS usedAt, created_at AS createdAt FROM magic_tokens WHERE token = ?1 LIMIT 1"
  ).bind(t).first<MagicTokenRow>();
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "already_used" };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { ok: false, reason: "expired" };
  // 楽観 lock: usedAt が NULL のものだけ UPDATE
  const r = await c.db.prepare(
    "UPDATE magic_tokens SET used_at = ?1 WHERE token = ?2 AND used_at IS NULL"
  ).bind(at, t).run();
  if (r.meta.changes === 0) return { ok: false, reason: "already_used" };
  return { ok: true, row: { ...row, usedAt: at } };
};
```

## Step 7: `__tests__/_setup.ts`（02a/02b/02c 共通）

### `apps/api/src/repository/__tests__/_setup.ts`

```ts
import type { D1Database } from "@cloudflare/workers-types";
import { ctx, type DbCtx } from "../_shared/db";

export interface InMemoryD1 {
  ctx: DbCtx;
  loadFixtures: (paths: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

// 実装は miniflare の D1 simulator もしくは wrangler.unstable_dev を利用
declare const createInMemoryD1: () => Promise<D1Database>;
declare const loadAllMigrations: () => string;
declare const applyFixture: (db: D1Database, p: string) => Promise<void>;
declare const truncateAllTables: (db: D1Database) => Promise<void>;

export const setupD1 = async (): Promise<InMemoryD1> => {
  const db = await createInMemoryD1();
  await db.exec(loadAllMigrations());        // 01a の全 migration を流す
  return {
    ctx: ctx({ DB: db }),
    loadFixtures: async (paths) => {
      for (const p of paths) await applyFixture(db, p);
    },
    reset: async () => { await truncateAllTables(db); },
  };
};
```

## Step 8: dependency-cruiser config 配置（リポジトリ root）

### `.dependency-cruiser.cjs`（02c が正本管理）

```js
// .dependency-cruiser.cjs
// 02c が正本管理。02a / 02b は本ファイルを編集する PR を 02c に向ける
module.exports = {
  forbidden: [
    {
      name: "no-web-to-d1-repository",
      severity: "error",
      comment: "apps/web から repository への直接 import を禁止（不変条件 #5）",
      from: { path: "^apps/web/" },
      to: { path: "^apps/api/src/repository/" },
    },
    {
      name: "no-web-to-d1-binding",
      severity: "error",
      comment: "apps/web から D1Database 型 import を禁止（不変条件 #5）",
      from: { path: "^apps/web/" },
      to: { path: "(^|/)D1Database(/|$)" },
    },
    {
      name: "repo-no-cross-domain-2a-to-2b",
      severity: "error",
      comment: "02a domain → 02b domain の直接 import を禁止（AC-11）",
      from: { path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$" },
    },
    {
      name: "repo-no-cross-domain-2b-to-2c",
      severity: "error",
      comment: "02b domain → 02c domain の直接 import を禁止（AC-11）",
      from: { path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$" },
    },
    {
      name: "repo-no-cross-domain-2c-to-2a",
      severity: "error",
      comment: "02c domain → 02a domain の直接 import を禁止（不変条件 #12 / AC-11）",
      from: { path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$" },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(__tests__|__fixtures__|_shared)" },
  },
};
```

## Step 9: ESLint 設定（apps/web）

### `apps/web/eslint.config.js`（更新）

```js
// apps/web/eslint.config.js（既存 config に追記）
export default [
  // ... 既存 rules ...
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/apps/api/src/repository/**", "@apps/api/src/repository/**"],
            message: "apps/web は repository を直接 import できません（不変条件 #5）。apps/api の API endpoint 経由で取得してください。",
          },
        ],
        paths: [
          {
            name: "@cloudflare/workers-types",
            importNames: ["D1Database"],
            message: "D1Database を apps/web で扱わないでください（不変条件 #5）。",
          },
        ],
      }],
    },
  },
];
```

## Step 10: sanity check

```bash
mise exec -- pnpm --filter apps/api typecheck
mise exec -- pnpm --filter apps/api test repository
mise exec -- pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web
mise exec -- pnpm --filter apps/web lint  # ESLint で apps/web の D1 import を検出
mise exec -- pnpm --filter apps/api build && du -sh apps/api/dist/
```

期待:
- typecheck: 0 error
- repository test: 全 pass
- depcruise: 0 violation
- web lint: 0 error（意図的 violation snippet で error が出ること別途確認）
- bundle size: < 1MB

## fixture（dev only）

### `apps/api/src/repository/__fixtures__/admin.fixture.ts`

```ts
// dev only — このファイルは prod build から exclude される（不変条件 #6）
// GAS prototype data.jsx 相当の最小 fixture seeder
import { adminEmail, memberId } from "../_shared/brand";
import type { AdminUserRow } from "../adminUsers";
import type { AdminMemberNoteRow } from "../adminNotes";
import type { AuditLogEntry } from "../auditLog";

export const fixtureAdminUsers: AdminUserRow[] = [
  { email: adminEmail("owner@example.com"), role: "owner", createdAt: "2026-04-01T00:00:00Z", lastSeenAt: null },
];

export const fixtureAdminNotes: AdminMemberNoteRow[] = [
  { noteId: "note_001", memberId: memberId("m_001"), body: "初回コンタクト OK", createdBy: adminEmail("owner@example.com"), createdAt: "2026-04-10T00:00:00Z", updatedAt: "2026-04-10T00:00:00Z" },
  { noteId: "note_002", memberId: memberId("m_002"), body: "要フォロー",        createdBy: adminEmail("owner@example.com"), createdAt: "2026-04-11T00:00:00Z", updatedAt: "2026-04-11T00:00:00Z" },
];

export const fixtureAuditLog: AuditLogEntry[] = [
  { id: "audit_001", actor: adminEmail("owner@example.com"), action: "member.publish_state_changed", targetType: "member", targetId: "m_001", metadata: { from: "hidden", to: "public" }, occurredAt: "2026-04-10T00:00:00Z" },
  { id: "audit_002", actor: adminEmail("owner@example.com"), action: "tag.queue.resolved",            targetType: "tag_queue", targetId: "tq_001", metadata: { resolution: "approved" }, occurredAt: "2026-04-11T00:00:00Z" },
  { id: "audit_003", actor: adminEmail("owner@example.com"), action: "member.note.created",           targetType: "member", targetId: "m_001", metadata: { noteId: "note_001" }, occurredAt: "2026-04-10T00:00:00Z" },
  { id: "audit_004", actor: adminEmail("owner@example.com"), action: "schema.diff.alias_assigned",    targetType: "schema_diff", targetId: "sd_001", metadata: { aliasFor: "q_007" }, occurredAt: "2026-04-12T00:00:00Z" },
  { id: "audit_005", actor: adminEmail("owner@example.com"), action: "member.deleted",                targetType: "member", targetId: "m_999", metadata: {}, occurredAt: "2026-04-12T00:00:00Z" },
];
```

## まとめ

この runbook は Phase 6 以降の実装エージェントが Step 0〜10 を **順序通り** に実行することで、

- 5 repository ファイル
- `_shared/{brand,db}.ts`
- `__tests__/_setup.ts`
- `__fixtures__/admin.fixture.ts`
- `.dependency-cruiser.cjs`
- `apps/web/eslint.config.js` 更新

を完成させ、AC-1〜AC-11 すべてを満たすことができる。
