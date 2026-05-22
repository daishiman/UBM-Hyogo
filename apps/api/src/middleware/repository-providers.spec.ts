// issue-371 ut-02a-followup-003: attendanceProviderMiddleware の単体テスト。
// - middleware が `c.var.attendanceProvider` に AttendanceProvider 互換オブジェクトを bind すること
// - 上流が `c.set("ctx", ...)` 済みの場合はそれを再利用すること
// - 未設定でも `c.env.DB` から動的に組み立てること

import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import {
  attendanceProviderMiddleware,
  writeTagNoteProviderMiddleware,
  type RepositoryProviderVariables,
  type WriteTagNoteProviderVariables,
} from "./repository-providers";
import type { D1Db, DbCtx } from "../repository/_shared/db";

const fakeD1 = (calls: string[] = []): D1Db => ({
  prepare: () =>
    ({
      bind: () => ({
        first: async () => {
          calls.push("first");
          return null;
        },
        all: async () => {
          calls.push("all");
          return { results: [] };
        },
        run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
      }) as unknown as ReturnType<D1Db["prepare"]>,
      first: async () => null,
      all: async () => ({ results: [] }),
      run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
    }) as unknown as ReturnType<D1Db["prepare"]>,
  exec: async () => ({ count: 0, duration: 0 }),
});

describe("attendanceProviderMiddleware", () => {
  it("c.var.attendanceProvider に findByMemberIds を持つ provider を bind する", async () => {
    const app = new Hono<{
      Bindings: { DB: D1Database };
      Variables: RepositoryProviderVariables;
    }>();
    app.use("*", attendanceProviderMiddleware);
    app.get("/probe", (c) => {
      const provider = c.var.attendanceProvider;
      return c.json({
        bound: provider !== undefined && typeof provider.findByMemberIds === "function",
      });
    });

    const res = await app.request(
      "/probe",
      {},
      { DB: fakeD1() as unknown as D1Database },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ bound: true });
  });

  it("c.env.DB のみで動作する（上流 sessionGuard 不要 / admin route 経路）", async () => {
    const app = new Hono<{
      Bindings: { DB: D1Database };
      Variables: RepositoryProviderVariables;
    }>();
    app.use("*", attendanceProviderMiddleware);
    app.get("/probe", (c) => {
      return c.json({ ok: true, hasProvider: !!c.var.attendanceProvider });
    });

    const res = await app.request(
      "/probe",
      {},
      { DB: fakeD1() as unknown as D1Database },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, hasProvider: true });
  });

  it("上流 ctx がある場合は c.env.DB ではなく既存 ctx を再利用する", async () => {
    const upstreamCalls: string[] = [];
    const envCalls: string[] = [];
    const upstreamCtx: DbCtx = { db: fakeD1(upstreamCalls) };
    const app = new Hono<{
      Bindings: { DB: D1Database };
      Variables: RepositoryProviderVariables & { ctx: DbCtx };
    }>();
    app.use("*", async (c, next) => {
      c.set("ctx", upstreamCtx);
      await next();
    });
    app.use("*", attendanceProviderMiddleware);
    app.get("/probe", async (c) => {
      await c.var.attendanceProvider.findByMemberIds(["m_001" as never]);
      return c.json({ ok: true });
    });

    const res = await app.request(
      "/probe",
      {},
      { DB: fakeD1(envCalls) as unknown as D1Database },
    );
    expect(res.status).toBe(200);
    expect(upstreamCalls).toContain("all");
    expect(envCalls).toEqual([]);
  });
});

describe("writeTagNoteProviderMiddleware", () => {
  it("write/tag/note 系 6 provider を c.var に bind する", async () => {
    const app = new Hono<{
      Bindings: { DB: D1Database };
      Variables: Partial<RepositoryProviderVariables & WriteTagNoteProviderVariables>;
    }>();
    app.use("*", writeTagNoteProviderMiddleware);
    app.get("/probe", (c) => {
      return c.json({
        adminNotes: typeof c.var.adminNotesProvider?.create === "function",
        auditLog: typeof c.var.auditLogProvider?.append === "function",
        outbox: typeof c.var.notificationOutboxProvider?.enqueue === "function",
        tagDefinitions: typeof c.var.tagDefinitionsProvider?.findByCode === "function",
        tagQueue: typeof c.var.tagQueueProvider?.findQueueById === "function",
        memberTags: typeof c.var.memberTagsProvider?.assignTagsToMember === "function",
      });
    });

    const res = await app.request(
      "/probe",
      {},
      { DB: fakeD1() as unknown as D1Database },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      adminNotes: true,
      auditLog: true,
      outbox: true,
      tagDefinitions: true,
      tagQueue: true,
      memberTags: true,
    });
  });
});
