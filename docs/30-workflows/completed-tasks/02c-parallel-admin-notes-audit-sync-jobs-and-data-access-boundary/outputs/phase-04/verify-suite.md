# Phase 4 — verify-suite: 詳細

## 1. unit test（vitest）

| ファイル | 対象 | 主要ケース |
| --- | --- | --- |
| `apps/api/src/repository/__tests__/adminUsers.test.ts` | adminUsers.ts | findByEmail / listAll / touchLastSeen の整合 |
| `apps/api/src/repository/__tests__/adminNotes.test.ts` | adminNotes.ts | listByMemberId / create / update / remove の CRUD |
| `apps/api/src/repository/__tests__/auditLog.test.ts` | auditLog.ts | append のみで read pass、UPDATE/DELETE の型エラー |
| `apps/api/src/repository/__tests__/syncJobs.test.ts` | syncJobs.ts | start → succeed / fail、逆遷移で throw |
| `apps/api/src/repository/__tests__/magicTokens.test.ts` | magicTokens.ts | issue / verify / consume の single-use |
| `apps/api/src/repository/__tests__/_setup.test.ts` | __tests__/_setup.ts | 02a/02b/02c の fixture を loadFixtures で読める |

### サンプル: `magicTokens.test.ts`

```ts
import { setupD1 } from "./_setup";
import * as magicTokens from "../magicTokens";
import { magicTokenValue } from "../_shared/brand";

describe("magicTokens single-use", () => {
  it("consume を 2 回呼ぶと 2 回目は already_used", async () => {
    const env = await setupD1();
    const issued = await magicTokens.issue(env.ctx, { email: "u@x.com", purpose: "login", ttlSec: 600 });
    const r1 = await magicTokens.consume(env.ctx, issued.token, "2026-04-27T00:00:00Z");
    expect(r1.ok).toBe(true);
    const r2 = await magicTokens.consume(env.ctx, issued.token, "2026-04-27T00:00:01Z");
    expect(r2).toEqual({ ok: false, reason: "already_used" });
  });

  it("expired token の consume は expired", async () => {
    const env = await setupD1();
    const issued = await magicTokens.issue(env.ctx, { email: "u@x.com", purpose: "login", ttlSec: -1 });
    const r = await magicTokens.consume(env.ctx, issued.token, new Date().toISOString());
    expect(r).toEqual({ ok: false, reason: "expired" });
  });
});
```

## 2. boundary test（dep-cruiser / ESLint）

| 検証 | 対象 |
| --- | --- |
| dep-cruiser | `apps/web/**` → `apps/api/src/repository/**` で violation error |
| dep-cruiser | `apps/web/**` → `D1Database` import で violation error |
| dep-cruiser | 02a の `members.ts` → 02b の `meetings.ts` で violation error |
| dep-cruiser | 02b の `tagQueue.ts` → 02c の `auditLog.ts` で violation error |
| dep-cruiser | 02c の `adminNotes.ts` → 02a の `members.ts` で violation error |
| ESLint | `apps/web/src/page.tsx` で `import "@/api/repository/adminNotes"` を書くと lint error |
| ESLint | `apps/web/src/page.tsx` で `import { D1Database } from "@cloudflare/workers-types"` で lint error |

### CI 実行例

```bash
# 違反 snippet で dep-cruiser が error を出すことを assert
pnpm depcruise --config .dependency-cruiser.cjs apps/api apps/web --output-type err

# apps/web の lint
pnpm --filter apps/web lint
```

## 3. invariant test（API 不在 / 振る舞い / 状態遷移）

| シナリオ | 期待動作 | 実装 |
| --- | --- | --- |
| `auditLog.update("id", {})` | 型エラー | `// @ts-expect-error` |
| `auditLog.delete("id")` | 型エラー | `// @ts-expect-error` |
| `magicTokens.consume` 二重呼出 | `{ ok: false, reason: "already_used" }` | unit test |
| `magicTokens.consume` expired | `{ ok: false, reason: "expired" }` | unit test |
| `syncJobs.succeed("invalid_id", {})` | throw `Error: sync_job ... not found` | unit test |
| `syncJobs.fail` を succeeded 状態に対して | throw `IllegalStateTransition` | unit test |

```ts
// auditLog API 不在の type test
import * as auditLog from "../auditLog";

// @ts-expect-error: auditLog.update is not exported (append-only)
auditLog.update("id", {});

// @ts-expect-error: auditLog.delete is not exported (append-only)
auditLog.delete("id");
```

## 4. fixture / in-memory D1（02a / 02b 共通利用）

```ts
// apps/api/src/repository/__fixtures__/admin.fixture.ts
// dev only — このファイルは prod build から exclude される（不変条件 #6）
import { adminEmail, memberId } from "../_shared/brand";
import type { AdminUserRow, AdminMemberNoteRow } from "../adminUsers";
import type { AuditLogEntry } from "../auditLog";

export const fixtureAdminUsers: AdminUserRow[] = [
  { email: adminEmail("owner@example.com"),   role: "owner",   createdAt: "2026-04-01T00:00:00Z", lastSeenAt: null },
  { email: adminEmail("manager@example.com"), role: "manager", createdAt: "2026-04-01T00:00:00Z", lastSeenAt: null },
];

export const fixtureAdminNotes: AdminMemberNoteRow[] = [
  { noteId: "note_001", memberId: memberId("m_001"), body: "初回コンタクト OK", createdBy: adminEmail("owner@example.com"), createdAt: "2026-04-10T00:00:00Z", updatedAt: "2026-04-10T00:00:00Z" },
  { noteId: "note_002", memberId: memberId("m_002"), body: "要フォロー",        createdBy: adminEmail("owner@example.com"), createdAt: "2026-04-11T00:00:00Z", updatedAt: "2026-04-11T00:00:00Z" },
];

export const fixtureAuditLog: AuditLogEntry[] = [
  { id: "audit_001", actor: adminEmail("owner@example.com"), action: "member.publish_state_changed", targetType: "member", targetId: "m_001", metadata: { from: "hidden", to: "public" }, occurredAt: "2026-04-10T00:00:00Z" },
  { id: "audit_002", actor: adminEmail("owner@example.com"), action: "tag.queue.resolved",            targetType: "tag_queue", targetId: "tq_001", metadata: { resolution: "approved" }, occurredAt: "2026-04-11T00:00:00Z" },
  { id: "audit_003", actor: adminEmail("manager@example.com"), action: "member.note.created",        targetType: "member", targetId: "m_001", metadata: { noteId: "note_001" }, occurredAt: "2026-04-10T00:00:00Z" },
  { id: "audit_004", actor: adminEmail("manager@example.com"), action: "schema.diff.alias_assigned", targetType: "schema_diff", targetId: "sd_001", metadata: { aliasFor: "q_007" }, occurredAt: "2026-04-12T00:00:00Z" },
  { id: "audit_005", actor: adminEmail("owner@example.com"), action: "member.deleted",               targetType: "member", targetId: "m_999", metadata: {}, occurredAt: "2026-04-12T00:00:00Z" },
];
```

```ts
// apps/api/src/repository/__tests__/_setup.ts （02a/02b/02c 共通）
import { ctx } from "../_shared/db";

export interface InMemoryD1 {
  ctx: ReturnType<typeof ctx>;
  loadFixtures: (paths: string[]) => Promise<void>;
  reset: () => Promise<void>;
}

export const setupD1 = async (): Promise<InMemoryD1> => {
  const db = await createInMemoryD1();        // miniflare D1 / wrangler.unstable_dev
  await db.exec(loadAllMigrations());          // 01a の全 migration
  return {
    ctx: ctx({ DB: db }),
    loadFixtures: async (paths) => {
      for (const p of paths) await applyFixture(db, p);
    },
    reset: async () => { await truncateAllTables(db); },
  };
};
```

## 5. type test（3 ケース）

```ts
// apps/api/src/repository/__tests__/types.test-d.ts
import type { PublicMemberProfile } from "@repo/shared/view-models/member";
import * as auditLog from "../auditLog";
import * as magicTokens from "../magicTokens";

declare const p: PublicMemberProfile;

// AC-2: PublicMemberProfile に adminNotes プロパティが存在しない
// @ts-expect-error: adminNotes は public/member view model に混ざらない (不変条件 #12)
const _x = p.adminNotes;

// AC-6: auditLog に UPDATE / DELETE API が無い
// @ts-expect-error
auditLog.update;
// @ts-expect-error
auditLog.delete;

// brand check: MagicTokenValue が必要
// @ts-expect-error: raw string では呼べない
magicTokens.consume({} as any, "raw_string", "2026-04-27T00:00:00Z");
```

## 6. dep-cruiser config（再掲）

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

## 7. ESLint config（再掲）

```js
// apps/web/eslint.config.js
export default [
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

## 8. CI への組み込み

```json
// package.json (root) script 案
{
  "scripts": {
    "ci:boundary": "depcruise --config .dependency-cruiser.cjs apps/api apps/web",
    "ci:lint": "pnpm -r lint",
    "ci:typecheck": "pnpm -r typecheck",
    "ci:test:repo": "pnpm --filter apps/api test repository",
    "ci:all": "pnpm ci:boundary && pnpm ci:lint && pnpm ci:typecheck && pnpm ci:test:repo"
  }
}
```

CI が `ci:all` を必須通過とすることで、AC-3/4/5/11 が自動的に検証される。
