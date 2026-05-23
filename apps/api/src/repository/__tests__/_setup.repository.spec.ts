// @vitest-environment node
// AC-9: setupD1() が共通利用可能であることを検証
import { describe, it, expect } from "vitest";
import { setupD1 } from "./_setup";
import { seedAdminUsers, seedAdminNotes, seedAuditLog } from "../__fixtures__/admin.fixture";

describe("_setup (in-memory D1 loader)", () => {
  it("setupD1 でテーブル作成 + reset + fixture load が共通利用できる", async () => {
    const env = await setupD1();
    await env.loadFixtures([seedAdminUsers, seedAdminNotes, seedAuditLog]);
    const r = await env.db.prepare("SELECT COUNT(*) AS c FROM admin_users").first<{ c: number }>();
    expect(r?.c).toBe(1);
    const r2 = await env.db.prepare("SELECT COUNT(*) AS c FROM admin_member_notes").first<{ c: number }>();
    expect(r2?.c).toBe(2);
    const r3 = await env.db.prepare("SELECT COUNT(*) AS c FROM audit_log").first<{ c: number }>();
    expect(r3?.c).toBe(5);

    await env.reset();
    const r4 = await env.db.prepare("SELECT COUNT(*) AS c FROM admin_users").first<{ c: number }>();
    expect(r4?.c).toBe(0);
  });
});
