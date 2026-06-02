// @vitest-environment node
// issue-1036 / task-A: bulkApplyMemberTagsByAdmin repository helper の unit test。
//   直積評価 / 部分失敗 status / DB 自然冪等 / member skip 優先 を route 層なしで検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import { bulkApplyMemberTagsByAdmin } from "../memberTags";
import { adminEmail } from "../_shared/brand";
import { asMemberId } from "@ubm-hyogo/shared";

const actor = { id: null, email: adminEmail("admin@example.com") };

const seed = async (env: InMemoryD1) => {
  await env.ctx.db
    .prepare(
      `INSERT INTO member_identities
       (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
       VALUES ('m1','m1@example.com','r1','r1','2026-04-01T00:00:00Z'),
              ('m2','m2@example.com','r2','r2','2026-04-01T00:00:00Z'),
              ('m_del','del@example.com','rd','rd','2026-04-01T00:00:00Z')`,
    )
    .run();
  await env.ctx.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted)
       VALUES ('m1','consented','consented','public',0),
              ('m2','consented','consented','public',0),
              ('m_del','consented','consented','hidden',1)`,
    )
    .run();
  await env.ctx.db
    .prepare(
      `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
       VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
              ('tag_inact','inactive','非アクティブ','misc','[]',0)`,
    )
    .run();
};

const memberTagCount = async (env: InMemoryD1, memberId: string): Promise<number> => {
  const r = await env.ctx.db
    .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE member_id = ?1")
    .bind(memberId)
    .first<{ n: number }>();
  return r?.n ?? 0;
};

describe("bulkApplyMemberTagsByAdmin (issue-1036 repository unit)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seed(env);
  }, 30000);

  it("直積 assign → 全 assigned + batchId 付与 + member_tags へ反映", async () => {
    const out = await bulkApplyMemberTagsByAdmin(
      env.ctx,
      { memberIds: [asMemberId("m1"), asMemberId("m2")], tagIds: ["tag_eng"], op: "assign" },
      actor,
    );
    expect(typeof out.batchId).toBe("string");
    expect(out.results).toHaveLength(2);
    expect(out.results.every((r) => r.status === "assigned")).toBe(true);
    expect(await memberTagCount(env, "m1")).toBe(1);
    expect(await memberTagCount(env, "m2")).toBe(1);
  });

  it("既存付与への再 assign は noop（複合 PK 自然冪等）", async () => {
    const input = {
      memberIds: [asMemberId("m1")],
      tagIds: ["tag_eng"],
      op: "assign" as const,
    };
    await bulkApplyMemberTagsByAdmin(env.ctx, input, actor);
    const out = await bulkApplyMemberTagsByAdmin(env.ctx, input, actor);
    expect(out.results[0]?.status).toBe("noop");
    expect(await memberTagCount(env, "m1")).toBe(1);
  });

  it("削除済み member は skipped_deleted（tag を評価せず）+ 他 member は継続", async () => {
    const out = await bulkApplyMemberTagsByAdmin(
      env.ctx,
      {
        memberIds: [asMemberId("m_del"), asMemberId("m1")],
        tagIds: ["tag_eng", "tag_inact"],
        op: "assign",
      },
      actor,
    );
    const delItems = out.results.filter((r) => r.memberId === "m_del");
    expect(delItems.every((r) => r.status === "skipped_deleted")).toBe(true);
    expect(await memberTagCount(env, "m_del")).toBe(0);
    // m1 は tag_eng=assigned, tag_inact=tag_not_found
    const m1 = Object.fromEntries(
      out.results.filter((r) => r.memberId === "m1").map((r) => [r.tagId, r.status]),
    );
    expect(m1.tag_eng).toBe("assigned");
    expect(m1.tag_inact).toBe("tag_not_found");
  });

  it("unassign：付与済みは unassigned、未付与は noop", async () => {
    await bulkApplyMemberTagsByAdmin(
      env.ctx,
      { memberIds: [asMemberId("m1")], tagIds: ["tag_eng"], op: "assign" },
      actor,
    );
    const out = await bulkApplyMemberTagsByAdmin(
      env.ctx,
      { memberIds: [asMemberId("m1"), asMemberId("m2")], tagIds: ["tag_eng"], op: "unassign" },
      actor,
    );
    const byMember = Object.fromEntries(out.results.map((r) => [r.memberId, r.status]));
    expect(byMember.m1).toBe("unassigned");
    expect(byMember.m2).toBe("noop");
    expect(await memberTagCount(env, "m1")).toBe(0);
  });

  it("memberIds / tagIds の重複は dedupe される", async () => {
    const out = await bulkApplyMemberTagsByAdmin(
      env.ctx,
      {
        memberIds: [asMemberId("m1"), asMemberId("m1")],
        tagIds: ["tag_eng", "tag_eng"],
        op: "assign",
      },
      actor,
    );
    expect(out.results).toHaveLength(1);
  });

  it("空 memberIds → 空 results（batchId は返す）", async () => {
    const out = await bulkApplyMemberTagsByAdmin(
      env.ctx,
      { memberIds: [], tagIds: ["tag_eng"], op: "assign" },
      actor,
    );
    expect(out.results).toHaveLength(0);
    expect(typeof out.batchId).toBe("string");
  });
});
