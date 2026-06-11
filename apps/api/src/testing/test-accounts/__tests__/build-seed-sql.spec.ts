import { describe, expect, it } from "vitest";
import { STABLE_KEY } from "@ubm-hyogo/shared";
import { testAccountsCatalog } from "../catalog";
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
    expect(sql).toContain(sqlFragment("TEST-RES-06", STABLE_KEY.businessOverview));
    expect(sql).toContain(sqlFragment("TEST-RES-06", STABLE_KEY.birthDate));
    expect(sql).toContain(sqlFragment("TEST-RES-06", STABLE_KEY.publicConsent));
    expect(sql).toContain("INSERT OR REPLACE INTO schema_questions");
    expect(sql).toContain("'TEST-REV-ACCOUNTS:businessOverview'");
    expect(sql).toContain("INSERT OR REPLACE INTO member_field_visibility");
    expect(sql).toContain("'TEST-MEM-06', 'birthDate', 'member'");
    expect(sql).toContain("'TEST-MEM-06', 'publicConsent', 'admin'");
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
    expect(sql).toContain("DELETE FROM member_field_visibility WHERE member_id IN ('TEST-MEM-01'");
    expect(sql).toContain("DELETE FROM admin_users WHERE admin_id IN ('TEST-ADM-01'");
    expect(sql).toContain("DELETE FROM admin_member_notes WHERE note_id LIKE 'TEST-NOTE-%';");
    expect(sql).not.toContain("LIKE '%'");
  });

  it("emits all 31 form stable keys for every member response and visibility map", () => {
    const sql = buildSeedSql();
    const schemaQuestionsBlock = blockFor(sql, "schema_questions");
    const responseFieldsBlock = blockFor(sql, "response_fields");
    const visibilityBlock = blockFor(sql, "member_field_visibility");
    const schemaRows = [...schemaQuestionsBlock.matchAll(/\('TEST-REV-ACCOUNTS:/g)];
    expect(schemaRows).toHaveLength(31);
    for (const member of testAccountsCatalog.members) {
      const responseRows = [
        ...responseFieldsBlock.matchAll(new RegExp(`\\('${member.responseId}', `, "g")),
      ];
      const visibilityRows = [
        ...visibilityBlock.matchAll(new RegExp(`\\('${member.memberId}', `, "g")),
      ];
      expect(responseRows, member.responseId).toHaveLength(31);
      expect(visibilityRows, member.memberId).toHaveLength(31);
    }
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

const blockFor = (sql: string, table: string): string => {
  const marker = `INSERT OR REPLACE INTO ${table}`;
  const start = sql.indexOf(marker);
  expect(start, table).toBeGreaterThanOrEqual(0);
  const end = sql.indexOf(";\n\n", start);
  return sql.slice(start, end >= 0 ? end : undefined);
};
