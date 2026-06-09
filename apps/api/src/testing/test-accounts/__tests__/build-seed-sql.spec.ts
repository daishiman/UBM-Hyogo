import { describe, expect, it } from "vitest";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { buildCleanupSql, buildManifest, buildSeedSql } from "../build-seed-sql";

describe("test account seed builder", () => {
  it("builds non-transactional idempotent SQL without bare inserts", () => {
    const sql = buildSeedSql();
    // Cloudflare D1 の remote 実行は明示 BEGIN TRANSACTION / COMMIT を拒否する
    // （wrangler d1 execute --file が全文を暗黙アトミックに実行するため）。
    // 出力に明示トランザクションが混ざっていないことを退行ガードとして保証する。
    expect(sql).not.toMatch(/BEGIN TRANSACTION/);
    expect(sql).not.toMatch(/(^|\n)COMMIT;/);
    expect(sql.startsWith("INSERT OR REPLACE INTO schema_versions")).toBe(true);
    expect(sql).not.toMatch(/(^|\n)INSERT INTO /);
    expect(sql).toContain("INSERT OR REPLACE INTO member_identities");
    expect(sql).toContain("INSERT OR IGNORE INTO member_tags");
    expect(sql).toContain("INSERT OR REPLACE INTO admin_member_notes");
    expect(sql).toContain("[TEST] 山田''太郎😀");
    expect(sql).toContain(sqlFragment("TEST-RES-01", STABLE_KEY.selfIntroduction));
    expect(sql).toContain(sqlFragment("TEST-RES-01", STABLE_KEY.urlLinkedin));
  });

  it("builds pending admin request notes for existing test members", () => {
    const sql = buildSeedSql();
    expect(sql).toContain("'TEST-NOTE-V01', 'TEST-MEM-01'");
    expect(sql).toContain("'TEST-NOTE-V02', 'TEST-MEM-02'");
    expect(sql).toContain("'TEST-NOTE-D01', 'TEST-MEM-07'");
    expect(sql).toContain("'visibility_request', 'pending'");
    expect(sql).toContain("'delete_request', 'pending'");
    expect(sql).toContain("json_object('reason', '都合により一時的に掲載を止めたいです'");
    expect(sql).toContain("'payload', json('{\"desiredState\":\"hidden\"}')");
  });

  it("builds cleanup SQL scoped to TEST account ids only", () => {
    const sql = buildCleanupSql();
    expect(sql).toContain("DELETE FROM member_identities WHERE member_id IN ('TEST-MEM-01'");
    expect(sql).toContain("DELETE FROM admin_users WHERE admin_id IN ('TEST-ADM-01'");
    expect(sql).toContain("DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';");
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

const sqlFragment = (responseId: string, stableKey: string): string =>
  `('${responseId}', '${stableKey}',`;
