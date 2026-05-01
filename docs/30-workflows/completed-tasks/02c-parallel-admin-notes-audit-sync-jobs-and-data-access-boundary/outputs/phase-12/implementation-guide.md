# 02c implementation-guide

> **対象読者**: 03a / 03b / 04c / 05a / 05b / 07c / 08a の実装者および本 repository 層の保守者
>
> **目的**: 02c で実装された D1 repository 層と boundary tooling を **コードを開かずに呼べる** ようにする一次資料。

---

## Part 1 — 初学者向け説明

### なぜ必要か

会員情報を扱う画面や同期処理では、管理者だけが見てよいメモ、誰が何をしたかの記録、同期が成功したか失敗したかの記録を混ぜずに扱う必要がある。これを決めずに各画面が直接データ置き場を触ると、会員本人に見せてはいけない管理メモが混ざったり、失敗した同期を成功扱いにしたり、後から原因を追えなくなる。

たとえば学校の職員室にある名簿、先生だけのメモ、出欠簿を考える。生徒に渡す名簿には先生だけのメモを入れない。出欠簿は一度書いた記録を勝手に消さない。02c は、この分け方をコード上の入口として固定する役割を持つ。

### 何をしたか

管理者向けの5つの入口を作った。管理者の確認、管理メモ、作業記録、同期処理の状態、ログイン用の一回きりの合言葉を、それぞれ別の担当に分けている。

### 今回作ったもの

| 作ったもの | 日常の例え | 役割 |
| --- | --- | --- |
| `adminUsers` | 職員名簿 | 管理者かどうかを確認する |
| `adminNotes` | 先生だけのメモ帳 | 会員本人に見せない管理メモを扱う |
| `auditLog` | 消せない作業記録ノート | 誰が何をしたかを追えるようにする |
| `syncJobs` | 作業中・完了・失敗の札 | Google Forms 同期の状態を一方向で管理する |
| `magicTokens` | 一回だけ使える入場券 | Magic Link を再利用できないようにする |
| boundary tooling | 職員室への入口チェック | Web 画面からデータ置き場を直接触らせない |

このタスクは画面を作っていないため、スクリーンショットは不要。Phase 11 では unit test、typecheck、lint、boundary lint の実行結果を証跡にしている。

## Part 2 — 開発者向け技術詳細

### 前提

| 項目 | 値 |
| --- | --- |
| 実装場所 | `apps/api/src/repository/` |
| アクセス可能側 | `apps/api/**`（hono router / cron handler） のみ |
| アクセス不可側 | `apps/web/**`（Next.js）— ESLint / boundary lint で阻止 |
| D1 binding | Worker env の `DB: D1Database`、`apps/api/src/env.ts` の `Env` を正本とし、`_shared/db.ts` の `ctx(env: Pick<Env, "DB">)` で `DbCtx` に wrap |
| 共有モジュール正本 | `apps/api/src/repository/_shared/` （02a / 02b はここから import） |
| テスト loader 正本 | `apps/api/src/repository/__tests__/_setup.ts` （02a / 02b は同 file を共通利用） |

---

### APIシグネチャ

すべての関数は `(c: DbCtx, ...) => Promise<...>` で統一されている。

### 2.1 adminUsers（`adminUsers.ts`）

```ts
export type AdminRole = "owner" | "manager" | "viewer";
export interface AdminUserRow {
  adminId: AdminId; email: AdminEmail; displayName: string;
  active: boolean; createdAt: string;
}

findByEmail(c: DbCtx, email: AdminEmail): Promise<AdminUserRow | null>;
findById(c: DbCtx, adminId: AdminId): Promise<AdminUserRow | null>;
listAll(c: DbCtx): Promise<AdminUserRow[]>;
isActiveAdmin(c: DbCtx, email: AdminEmail): Promise<boolean>;
```

### 2.2 adminNotes（`adminNotes.ts`）

```ts
export interface AdminMemberNoteRow {
  noteId: string; memberId: MemberId; body: string;
  createdBy: AdminEmail; updatedBy: AdminEmail;
  createdAt: string; updatedAt: string;
}
export interface NewAdminMemberNote {
  memberId: MemberId; body: string; createdBy: AdminEmail;
}

findById(c: DbCtx, noteId: string): Promise<AdminMemberNoteRow | null>;
listByMemberId(c: DbCtx, memberId: MemberId): Promise<AdminMemberNoteRow[]>;
create(c: DbCtx, input: NewAdminMemberNote): Promise<AdminMemberNoteRow>;
update(c: DbCtx, noteId: string, body: string, updatedBy: AdminEmail): Promise<AdminMemberNoteRow | null>;
remove(c: DbCtx, noteId: string): Promise<boolean>;
```

### 2.3 auditLog（`auditLog.ts` — append-only）

```ts
export type AuditTargetType = "member" | "tag_queue" | "schema_diff" | "meeting" | "system";
export interface AuditLogEntry { /* auditId, actorId, actorEmail, action, targetType, targetId, before, after, createdAt */ }
export interface NewAuditLogEntry {
  actorId: AdminId | null; actorEmail: AdminEmail | null;
  action: AuditAction; targetType: AuditTargetType; targetId: string | null;
  before?: Record<string, unknown> | null; after?: Record<string, unknown> | null;
  createdAt?: string;
}

append(c: DbCtx, e: NewAuditLogEntry): Promise<AuditLogEntry>;
listRecent(c: DbCtx, limit: number): Promise<AuditLogEntry[]>;
listByActor(c: DbCtx, actorEmail: AdminEmail, limit: number): Promise<AuditLogEntry[]>;
listByTarget(c: DbCtx, targetType: AuditTargetType, targetId: string, limit: number): Promise<AuditLogEntry[]>;

// 故意に提供しない: update / delete / remove → 不変条件 AC-6 を型で強制
```

### 2.4 syncJobs（`syncJobs.ts` — lifecycle 一方向）

```ts
export type SyncJobKind = "schema_sync" | "response_sync";
export type SyncJobStatus = "running" | "succeeded" | "failed";
export const ALLOWED_TRANSITIONS = Object.freeze({
  running: ["succeeded","failed"], succeeded: [], failed: [],
});
export class IllegalStateTransition extends Error { /* from, to */ }
export class SyncJobNotFound extends Error { /* jobId */ }
export interface SyncJobRow { jobId; jobType; status; startedAt; finishedAt; metrics; error; }

start(c: DbCtx, jobType: SyncJobKind): Promise<SyncJobRow>;          // status: 'running'
succeed(c: DbCtx, jobId: string, metrics: Record<string, unknown>): Promise<SyncJobRow>;
fail(c: DbCtx, jobId: string, error: Record<string, unknown>): Promise<SyncJobRow>;
findLatest(c: DbCtx, jobType: SyncJobKind): Promise<SyncJobRow | null>;
listRecent(c: DbCtx, limit: number): Promise<SyncJobRow[]>;
```

### 2.5 magicTokens（`magicTokens.ts` — single-use）

```ts
export interface MagicTokenRow { token: MagicTokenValue; memberId; email; responseId; createdAt; expiresAt; used: boolean; }
export interface IssueMagicTokenInput { memberId; email; responseId; ttlSec: number; now?: Date; }
export type ConsumeResult =
  | { ok: true; row: MagicTokenRow }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

issue(c: DbCtx, input: IssueMagicTokenInput): Promise<MagicTokenRow>;
findByToken(c: DbCtx, token: MagicTokenValue): Promise<MagicTokenRow | null>;
verify(c: DbCtx, token: MagicTokenValue, now?: Date): Promise<MagicTokenRow | null>;
consume(c: DbCtx, token: MagicTokenValue, now?: Date): Promise<ConsumeResult>;
```

---

## 3. `_shared/` の使い方

### 3.1 `_shared/db.ts`

```ts
import type { Env } from "@/env";
import { ctx } from "@/repository/_shared/db";

// hono handler 内で
const app = new Hono<{ Bindings: Env }>();
app.get("/admin/users", async (c) => {
  const db = ctx(c.env);                       // env.DB: D1Database を DbCtx に wrap
  const users = await adminUsers.listAll(db);
  return c.json(users);
});
```

`Env` は `apps/api/src/env.ts` が正本で、`apps/api/wrangler.toml` の binding / vars / secrets と同 PR で同期する。`DbCtx = { db: D1Db }`。**直接 `c.env.DB` を repository に渡してはならない**（型不一致）。

### 3.2 `_shared/brand.ts`

`MemberId` / `ResponseId` / `StableKey`（02a 共有）に加え、02c が追加した branded 型:

| 型 | wrap 関数 | 用途 |
| --- | --- | --- |
| `AdminEmail` | `adminEmail(s)` | admin_users.email / audit_log.actor_email / adminNotes.created_by |
| `MagicTokenValue` | `magicTokenValue(s)` | magic_tokens.token |
| `AuditAction` | `auditAction(s)` | audit_log.action（"member.update" 等の文字列を型で識別） |

```ts
import { adminEmail, auditAction } from "@/repository/_shared/brand";

await adminUsers.findByEmail(db, adminEmail(session.email));
await auditLog.append(db, {
  actorEmail: adminEmail(session.email),
  action: auditAction("member.note.create"),
  targetType: "member", targetId: memberId, /* ... */
});
```

**生 string を渡すと TS error**。これが AC-7 / 不変条件 #5 を型でも守る理由。

---

## 4. `__tests__/_setup.ts` fixture loader

02a / 02b / 02c の test は **すべて同じ loader を import** する（AC-9）。

```ts
import { setupD1, loadAdminFixture } from "@/repository/__tests__/_setup";

describe("...", () => {
  const db = await setupD1();      // miniflare in-memory D1 + 全 migration 適用
  beforeEach(async () => {
    await db.reset();              // 全テーブル truncate
    await loadAdminFixture(db);    // admin_users 1 / admin_member_notes 2 / audit_log 5
  });
});
```

利用可能 fixture（`__fixtures__/admin.fixture.ts`）:

- `admin_users`: `owner@example.com`（active）/ `inactive@example.com`（active=0）
- `admin_member_notes`: 2 件（同一 memberId）
- `audit_log`: 5 件（直近順）

> **dev fixture であり production seed ではない**（不変条件 #6）。`__fixtures__/` 配下は production import path に登場しない。

---

## 5. boundary 制約

### 5.1 apps/web から repository を import 禁止

| ガード | 場所 | 検出対象 |
| --- | --- | --- |
| `scripts/lint-boundaries.mjs` | `pnpm lint` の前段（root） | apps/web 配下に `D1Database` / `apps/api` / `@ubm-hyogo/api` / `@cloudflare/d1` / `localStorage` / `sessionStorage` 等の禁止トークン |
| `.dependency-cruiser.cjs` | (バイナリ導入は 09a) | `no-web-to-d1-repository` / `no-web-to-d1-binding` / `repo-no-cross-domain-2{a→b, b→c, c→a}` |

### 5.2 web から D1 を読みたい時の正解

- `apps/api` に hono endpoint を生やす（04b / 04c の責務）
- `apps/web` は **fetch 経由のみ**で API を呼ぶ（unstable_cache + tag invalidation 推奨）
- D1Database 型 / @cloudflare/workers-types を web に一切 import しない

### 5.3 02a / 02b との関係

- 02a / 02b は `_shared/db.ts` `_shared/brand.ts` `__tests__/_setup.ts` を **02c から import**（cross-domain rule で逆方向は禁止）
- 02c は 02a / 02b 配下のいかなる repository も import しない（AC-11）

---

## 6. 不変条件の遵守方法

| # | 遵守方法 | 関連 |
| --- | --- | --- |
| #5 | apps/web から D1 直接アクセスしない。boundary lint + dep-cruiser で阻止。fetch 経由のみ。 | AC-3 / AC-4 / AC-5 |
| #6 | `__fixtures__/admin.fixture.ts` は dev 用。production seed として扱わない。 | AC-10 |
| #11 | 管理者は member 本文を編集しない。`member_responses` は 02a 経由でも UPDATE しない。member への注記は `adminNotes` に書く。 | AC-2 |
| #12 | adminNotes を `PublicMemberProfile` / `MemberProfile` の builder の戻り値に **絶対** 含めない。view model の builder（02a `_shared/builder.ts`）は adminNotes を import すらしない。 | AC-2 |

---

### 使用例

#### 03a（forms_schema sync）/ 03b（response sync）

**目的**: cron / 手動 trigger で Google Forms を引いた時に sync_jobs を残す。

```ts
import * as syncJobs from "@/repository/syncJobs";
import * as auditLog from "@/repository/auditLog";
import { ctx } from "@/repository/_shared/db";
import { auditAction } from "@/repository/_shared/brand";

const db = ctx(env);
const job = await syncJobs.start(db, "schema_sync");   // または "response_sync"
try {
  // ... Google Forms 取得 + diff 適用 ...
  await syncJobs.succeed(db, job.jobId, { added: 3, updated: 1 });
  await auditLog.append(db, {
    actorId: null, actorEmail: null,
    action: auditAction("system.sync.schema.succeeded"),
    targetType: "system", targetId: null,
    after: { added: 3, updated: 1 },
  });
} catch (e) {
  await syncJobs.fail(db, job.jobId, { message: String(e) });
}
```

> 二度目の `succeed` / `fail` は `IllegalStateTransition` を throw する。

#### 04c（admin backoffice API）

**目的**: 全 admin 操作を `auditLog.append()` でアプリログに残す。

```ts
import * as adminUsers from "@/repository/adminUsers";
import * as adminNotes from "@/repository/adminNotes";
import * as auditLog from "@/repository/auditLog";
import { adminEmail, auditAction } from "@/repository/_shared/brand";

// 1. gate
const admin = await adminUsers.findByEmail(db, adminEmail(session.email));
if (!admin || !admin.active) return c.json({ error: "forbidden" }, 403);

// 2. 操作
const created = await adminNotes.create(db, { memberId, body, createdBy: admin.email });

// 3. audit（必須、忘れると admin 操作の透明性が崩れる）
await auditLog.append(db, {
  actorId: admin.adminId, actorEmail: admin.email,
  action: auditAction("admin.note.create"),
  targetType: "member", targetId: memberId,
  after: { noteId: created.noteId, body },
});
```

#### 05a（Auth.js Google OAuth + admin gate）

**目的**: Google session の email を admin gate に通す。

```ts
import * as adminUsers from "@/repository/adminUsers";
import { adminEmail } from "@/repository/_shared/brand";

callbacks: {
  signIn: async ({ user }) => {
    const db = ctx(env);
    const ok = await adminUsers.isActiveAdmin(db, adminEmail(user.email!));
    return ok;   // false なら auth.js が拒否
  },
}
```

#### 05b（Magic Link provider）

**目的**: TTL + single-use のセキュア Magic Link。

```ts
import * as magicTokens from "@/repository/magicTokens";
import { magicTokenValue } from "@/repository/_shared/brand";

// 発行（TTL 15min 推奨）
const t = await magicTokens.issue(db, { memberId, email, responseId, ttlSec: 900 });
// → URL: https://.../auth/magic?token=${t.token}

// 検証（消費はまだしない）
const row = await magicTokens.verify(db, magicTokenValue(req.query.token));
if (!row) return 401;

// セッション確立直前に consume（楽観 lock で並行リクエストを 1 回に絞る）
const r = await magicTokens.consume(db, magicTokenValue(req.query.token));
if (!r.ok) return r.reason === "already_used" ? 409 : 401;
```

> **never multi-use**: consume を呼ばずに verify だけで session 発行してはならない。

#### 07c（meeting attendance + admin audit workflow）

**目的**: workflow 完了 / メモを残す。

```ts
import * as auditLog from "@/repository/auditLog";
import * as adminNotes from "@/repository/adminNotes";

await adminNotes.create(db, { memberId, body: "出席（11月例会）", createdBy: admin.email });
await auditLog.append(db, {
  actorId: admin.adminId, actorEmail: admin.email,
  action: auditAction("admin.attendance.recorded"),
  targetType: "meeting", targetId: meetingId,
  after: { memberId, status: "present" },
});
```

#### 08a（repository contract test）

**目的**: 02c の repository の契約を別 test で再検証。`_setup.ts` を共通利用。

```ts
import { setupD1, loadAdminFixture } from "@/repository/__tests__/_setup";
import * as auditLog from "@/repository/auditLog";

it("AC-6: append-only 契約", async () => {
  const db = await setupD1();
  // @ts-expect-error: update / delete / remove は API として存在しない
  expect(typeof auditLog.update).toBe("undefined");
});
```

### エラーハンドリング

| 対象 | 失敗 | 呼び出し側の扱い |
| --- | --- | --- |
| `syncJobs.succeed/fail` | `SyncJobNotFound` | 404 相当または内部整合エラーとして記録 |
| `syncJobs.succeed/fail` | `IllegalStateTransition` | 二重完了・競合更新として 409 相当 |
| `magicTokens.consume` | `not_found` | 401 相当 |
| `magicTokens.consume` | `expired` | 401 相当、再発行導線へ誘導 |
| `magicTokens.consume` | `already_used` | 409 相当、再利用攻撃または二重送信として扱う |
| `adminUsers.findByEmail` | `null` | 403 相当 |
| `adminNotes.update/remove` | `null` / `false` | 404 相当 |

### エッジケース

| ケース | 防御 |
| --- | --- |
| `syncJobs` の並行 `succeed/fail` | `WHERE status = 'running'` 付き UPDATE と `changes` 確認で終端状態の上書きを防ぐ |
| Magic Link の期限切れ境界 | `WHERE used = 0 AND expires_at >= now` 付き UPDATE で期限切れ token を使用済みにしない |
| audit log の改ざん | update / delete / remove API を export しない |
| admin note の公開混入 | `PublicMemberProfile` / `MemberProfile` に `adminNotes` key を持たせない型テスト |
| staging D1 未配備 | in-memory D1 + migrations + fixture loader を Phase 11 代替 evidence にする |
| dependency-cruiser 未導入 | `.dependency-cruiser.cjs` は配置済み、実行 gate は `scripts/lint-boundaries.mjs` に限定 |

### 設定項目と定数一覧

| 項目 | 値 / 場所 | 備考 |
| --- | --- | --- |
| `SyncJobKind` | `"schema_sync" | "response_sync"` | Google Forms schema / response 同期 |
| `SyncJobStatus` | `"running" | "succeeded" | "failed"` | 終端状態からの遷移は禁止 |
| `ALLOWED_TRANSITIONS` | `syncJobs.ts` | `running -> succeeded/failed` のみ |
| Magic Link TTL | 呼び出し側 `ttlSec` | 05b では 900 秒推奨 |
| D1 binding | `env.DB` | `ctx(env)` で `DbCtx` に wrap |
| boundary gate | `scripts/lint-boundaries.mjs` | 現時点の実行可能 gate |
| dep-cruiser config | `.dependency-cruiser.cjs` | CI 実行は 09a / Wave 2 統合へ申し送り |

### テスト構成

| テスト | 対象 | 主な検証 |
| --- | --- | --- |
| `adminUsers.test.ts` | `adminUsers` | lookup / active 判定 |
| `adminNotes.test.ts` | `adminNotes` | CRUD / view model 混入防止 |
| `auditLog.test.ts` | `auditLog` | append / list / update-delete API 不在 |
| `syncJobs.test.ts` | `syncJobs` | 状態遷移 / 終端状態上書き防止 |
| `magicTokens.test.ts` | `magicTokens` | single-use / expired / not_found |
| `_setup.test.ts` | in-memory D1 loader | migration / reset / fixture load |
| `apps/web/src/lib/__tests__/boundary.test.ts` | boundary | web から D1/API token を直接持たないこと |

### やってはいけないこと（チェックリスト）

- [ ] `apps/web/**` から `apps/api/src/repository/**` を import しない（ESLint / boundary lint で error）
- [ ] `apps/web/**` で `D1Database` / `@cloudflare/workers-types` の D1 型を import しない
- [ ] `adminNotes` を `PublicMemberProfile` / `MemberProfile` builder の戻り値に混ぜない
- [ ] `auditLog` に update / delete / remove API を追加しない（追加すると AC-6 違反）
- [ ] `magicTokens.consume` を multi-use にしない（楽観 lock を外さない）
- [ ] `syncJobs` の status を直接 UPDATE しない（必ず `start` / `succeed` / `fail` 経由）
- [ ] `__fixtures__/admin.fixture.ts` を本番 seed に昇格させない（dev fixture のまま）
- [ ] 02a / 02b の repository から 02c を import しない、逆も禁止（cross-domain rule で阻止）
- [ ] D1 binding を直接 repository に渡さない（必ず `ctx(env)` 経由）
- [ ] 生 string を `AdminEmail` / `MagicTokenValue` / `AuditAction` 引数に渡さない（`adminEmail()` 等で wrap）

---

## 9. 引用 / 参考

- `apps/api/src/repository/{adminUsers,adminNotes,auditLog,syncJobs,magicTokens}.ts`
- `apps/api/src/repository/_shared/{db,brand}.ts`
- `apps/api/src/repository/__tests__/_setup.ts`
- `apps/api/src/repository/__fixtures__/admin.fixture.ts`
- `.dependency-cruiser.cjs`
- `scripts/lint-boundaries.mjs`
- `doc/00-getting-started-manual/specs/02-auth.md` / `08-free-database.md` / `11-admin-management.md` / `13-mvp-auth.md`
