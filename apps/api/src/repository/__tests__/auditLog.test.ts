// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as auditLog from "../auditLog";
import { adminEmail, auditAction } from "../_shared/brand";
import { seedAuditLog } from "../__fixtures__/admin.fixture";

describe("auditLog (append-only)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await env.loadFixtures([seedAuditLog]);
  });

  it("append で 1 件追加できる", async () => {
    const e = await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("test.fired"),
      targetType: "system",
      targetId: null,
      after: { ok: true },
    });
    expect(e.auditId).toBeTruthy();
    expect(e.after).toEqual({ ok: true });
  });

  it("listRecent で created_at 降順", async () => {
    const rows = await auditLog.listRecent(env.ctx, 10);
    expect(rows.length).toBe(5);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1]!.createdAt >= rows[i]!.createdAt).toBe(true);
    }
  });

  it("listByActor / listByTarget", async () => {
    const byActor = await auditLog.listByActor(
      env.ctx,
      adminEmail("owner@example.com"),
      10,
    );
    expect(byActor.length).toBe(5);

    const byTarget = await auditLog.listByTarget(env.ctx, "member", "m_001", 10);
    expect(byTarget.length).toBe(2);
  });

  it("listFiltered: action / actorEmail / targetType / targetId の複合 filter", async () => {
    const rows = await auditLog.listFiltered(env.ctx, {
      action: "member.note.created",
      actorEmail: "owner@example.com",
      targetType: "member",
      targetId: "m_001",
      limit: 10,
    });
    expect(rows.map((r) => r.auditId)).toEqual(["audit_003"]);
  });

  it("listFiltered: JST 由来 UTC range と cursor で created_at/audit_id 降順 pagination", async () => {
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, created_at) VALUES (?1, 'owner@example.com', 'attendance.add', 'meeting', 's1', ?2)",
      )
      .bind("audit_same_b", "2026-04-30T14:59:00.000Z")
      .run();
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, created_at) VALUES (?1, 'owner@example.com', 'attendance.add', 'meeting', 's1', ?2)",
      )
      .bind("audit_same_a", "2026-04-30T14:59:00.000Z")
      .run();

    const firstPage = await auditLog.listFiltered(env.ctx, {
      action: "attendance.add",
      fromUtc: "2026-04-30T14:00:00.000Z",
      toUtcExclusive: "2026-04-30T15:00:00.000Z",
      limit: 1,
    });
    expect(firstPage.map((r) => r.auditId)).toEqual(["audit_same_b"]);

    const secondPage = await auditLog.listFiltered(env.ctx, {
      action: "attendance.add",
      fromUtc: "2026-04-30T14:00:00.000Z",
      toUtcExclusive: "2026-04-30T15:00:00.000Z",
      cursor: {
        createdAt: firstPage[0]!.createdAt,
        auditId: firstPage[0]!.auditId,
      },
      limit: 1,
    });
    expect(secondPage.map((r) => r.auditId)).toEqual(["audit_same_a"]);
  });

  // AC-6: append-only。UPDATE / DELETE 関数は export されない。
  it("AC-6: UPDATE / DELETE API は型上不在", () => {
    // @ts-expect-error update は append-only モジュールに存在しない
    auditLog.update;
    // @ts-expect-error delete は append-only モジュールに存在しない
    auditLog.delete;
    // @ts-expect-error remove も無い
    auditLog.remove;
    expect(true).toBe(true);
  });
});
