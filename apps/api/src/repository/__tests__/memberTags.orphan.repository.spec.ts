// @vitest-environment node
// issue-1119 / member_tags 参照整合性ガード:
//   detectOrphanMemberTags / countOrphanMemberTags の read-only 検出を in-memory D1 で検証する。
//   防止は各 write 経路の tag_id 先在検証が担い、本関数群は既存孤児（member_tags.tag_id NOT IN tag_definitions）の
//   検出・監査を担う。app 層整合性ガード（no-FK 架構整合・0022_member_photos.sql:4）。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  assignTagsToMember,
  detectOrphanMemberTags,
  countOrphanMemberTags,
} from "../memberTags";
import { asMemberId, asTagId } from "../_shared/brand";

const insertTagDef = async (
  env: InMemoryD1,
  tagId: string,
  code: string,
): Promise<void> => {
  await env.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES (?1, ?2, ?2, 'occupation', '[]', 1)`,
    )
    .bind(tagId, code)
    .run();
};

const insertMemberTag = async (
  env: InMemoryD1,
  memberId: string,
  tagId: string,
  opts: { source?: string; assignedBy?: string | null } = {},
): Promise<void> => {
  await env.db
    .prepare(
      `INSERT INTO member_tags (member_id, tag_id, source, confidence, assigned_by)
       VALUES (?1, ?2, ?3, NULL, ?4)`,
    )
    .bind(memberId, tagId, opts.source ?? "manual", opts.assignedBy ?? null)
    .run();
};

describe("memberTags orphan detection repository (issue-1119)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("TC-R01: detectOrphanMemberTags は孤児行のみ返す（健全行は除外）", async () => {
    await insertTagDef(env, "tag_eng", "engineer");
    await insertMemberTag(env, "m1", "tag_eng", { assignedBy: "admin@example.com" });
    await insertMemberTag(env, "m1", "tag_ghost", { source: "manual", assignedBy: null });

    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(orphans).toHaveLength(1);
    expect(orphans[0]).toMatchObject({
      memberId: "m1",
      tagId: "tag_ghost",
      source: "manual",
      assignedBy: null,
    });
    expect(typeof orphans[0]?.assignedAt).toBe("string");
  });

  it("TC-R02: detectOrphanMemberTags は健全のみのとき空配列を返す", async () => {
    await insertTagDef(env, "tag_eng", "engineer");
    await insertMemberTag(env, "m1", "tag_eng");

    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(orphans).toEqual([]);
  });

  it("TC-R03: countOrphanMemberTags は孤児件数 1 を返す（detect 長と一致）", async () => {
    await insertTagDef(env, "tag_eng", "engineer");
    await insertMemberTag(env, "m1", "tag_eng");
    await insertMemberTag(env, "m1", "tag_ghost");

    const count = await countOrphanMemberTags(env.ctx);
    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(count).toBe(1);
    expect(count).toBe(orphans.length);
  });

  it("TC-R04: countOrphanMemberTags は健全のみのとき 0 を返す", async () => {
    await insertTagDef(env, "tag_eng", "engineer");
    await insertMemberTag(env, "m1", "tag_eng");

    const count = await countOrphanMemberTags(env.ctx);
    expect(count).toBe(0);
  });

  it("TC-R05: tag_definitions 空のとき全 member_tags 行が孤児として返る", async () => {
    await insertMemberTag(env, "m1", "tag_x");
    await insertMemberTag(env, "m1", "tag_y");

    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(orphans).toHaveLength(2);
    expect(orphans.map((o) => o.tagId)).toEqual(["tag_x", "tag_y"]);
  });

  it("TC-R06: 複数孤児は ORDER BY member_id, tag_id で返る", async () => {
    await insertMemberTag(env, "m2", "tag_z");
    await insertMemberTag(env, "m1", "tag_z");
    await insertMemberTag(env, "m1", "tag_a");

    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(orphans.map((o) => [o.memberId, o.tagId])).toEqual([
      ["m1", "tag_a"],
      ["m1", "tag_z"],
      ["m2", "tag_z"],
    ]);
  });

  it("TC-R07: count == detect.length が常に成立（同一 WHERE 句の整合）", async () => {
    await insertTagDef(env, "tag_eng", "engineer");
    await insertMemberTag(env, "m1", "tag_eng"); // 健全
    await insertMemberTag(env, "m1", "tag_ghost1"); // 孤児
    await insertMemberTag(env, "m2", "tag_ghost2"); // 孤児
    await insertMemberTag(env, "m3", "tag_ghost1"); // 孤児

    const count = await countOrphanMemberTags(env.ctx);
    const orphans = await detectOrphanMemberTags(env.ctx);
    expect(count).toBe(orphans.length);
    expect(count).toBe(3);
  });

  it("TC-R08: assignTagsToMember は未定義 tag_id を member_tags に書かない（AC-3）", async () => {
    await insertTagDef(env, "tag_eng", "engineer");

    const applied = await assignTagsToMember(
      env.ctx,
      asMemberId("m1"),
      [asTagId("tag_eng"), asTagId("tag_ghost")],
      "admin@example.com",
    );

    expect(applied).toBe(1);
    expect(await countOrphanMemberTags(env.ctx)).toBe(0);
    expect(await detectOrphanMemberTags(env.ctx)).toEqual([]);
    const rows = await env.db
      .prepare("SELECT tag_id FROM member_tags WHERE member_id = 'm1' ORDER BY tag_id")
      .all<{ tag_id: string }>();
    expect(rows.results.map((r) => r.tag_id)).toEqual(["tag_eng"]);
  });
});
