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

  it("admin_member_note target type を append / filter / target lookup で round-trip できる", async () => {
    const entry = await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.request.approve"),
      targetType: "admin_member_note",
      targetId: "note_001",
      after: { noteId: "note_001", memberId: "m_001", resolution: "approve" },
    });

    expect(entry.targetType).toBe("admin_member_note");

    const byTarget = await auditLog.listByTarget(
      env.ctx,
      "admin_member_note",
      "note_001",
      10,
    );
    expect(byTarget).toHaveLength(1);
    expect(byTarget[0]).toMatchObject({
      targetType: "admin_member_note",
      targetId: "note_001",
      after: { noteId: "note_001", memberId: "m_001", resolution: "approve" },
    });

    const filtered = await auditLog.listFiltered(env.ctx, {
      targetType: "admin_member_note",
      targetId: "note_001",
      limit: 10,
    });
    expect(filtered.map((r) => r.auditId)).toEqual([entry.auditId]);
  });

  it("tag target type を append / filter / target lookup で round-trip できる", async () => {
    const entry = await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.tag.code_renamed"),
      targetType: "tag",
      targetId: "tag_001",
      before: { code: "engineer" },
      after: { code: "software_engineer" },
    });

    expect(entry.targetType).toBe("tag");

    const byTarget = await auditLog.listByTarget(env.ctx, "tag", "tag_001", 10);
    expect(byTarget).toHaveLength(1);
    expect(byTarget[0]).toMatchObject({
      targetType: "tag",
      targetId: "tag_001",
      before: { code: "engineer" },
      after: { code: "software_engineer" },
    });

    const filtered = await auditLog.listFiltered(env.ctx, {
      targetType: "tag",
      targetId: "tag_001",
      limit: 10,
    });
    expect(filtered.map((r) => r.auditId)).toEqual([entry.auditId]);
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

  it("listFiltered: batchId は after_json と before_json の両方を検索する", async () => {
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_assigned"),
      targetType: "member",
      targetId: "m_bulk_1",
      after: { tagId: "tag_a", source: "manual", batchId: "batch-1079" },
      createdAt: "2026-04-30T16:00:00.000Z",
    });
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_unassigned"),
      targetType: "member",
      targetId: "m_bulk_2",
      before: { tagId: "tag_b", batchId: "batch-1079" },
      createdAt: "2026-04-30T15:59:00.000Z",
    });
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_assigned"),
      targetType: "member",
      targetId: "m_bulk_3",
      after: { tagId: "tag_c", source: "manual", batchId: "batch-other" },
      createdAt: "2026-04-30T15:58:00.000Z",
    });
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES ('audit_broken_batch_json', 'owner@example.com', 'member.note.created', 'member', 'm_broken', '{broken', NULL, '2026-04-30T15:57:00.000Z')",
      )
      .run();

    const rows = await auditLog.listFiltered(env.ctx, {
      batchId: "batch-1079",
      limit: 10,
    });

    expect(rows.map((r) => r.action)).toEqual([
      "admin.member.tag_assigned",
      "admin.member.tag_unassigned",
    ]);
    expect(rows.map((r) => r.targetId)).toEqual(["m_bulk_1", "m_bulk_2"]);
  });

  it("listFiltered: batchId 検索は generated column index を使う", async () => {
    const queryPlan = await env.db
      .prepare(
        "EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = ?1 ORDER BY created_at DESC, audit_id DESC LIMIT ?2",
      )
      .bind("batch-1079", 10)
      .all<{ detail: string }>();

    const details = (queryPlan.results ?? []).map((row) => row.detail).join("\n");
    expect(details).toContain("idx_audit_log_batch_id");
    expect(details).not.toMatch(/\bSCAN audit_log\b/);
  });

  it("listFiltered: batchId と action は AND 結合される", async () => {
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_assigned"),
      targetType: "member",
      targetId: "m_bulk_1",
      after: { tagId: "tag_a", batchId: "batch-1079" },
      createdAt: "2026-04-30T16:00:00.000Z",
    });
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_unassigned"),
      targetType: "member",
      targetId: "m_bulk_2",
      before: { tagId: "tag_b", batchId: "batch-1079" },
      createdAt: "2026-04-30T15:59:00.000Z",
    });

    const rows = await auditLog.listFiltered(env.ctx, {
      action: "admin.member.tag_assigned",
      batchId: "batch-1079",
      limit: 10,
    });

    expect(rows.map((r) => r.action)).toEqual(["admin.member.tag_assigned"]);
    expect(rows.map((r) => r.targetId)).toEqual(["m_bulk_1"]);
  });

  it("listFiltered: batchId と cursor pagination を併用できる", async () => {
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_assigned"),
      targetType: "member",
      targetId: "m_bulk_1",
      after: { tagId: "tag_a", batchId: "batch-1079" },
      createdAt: "2026-04-30T16:00:00.000Z",
    });
    await auditLog.append(env.ctx, {
      actorId: null,
      actorEmail: adminEmail("owner@example.com"),
      action: auditAction("admin.member.tag_unassigned"),
      targetType: "member",
      targetId: "m_bulk_2",
      before: { tagId: "tag_b", batchId: "batch-1079" },
      createdAt: "2026-04-30T15:59:00.000Z",
    });

    const firstPage = await auditLog.listFiltered(env.ctx, {
      batchId: "batch-1079",
      limit: 1,
    });
    expect(firstPage.map((r) => r.targetId)).toEqual(["m_bulk_1"]);

    const secondPage = await auditLog.listFiltered(env.ctx, {
      batchId: "batch-1079",
      cursor: {
        createdAt: firstPage[0]!.createdAt,
        auditId: firstPage[0]!.auditId,
      },
      limit: 1,
    });
    expect(secondPage.map((r) => r.targetId)).toEqual(["m_bulk_2"]);
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
