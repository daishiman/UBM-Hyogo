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
