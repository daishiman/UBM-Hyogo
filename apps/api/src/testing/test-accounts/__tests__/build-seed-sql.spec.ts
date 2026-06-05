import { describe, expect, it } from "vitest";
import { buildCleanupSql, buildManifest, buildSeedSql } from "../build-seed-sql";

describe("test account seed builder", () => {
  it("builds transactional idempotent SQL without bare inserts", () => {
    const sql = buildSeedSql();
    expect(sql.startsWith("BEGIN TRANSACTION;")).toBe(true);
    expect(sql.trimEnd().endsWith("COMMIT;")).toBe(true);
    expect(sql).not.toMatch(/(^|\n)INSERT INTO /);
    expect(sql).toContain("INSERT OR REPLACE INTO member_identities");
    expect(sql).toContain("INSERT OR IGNORE INTO member_tags");
    expect(sql).toContain("[TEST] 山田''太郎😀");
  });

  it("builds cleanup SQL scoped to TEST account ids only", () => {
    const sql = buildCleanupSql();
    expect(sql).toContain("DELETE FROM member_identities WHERE member_id IN ('TEST-MEM-01'");
    expect(sql).toContain("DELETE FROM admin_users WHERE admin_id IN ('TEST-ADM-01'");
    expect(sql).not.toContain("LIKE '%'");
  });

  it("builds manifest with loginable and publicListed flags", () => {
    const manifest = buildManifest();
    expect(manifest.members).toHaveLength(10);
    expect(manifest.members.filter((member) => member.loginable)).toHaveLength(7);
    expect(manifest.members.filter((member) => member.publicListed)).toHaveLength(5);
    expect(manifest.admins.filter((admin) => admin.active)).toHaveLength(2);
  });
});
