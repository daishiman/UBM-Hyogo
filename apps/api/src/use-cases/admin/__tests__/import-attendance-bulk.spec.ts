// @vitest-environment node
// ut-07c-followup-001 service unit test for importAttendanceBulk.
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { ctx } from "../../../repository/_shared/db";
import {
  asAdminId,
  adminEmail,
} from "../../../repository/_shared/brand";
import {
  importAttendanceBulk,
  classifyImportRow,
  SessionNotFoundError,
} from "../import-attendance-bulk";
import type { AuditLogProvider } from "../../../repository/auditLog";

const fakeAuditLog = () => {
  const appended: unknown[] = [];
  const provider: AuditLogProvider = {
    append: vi.fn(async (e) => {
      appended.push(e);
      return {
        auditId: `a_${appended.length}`,
        actorId: e.actorId,
        actorEmail: e.actorEmail,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        before: e.before ?? null,
        after: e.after ?? null,
        createdAt: new Date().toISOString(),
      };
    }),
    listRecent: vi.fn(async () => []),
    listByActor: vi.fn(async () => []),
    listByTarget: vi.fn(async () => []),
    listFiltered: vi.fn(async () => []),
  };
  return { provider, appended };
};

const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m_a','alpha@example.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m_b','beta@example.com','r2','r2','2026-04-01T00:00:00Z'),
              ('m_dead','dead@example.com','r3','r3','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_responses
       (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json, search_text)
       VALUES ('r1','f','v','h','alpha@example.com','2026-04-01T00:00:00Z','{}',''),
              ('r2','f','v','h','beta@example.com','2026-04-01T00:00:00Z','{}',''),
              ('r3','f','v','h','dead@example.com','2026-04-01T00:00:00Z','{}','')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s1','MTG','2026-04-01','sys')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, is_deleted) VALUES ('m_a',0),('m_b',0),('m_dead',1)`,
    )
    .run();
};

const actor = {
  id: asAdminId("m_admin"),
  email: adminEmail("admin@example.com"),
};

describe("importAttendanceBulk", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("case#6: duplicate 行検出", async () => {
    await env.db
      .prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m_a','s1','sys')")
      .run();
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(db, "s1", [{ memberId: "m_a" }], {
      commit: false,
      actor,
    });
    expect(result.rows[0].status).toBe("duplicate");
    expect(result.summary.duplicate).toBe(1);
  });

  it("case#7: deleted_member 検出 (D1 insert なし)", async () => {
    const { provider, appended } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(db, "s1", [{ memberId: "m_dead" }], {
      commit: true,
      actor,
    });
    expect(result.rows[0].status).toBe("deleted_member");
    expect(result.committed).toBe(false);
    expect(appended).toHaveLength(0);
    const n = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });

  it("case#8: unknown_member 検出", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(db, "s1", [{ email: "nope@example.com" }], {
      commit: false,
      actor,
    });
    expect(result.rows[0].status).toBe("unknown_member");
  });

  it("case#9: invalid (memberId/email どちらも無し)", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(db, "s1", [{}], {
      commit: false,
      actor,
    });
    expect(result.rows[0].status).toBe("invalid");
    expect(result.rows[0].message).toBe("memberId_or_email_required");
  });

  it("case#9b: memberId と email が別 member を指す → invalid + mismatch", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ memberId: "m_a", email: "beta@example.com" }],
      { commit: false, actor },
    );
    expect(result.rows[0].status).toBe("invalid");
    expect(result.rows[0].message).toBe("memberId_email_mismatch");
  });

  it("case#10: 成功行数 == audit_log 件数", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ memberId: "m_a" }, { email: "beta@example.com" }],
      { commit: true, actor },
    );
    expect(result.committed).toBe(true);
    expect(result.summary.ok).toBe(2);
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='attendance.import.add'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(2);
  });

  it("case#11: dry-run で副作用なし", async () => {
    const { provider, appended } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ memberId: "m_a" }, { email: "beta@example.com" }],
      { commit: false, actor },
    );
    expect(result.committed).toBe(false);
    expect(appended).toHaveLength(0);
    const n = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });

  it("session 未存在は SessionNotFoundError", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    await expect(
      importAttendanceBulk(db, "s_missing", [{ memberId: "m_a" }], {
        commit: false,
        actor,
      }),
    ).rejects.toBeInstanceOf(SessionNotFoundError);
  });

  it("F4: 同一 email 重複行は 2 行目以降 duplicate (commit 後の preview 想定)", async () => {
    await env.db
      .prepare("INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m_a','s1','sys')")
      .run();
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ email: "alpha@example.com" }, { memberId: "m_a" }],
      { commit: false, actor },
    );
    expect(result.rows[0].status).toBe("duplicate");
    expect(result.rows[1].status).toBe("duplicate");
  });

  it("F4b: 同一 CSV 内で同じ member を 2 回指定した場合は 2 行目以降 duplicate", async () => {
    const { provider, appended } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ email: "alpha@example.com" }, { memberId: "m_a" }],
      { commit: true, actor },
    );
    expect(result.committed).toBe(false);
    expect(result.rows[0].status).toBe("ok");
    expect(result.rows[1]).toMatchObject({
      status: "duplicate",
      memberId: "m_a",
      message: "duplicate_in_payload",
    });
    expect(appended).toHaveLength(0);
    const n = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    expect(n?.n).toBe(0);
  });

  it("F5: 全角 email も NFKC 正規化でマッチ", async () => {
    const { provider } = fakeAuditLog();
    const db = ctx({ DB: env.db as unknown as D1Database });
    const result = await importAttendanceBulk(
      db,
      "s1",
      [{ email: "ＡＬＰＨＡ@Example.com" }],
      { commit: false, actor },
    );
    expect(result.rows[0].status).toBe("ok");
    expect(result.rows[0].memberId).toBe("m_a");
  });

  it("F11: classifyImportRow 単体 — memberId_email_mismatch", () => {
    const lookup = {
      byMemberId: new Map([
        ["m_a", { memberId: "m_a" as never, isDeleted: false }],
        ["m_b", { memberId: "m_b" as never, isDeleted: false }],
      ]),
      byEmail: new Map([
        ["alpha@example.com", { memberId: "m_a" as never, isDeleted: false }],
        ["beta@example.com", { memberId: "m_b" as never, isDeleted: false }],
      ]),
    };
    const r = classifyImportRow(
      { memberId: "m_a", email: "beta@example.com" },
      0,
      lookup,
      new Set(),
    );
    expect(r.status).toBe("invalid");
    expect(r.message).toBe("memberId_email_mismatch");
  });

  it("F6: D1 batch 例外時は attendance / audit_log ともに追加されない", async () => {
    const { provider } = fakeAuditLog();
    const originalDb = env.db;
    const proxiedDb = new Proxy(originalDb, {
      get(target, prop, receiver) {
        if (prop === "batch") {
          return async () => {
            throw new Error("D1_NETWORK_ERROR");
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
    const db = ctx({ DB: proxiedDb as unknown as D1Database });
    await expect(
      importAttendanceBulk(
        db,
        "s1",
        [{ memberId: "m_a" }, { memberId: "m_b" }],
        { commit: true, actor },
      ),
    ).rejects.toThrow(/D1_NETWORK_ERROR/);
    const attendance = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_attendance WHERE session_id='s1'")
      .first<{ n: number }>();
    const audit = await env.db
      .prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action='attendance.import.add'")
      .first<{ n: number }>();
    expect(attendance?.n).toBe(0);
    expect(audit?.n).toBe(0);
  });
});
