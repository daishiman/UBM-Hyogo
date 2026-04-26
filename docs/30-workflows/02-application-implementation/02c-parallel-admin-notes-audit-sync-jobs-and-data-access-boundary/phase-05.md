# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-notes-audit-sync-jobs-and-data-access-boundary |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| Wave | 2 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 上流 | Phase 4 (テスト戦略) |
| 下流 | Phase 6 (異常系検証) |
| 状態 | pending |

## 目的

実装エージェントが **コードを書かずに本仕様書だけで作業着手できる** 状態を作る。順序付き runbook + コード placeholder + sanity check で構成する。boundary tooling（dep-cruiser config / ESLint config）の placeholder も含める。

## runbook（順序付き）

### Step 0: 前提確認
```bash
test -f apps/api/db/migrations/0001_init.sql || exit 1   # 01a
test -f packages/shared/src/view-models/admin.ts || exit 1 # 01b（adminNote 型）

# 02a / 02b の Phase 1-2 が完了し、`_shared/` の正本が 02c という合意が取れていることを確認
```

### Step 1: ディレクトリ作成 / 既存併合
```bash
# `_shared/` は 02a/02b と共通、02c が「正本」として完成
mkdir -p apps/api/src/repository/_shared
mkdir -p apps/api/src/repository/__fixtures__
mkdir -p apps/api/src/repository/__tests__
```

### Step 2: branded type / db ctx 配置（02a/02b 共通）

```ts
// apps/api/src/repository/_shared/brand.ts （正本）
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

// apps/api/src/repository/_shared/db.ts （正本）
import type { D1Database } from "@cloudflare/workers-types";
export interface DbCtx { readonly db: D1Database; }
export const ctx = (env: { DB: D1Database }): DbCtx => ({ db: env.DB });
```

### Step 3: adminUsers / adminNotes 配置

```ts
// apps/api/src/repository/adminUsers.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { AdminEmail } from "./_shared/brand.ts";

export type AdminRole = "owner" | "manager" | "viewer";
export interface AdminUserRow {
  email: AdminEmail; role: AdminRole; createdAt: string; lastSeenAt: string | null;
}

export const findByEmail = async (c: DbCtx, e: AdminEmail): Promise<AdminUserRow | null> => {
  return await c.db.prepare("SELECT email, role, created_at AS createdAt, last_seen_at AS lastSeenAt FROM admin_users WHERE email = ?1 LIMIT 1")
    .bind(e).first<AdminUserRow>();
};

export const listAll = async (c: DbCtx): Promise<AdminUserRow[]> => {
  const r = await c.db.prepare("SELECT email, role, created_at AS createdAt, last_seen_at AS lastSeenAt FROM admin_users ORDER BY created_at ASC").all<AdminUserRow>();
  return r.results;
};

export const touchLastSeen = async (c: DbCtx, e: AdminEmail, at: string): Promise<void> => {
  await c.db.prepare("UPDATE admin_users SET last_seen_at = ?1 WHERE email = ?2").bind(at, e).run();
};
```

```ts
// apps/api/src/repository/adminNotes.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { MemberId, AdminEmail } from "./_shared/brand.ts";

export interface AdminMemberNoteRow {
  noteId: string; memberId: MemberId; body: string;
  createdBy: AdminEmail; createdAt: string; updatedAt: string;
}

export const listByMemberId = async (c: DbCtx, mid: MemberId): Promise<AdminMemberNoteRow[]> => {
  const r = await c.db.prepare("SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM admin_member_notes WHERE member_id = ?1 ORDER BY created_at DESC")
    .bind(mid).all<AdminMemberNoteRow>();
  return r.results;
};

export const create = async (c: DbCtx, input: { memberId: MemberId; body: string; createdBy: AdminEmail }): Promise<AdminMemberNoteRow> => {
  const noteId = crypto.randomUUID();
  const now = new Date().toISOString();
  await c.db.prepare("INSERT INTO admin_member_notes (note_id, member_id, body, created_by, updated_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?5)")
    .bind(noteId, input.memberId, input.body, input.createdBy, now).run();
  return { noteId, memberId: input.memberId, body: input.body, createdBy: input.createdBy, createdAt: now, updatedAt: now };
};

export const update = async (c: DbCtx, noteId: string, body: string, by: AdminEmail): Promise<AdminMemberNoteRow> => {
  const now = new Date().toISOString();
  await c.db.prepare("UPDATE admin_member_notes SET body = ?1, updated_at = ?2, updated_by = ?3 WHERE note_id = ?4").bind(body, now, by, noteId).run();
  // 更新後の row を取得して返す
  return (await c.db.prepare("SELECT note_id AS noteId, member_id AS memberId, body, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt FROM admin_member_notes WHERE note_id = ?1").bind(noteId).first<AdminMemberNoteRow>())!;
};

export const remove = async (c: DbCtx, noteId: string, _by: AdminEmail): Promise<void> => {
  await c.db.prepare("DELETE FROM admin_member_notes WHERE note_id = ?1").bind(noteId).run();
};
// 重要: builder 経路（02a の _shared/builder.ts）には絶対に呼ばれない
// 04c admin route のみが呼ぶ
```

### Step 4: auditLog（append-only）配置

```ts
// apps/api/src/repository/auditLog.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { AdminEmail } from "./_shared/brand.ts";

export interface AuditLogEntry {
  id: string; actor: AdminEmail; action: string;
  targetType: "member" | "tag_queue" | "schema_diff" | "meeting" | "system";
  targetId: string | null; metadata: Record<string, unknown>; occurredAt: string;
}

export const append = async (c: DbCtx, e: Omit<AuditLogEntry, "id" | "occurredAt"> & { occurredAt?: string }): Promise<AuditLogEntry> => {
  const id = crypto.randomUUID();
  const occurredAt = e.occurredAt ?? new Date().toISOString();
  await c.db.prepare("INSERT INTO audit_log (id, actor, action, target_type, target_id, metadata, occurred_at) VALUES (?1,?2,?3,?4,?5,?6,?7)")
    .bind(id, e.actor, e.action, e.targetType, e.targetId, JSON.stringify(e.metadata), occurredAt).run();
  return { id, occurredAt, ...e };
};

export const listRecent = async (c: DbCtx, limit: number): Promise<AuditLogEntry[]> => {
  const r = await c.db.prepare("SELECT id, actor, action, target_type AS targetType, target_id AS targetId, metadata, occurred_at AS occurredAt FROM audit_log ORDER BY occurred_at DESC LIMIT ?1").bind(limit).all<RawAuditRow>();
  return r.results.map(parseMetadata);
};

export const listByActor = async (c: DbCtx, actor: AdminEmail, limit: number): Promise<AuditLogEntry[]> => { /* 同上 + WHERE actor */ };
export const listByTarget = async (c: DbCtx, t: string, id: string, limit: number): Promise<AuditLogEntry[]> => { /* 同上 + WHERE target_type AND target_id */ };

// UPDATE / DELETE API は提供しない（append-only を構造で守る）
```

### Step 5: syncJobs（状態遷移）配置

```ts
// apps/api/src/repository/syncJobs.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";

export type SyncJobKind = "forms_schema" | "forms_response";
export type SyncJobStatus = "running" | "succeeded" | "failed";

const ALLOWED_TRANSITIONS: Record<SyncJobStatus, SyncJobStatus[]> = {
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
};

export class IllegalStateTransition extends Error {
  constructor(from: SyncJobStatus, to: SyncJobStatus) {
    super(`sync_jobs: ${from} -> ${to} is not allowed`);
  }
}

export const start = async (c: DbCtx, kind: SyncJobKind): Promise<SyncJobRow> => {
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  await c.db.prepare("INSERT INTO sync_jobs (id, kind, status, started_at) VALUES (?1, ?2, 'running', ?3)").bind(id, kind, startedAt).run();
  return { id, kind, status: "running", startedAt, finishedAt: null, result: null, errorMessage: null };
};

export const succeed = async (c: DbCtx, id: string, result: Record<string, unknown>): Promise<SyncJobRow> => {
  await assertTransition(c, id, "succeeded");
  const finishedAt = new Date().toISOString();
  await c.db.prepare("UPDATE sync_jobs SET status='succeeded', finished_at=?1, result=?2 WHERE id=?3").bind(finishedAt, JSON.stringify(result), id).run();
  return loadJob(c, id);
};

export const fail = async (c: DbCtx, id: string, msg: string): Promise<SyncJobRow> => {
  await assertTransition(c, id, "failed");
  const finishedAt = new Date().toISOString();
  await c.db.prepare("UPDATE sync_jobs SET status='failed', finished_at=?1, error_message=?2 WHERE id=?3").bind(finishedAt, msg, id).run();
  return loadJob(c, id);
};

const assertTransition = async (c: DbCtx, id: string, to: SyncJobStatus) => {
  const current = (await c.db.prepare("SELECT status FROM sync_jobs WHERE id=?1").bind(id).first<{ status: SyncJobStatus }>())?.status;
  if (!current) throw new Error(`sync_job ${id} not found`);
  if (!ALLOWED_TRANSITIONS[current].includes(to)) throw new IllegalStateTransition(current, to);
};
```

### Step 6: magicTokens（single-use）配置

```ts
// apps/api/src/repository/magicTokens.ts （placeholder）
import type { DbCtx } from "./_shared/db.ts";
import type { MagicTokenValue } from "./_shared/brand.ts";

export interface MagicTokenRow {
  token: MagicTokenValue; email: string; purpose: "login" | "admin_login";
  expiresAt: string; usedAt: string | null; createdAt: string;
}

export const issue = async (c: DbCtx, input: { email: string; purpose: "login" | "admin_login"; ttlSec: number }): Promise<MagicTokenRow> => {
  const token = magicTokenValue(generateRandom(32));
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + input.ttlSec * 1000).toISOString();
  await c.db.prepare("INSERT INTO magic_tokens (token, email, purpose, expires_at, used_at, created_at) VALUES (?1,?2,?3,?4,NULL,?5)")
    .bind(token, input.email, input.purpose, expiresAt, createdAt).run();
  return { token, email: input.email, purpose: input.purpose, expiresAt, usedAt: null, createdAt };
};

export const verify = async (c: DbCtx, t: MagicTokenValue): Promise<MagicTokenRow | null> => {
  const row = await c.db.prepare("SELECT token, email, purpose, expires_at AS expiresAt, used_at AS usedAt, created_at AS createdAt FROM magic_tokens WHERE token = ?1 LIMIT 1").bind(t).first<MagicTokenRow>();
  if (!row) return null;
  if (row.usedAt) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row;
};

export const consume = async (c: DbCtx, t: MagicTokenValue, at: string): Promise<{ ok: true; row: MagicTokenRow } | { ok: false; reason: "expired" | "already_used" | "not_found" }> => {
  const row = await c.db.prepare("SELECT token, email, purpose, expires_at AS expiresAt, used_at AS usedAt, created_at AS createdAt FROM magic_tokens WHERE token = ?1 LIMIT 1").bind(t).first<MagicTokenRow>();
  if (!row) return { ok: false, reason: "not_found" };
  if (row.usedAt) return { ok: false, reason: "already_used" };
  if (new Date(row.expiresAt).getTime() < Date.now()) return { ok: false, reason: "expired" };
  // 楽観 lock 風: usedAt が NULL のものだけ UPDATE
  const r = await c.db.prepare("UPDATE magic_tokens SET used_at = ?1 WHERE token = ?2 AND used_at IS NULL").bind(at, t).run();
  if (r.meta.changes === 0) return { ok: false, reason: "already_used" };
  return { ok: true, row: { ...row, usedAt: at } };
};
```

### Step 7: __tests__/_setup.ts（02a/02b/02c 共通）

```ts
// apps/api/src/repository/__tests__/_setup.ts
import { ctx } from "../_shared/db.ts";

export interface InMemoryD1 {
  ctx: ReturnType<typeof ctx>;
  loadFixtures: (paths: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

export const setupD1 = async (): Promise<InMemoryD1> => {
  const db = await createInMemoryD1(); // miniflare or wrangler.unstable_dev
  await db.exec(loadAllMigrations()); // 01a の全 migration
  return {
    ctx: ctx({ DB: db }),
    loadFixtures: async (paths) => { for (const p of paths) await applyFixture(db, p); },
    reset: async () => { await truncateAllTables(db); },
  };
};
```

### Step 8: dependency-cruiser config 配置

```js
// .dependency-cruiser.cjs（02c が正本管理）
module.exports = {
  forbidden: [
    {
      name: "no-web-to-d1-repository",
      severity: "error",
      from: { path: "^apps/web/" },
      to: { path: "^apps/api/src/repository/" },
    },
    {
      name: "no-web-to-d1-binding",
      severity: "error",
      from: { path: "^apps/web/" },
      to: { path: "(^|/)D1Database(/|$)" },
    },
    {
      name: "repo-no-cross-domain-2a-to-2b",
      severity: "error",
      from: { path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$" },
    },
    {
      name: "repo-no-cross-domain-2b-to-2c",
      severity: "error",
      from: { path: "^apps/api/src/repository/(meetings|attendance|tagDefinitions|tagQueue|schemaVersions|schemaQuestions|schemaDiffQueue)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$" },
    },
    {
      name: "repo-no-cross-domain-2c-to-2a",
      severity: "error",
      from: { path: "^apps/api/src/repository/(adminUsers|adminNotes|auditLog|syncJobs|magicTokens)\\.ts$" },
      to:   { path: "^apps/api/src/repository/(members|identities|status|responses|responseSections|responseFields|fieldVisibility|memberTags)\\.ts$" },
    },
  ],
  options: { tsConfig: { fileName: "tsconfig.json" } },
};
```

### Step 9: ESLint 設定（apps/web）

```js
// apps/web/eslint.config.js
export default [
  {
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["**/apps/api/src/repository/**", "@apps/api/src/repository/**"], message: "apps/web は repository を直接 import できません（不変条件 #5）。apps/api の API endpoint 経由で取得してください。" },
        ],
        paths: [
          { name: "@cloudflare/workers-types", importNames: ["D1Database"], message: "D1Database を apps/web で扱わないでください（不変条件 #5）。" },
        ],
      }],
    },
  },
];
```

### Step 10: sanity check
```bash
pnpm --filter apps/api typecheck
pnpm --filter apps/api test repository
pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web
pnpm --filter apps/web lint  # ESLint で apps/web の D1 import を検出
```

## sanity check 一覧

| # | 確認項目 | コマンド | 期待 |
| --- | --- | --- | --- |
| 1 | TS コンパイル | `pnpm --filter apps/api typecheck` | 0 error |
| 2 | repository unit | `pnpm --filter apps/api test repository` | 全 pass |
| 3 | dep-cruiser | `pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web` | 0 violation |
| 4 | ESLint (web) | `pnpm --filter apps/web lint` | 0 error（意図的 violation snippet で error 確認） |
| 5 | bundle size | `pnpm --filter apps/api build && du -sh dist/` | < 1MB |

## 実行タスク

1. runbook を `outputs/phase-05/runbook.md` に転記
2. 各 placeholder を `outputs/phase-05/main.md` の章として整理
3. dep-cruiser config と ESLint config を runbook.md に貼る
4. sanity check 表を main.md に貼る

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | Phase 4 outputs/phase-04/verify-suite.md | 実装到達目標 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | OTP / Magic Link |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | DDL / index |
| 必須 | doc/02-application-implementation/01a-... / 01b-... | 上流成果物 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook を異常系で叩く |
| Phase 7 | 実装 step を AC 検証に紐付け |
| Phase 8 | placeholder を DRY 化候補として抽出 |
| 03a/b / 04c / 05a/b / 07c / 08a | runbook の interface を再利用 |
| 02a / 02b | _shared / _setup を import |

## 多角的チェック観点

| 観点 | 不変条件 # | 確認内容 |
| --- | --- | --- |
| D1 boundary | #5 | dep-cruiser + ESLint config 配置 |
| GAS 昇格防止 | #6 | seed が dev only と明記 |
| admin 本文編集禁止 | #11 | adminNotes / auditLog ともに member_responses に触れない |
| view 分離 | #12 | adminNotes は 02a builder の引数受取設計と整合 |
| append-only | — | auditLog に UPDATE/DELETE 不在 |
| single-use | — | magicTokens.consume が usedAt set + 楽観 lock |
| 状態遷移 | — | syncJobs ALLOWED_TRANSITIONS |
| 無料枠 | #10 | bundle size < 1MB |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 転記 | 5 | pending | 10 ステップ |
| 2 | placeholder 整理 | 5 | pending | 5 repo + brand + db + setup |
| 3 | dep-cruiser config | 5 | pending | 4 rule |
| 4 | ESLint config | 5 | pending | 2 rule |
| 5 | sanity check 表 | 5 | pending | 5 項目 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | placeholder + sanity check |
| ドキュメント | outputs/phase-05/runbook.md | 10 step runbook |

## 完了条件

- [ ] 10 step runbook が完成
- [ ] placeholder が 5 repo + brand + db + setup 分書かれている
- [ ] dep-cruiser config 4 rule、ESLint config 2 rule
- [ ] sanity check 5 項目

## タスク100%実行確認【必須】

- [ ] サブタスク 1〜5 が completed
- [ ] outputs/phase-05/{main,runbook}.md が配置済み
- [ ] runbook が Step 0〜10 まで連続して読める
- [ ] artifacts.json の Phase 5 を completed に更新

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ事項: 10 step runbook / placeholder / boundary tooling config
- ブロック条件: placeholder が 5 repo 分そろわない、または dep-cruiser config が rule 不足の場合は Phase 6 に進めない
