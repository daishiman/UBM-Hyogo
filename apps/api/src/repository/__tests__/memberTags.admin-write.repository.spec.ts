// @vitest-environment node
// issue-982 / task-A: admin manual 経路 repository 関数の unit spec。
//   in-memory D1（setupD1）で changes ベースの冪等判定・SELECT 整合を検証する。
//   （既存 memberTags.repository.spec.ts は d1mock 上の read 専用なので別ファイルに分離）
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  getTagDefinitionMaster,
  listAssignedTagsForMember,
  findTagDefinitionById,
  assignTagToMemberByAdmin,
  unassignTagFromMemberByAdmin,
  getMemberDeletedFlag,
} from "../memberTags";
import { asMemberId } from "../_shared/brand";

const seed = async (env: InMemoryD1) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m_del','del@example.com','rd','rd','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES ('m1','consented','consented','public',0),
              ('m_del','consented','consented','hidden',1)`,
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_mgr','manager','経営者','occupation','[]',1),
              ('tag_inact','inactive','非アクティブ','misc','[]',0)`,
    )
    .run();
};

describe("memberTags admin manual repository (issue-982)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("getTagDefinitionMaster は active=1 のみ TagRef で返す", async () => {
    const master = await getTagDefinitionMaster(env.ctx);
    const codes = master.map((t) => t.code);
    expect(codes).toContain("engineer");
    expect(codes).toContain("manager");
    expect(codes).not.toContain("inactive");
    expect(master[0]).toHaveProperty("tagId");
    expect(master[0]).toHaveProperty("category");
  });

  it("findTagDefinitionById は active な存在で TagRef、不在/非アクティブで null", async () => {
    expect(await findTagDefinitionById(env.ctx, "tag_eng")).toMatchObject({
      tagId: "tag_eng",
      code: "engineer",
    });
    expect(await findTagDefinitionById(env.ctx, "missing")).toBeNull();
    expect(await findTagDefinitionById(env.ctx, "tag_inact")).toBeNull();
  });

  it("assignTagToMemberByAdmin は新規付与で true、再付与で false（INSERT OR IGNORE 冪等）", async () => {
    const first = await assignTagToMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng", "admin@example.com");
    expect(first).toBe(true);
    const second = await assignTagToMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng", "admin@example.com");
    expect(second).toBe(false);

    const assigned = await listAssignedTagsForMember(env.ctx, asMemberId("m1"));
    expect(assigned.filter((t) => t.tagId === "tag_eng")).toHaveLength(1);
    expect(assigned[0]?.code).toBe("engineer");
  });

  it("unassignTagFromMemberByAdmin は削除行ありで true、無しで false（冪等）", async () => {
    await assignTagToMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng", "admin@example.com");
    const removed = await unassignTagFromMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng");
    expect(removed).toBe(true);
    const removedAgain = await unassignTagFromMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng");
    expect(removedAgain).toBe(false);
    expect(await listAssignedTagsForMember(env.ctx, asMemberId("m1"))).toHaveLength(0);
  });

  it("getMemberDeletedFlag: 不在=null / 在籍=false / 論理削除=true", async () => {
    expect(await getMemberDeletedFlag(env.ctx, asMemberId("nope"))).toBeNull();
    expect(await getMemberDeletedFlag(env.ctx, asMemberId("m1"))).toBe(false);
    expect(await getMemberDeletedFlag(env.ctx, asMemberId("m_del"))).toBe(true);
  });

  it("source は 'manual' で記録される", async () => {
    await assignTagToMemberByAdmin(env.ctx, asMemberId("m1"), "tag_eng", "admin@example.com");
    const row = await env.db
      .prepare("SELECT source, assigned_by FROM member_tags WHERE member_id='m1' AND tag_id='tag_eng'")
      .first<{ source: string; assigned_by: string }>();
    expect(row?.source).toBe("manual");
    expect(row?.assigned_by).toBe("admin@example.com");
  });
});
